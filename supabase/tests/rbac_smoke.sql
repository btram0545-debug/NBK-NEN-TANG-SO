-- Kiểm thử phân quyền (RBAC + RLS) bằng SQL thuần — chạy được với psql / Supabase local.
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rbac_smoke.sql
-- Tạo dữ liệu thử rồi DỌN SẠCH ở cuối. KHÔNG chạy trên database production.

create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
  if u is null then execute 'set local role anon'; else execute 'set local role authenticated'; end if;
end $$;

create or replace function pg_temp.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAIL: %', msg; end if;
  raise notice 'ok   - %', msg;
end $$;

-- chạy câu lệnh và mong đợi lỗi (permission / not_allowed / RLS)
create or replace function pg_temp.denied(sql text, msg text) returns void language plpgsql as $$
declare failed boolean := false;
begin
  begin execute sql; exception when others then failed := true; end;
  if not failed then raise exception 'FAIL (đáng lẽ phải bị chặn): %', msg; end if;
  raise notice 'ok   - bị chặn: %', msg;
end $$;

-- ---------- Chuẩn bị ----------
do $$
declare
  s1 uuid := '00000000-0000-0000-0000-0000000000a1'; s2 uuid := '00000000-0000-0000-0000-0000000000a2';
  t1 uuid := '00000000-0000-0000-0000-0000000000b1'; c1 uuid := '00000000-0000-0000-0000-0000000000b2';
  sv uuid := '00000000-0000-0000-0000-0000000000c1'; ad uuid := '00000000-0000-0000-0000-0000000000d1';
  evil uuid := '00000000-0000-0000-0000-0000000000e1';
begin
  insert into auth.users (id, email) values
    (s1,'s1@t'),(s2,'s2@t'),(t1,'t1@t'),(c1,'c1@t'),(sv,'sv@t'),(ad,'ad@t');
  insert into auth.users (id, email, raw_user_meta_data) values (evil,'evil@t','{"role":"admin","full_name":"Kẻ gian"}');
  update public.users set role='student', full_name='Học sinh 1', class_name='11A2' where id = s1;
  update public.users set role='student', full_name='Học sinh 2', class_name='10A1' where id = s2;
  update public.users set role='teacher', full_name='Giáo viên' where id = t1;
  update public.users set role='counselor', full_name='Tư vấn viên' where id = c1;
  update public.users set role='supervisor', full_name='Quản sinh' where id = sv;
  update public.users set role='admin', full_name='BGH' where id = ad;
  perform pg_temp.ok((select role from public.users where id = evil) = 'student', 'đăng ký mới luôn là student dù metadata ghi role=admin');
end $$;

-- ---------- Học sinh ----------
do $$
declare s1 uuid := '00000000-0000-0000-0000-0000000000a1'; s2 uuid := '00000000-0000-0000-0000-0000000000a2';
begin
  perform pg_temp.as_user(s1);
  insert into public.incidents (id, reporter_id, incident_type, severity, description, is_anonymous)
    values ('aaaaaaaa-0000-0000-0000-000000000001', s1, 'cyberbullying', 'serious', 'Nội dung báo cáo', true);
  insert into public.counseling_requests (id, student_id, category, description, is_anonymous, privacy_level)
    values ('bbbbbbbb-0000-0000-0000-000000000001', s1, 'emotions', 'Nội dung tư vấn riêng tư', false, 'restricted');
  perform pg_temp.ok((select count(*) from public.incidents) = 1, 'học sinh thấy báo cáo của mình');
  perform pg_temp.denied($q$insert into public.incidents (reporter_id, incident_type, description) values ('00000000-0000-0000-0000-0000000000a2','other','giả mạo')$q$, 'học sinh không tạo báo cáo mạo danh học sinh khác');
  perform pg_temp.denied($q$insert into public.incidents (reporter_id, incident_type, description, status) values ('00000000-0000-0000-0000-0000000000a1','other','x','resolved')$q$, 'học sinh không tự đặt trạng thái khi tạo');
  perform pg_temp.denied($q$update public.users set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1'$q$, 'học sinh không tự nâng quyền');
  update public.users set phone = '0900000000' where id = s1;
  perform pg_temp.ok((select phone from public.users where id = s1) = '0900000000', 'học sinh sửa được thông tin liên hệ của mình');
  perform pg_temp.ok((select count(*) from public.staff_incidents) = 0, 'học sinh không đọc được view của nhân sự');
  perform pg_temp.denied($q$select public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001','resolved')$q$, 'học sinh không gọi được RPC xử lý ca');
  perform pg_temp.denied($q$select public.admin_overview()$q$, 'học sinh không xem thống kê');
  perform pg_temp.denied($q$select * from public.admin_audit_logs()$q$, 'học sinh không xem audit log');
  perform pg_temp.ok((select count(*) from public.audit_logs) = 0, 'học sinh không đọc được audit_logs');

  perform pg_temp.as_user(s2);
  perform pg_temp.ok((select count(*) from public.incidents) = 0 and (select count(*) from public.counseling_requests) = 0, 'học sinh khác không thấy dữ liệu của bạn');
  perform pg_temp.ok((select count(*) from public.case_events) = 0, 'học sinh khác không thấy dòng thời gian của ca người khác');

  perform pg_temp.as_user(null);
  perform pg_temp.denied($q$select * from public.incidents$q$, 'người chưa đăng nhập (anon) không đọc được bảng');
  perform pg_temp.denied($q$select * from public.staff_incidents$q$, 'anon không đọc được view');
  perform pg_temp.denied($q$select public.admin_overview()$q$, 'anon không gọi được RPC');
end $$;

-- ---------- Nhân sự: phạm vi & che dữ liệu ----------
do $$
declare t1 uuid := '00000000-0000-0000-0000-0000000000b1'; c1 uuid := '00000000-0000-0000-0000-0000000000b2';
        sv uuid := '00000000-0000-0000-0000-0000000000c1'; ad uuid := '00000000-0000-0000-0000-0000000000d1';
        s1 uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  perform pg_temp.as_user(t1);
  perform pg_temp.ok((select count(*) from public.staff_incidents) = 0 and (select count(*) from public.staff_counseling) = 0, 'giáo viên chưa được giao ca thì không thấy ca nào');

  perform pg_temp.as_user(sv);
  perform pg_temp.ok((select count(*) from public.staff_incidents) = 1, 'quản sinh thấy báo cáo');
  perform pg_temp.ok((select reporter_id from public.staff_incidents) is null and (select reporter_name from public.staff_incidents) is null, 'báo cáo ẩn danh: quản sinh KHÔNG thấy danh tính người gửi');
  perform pg_temp.ok((select description from public.staff_incidents) is not null, 'quản sinh đọc được nội dung báo cáo để xử lý');
  perform pg_temp.ok((select description from public.staff_counseling) is null and (select reporter_name from public.staff_counseling) is null, 'tư vấn riêng tư cao: quản sinh không thấy nội dung / danh tính');
  perform pg_temp.ok((select count(*) from public.incidents) = 0, 'quản sinh không đọc bảng gốc (chỉ qua view che dữ liệu)');

  -- giao ca
  perform public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', p_assignee => t1, p_set_assignee => true);
  perform public.staff_update_case('counseling','bbbbbbbb-0000-0000-0000-000000000001', p_assignee => c1, p_set_assignee => true);
  perform pg_temp.denied($q$select public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', p_assignee => '00000000-0000-0000-0000-0000000000a1', p_set_assignee => true)$q$, 'không thể giao ca cho học sinh');

  perform pg_temp.as_user(t1);
  perform pg_temp.ok((select count(*) from public.staff_incidents) = 1, 'giáo viên thấy ca được giao');
  perform pg_temp.ok((select count(*) from public.staff_counseling) = 0, 'giáo viên không thấy ca tư vấn của người khác');
  perform pg_temp.denied($q$select public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', p_severity => 'urgent')$q$, 'giáo viên không đổi mức độ');
  perform pg_temp.denied($q$select public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', p_escalate => true)$q$, 'giáo viên không chuyển lên BGH');
  perform pg_temp.denied($q$select public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', 'archived')$q$, 'giáo viên không lưu trữ ca');
  perform pg_temp.denied($q$select public.staff_update_case('counseling','bbbbbbbb-0000-0000-0000-000000000001', 'resolved')$q$, 'giáo viên không sửa ca không được giao');
  perform public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', 'in_progress', p_note => 'Đã gặp lớp trưởng');
  perform pg_temp.ok((select status from public.staff_incidents) = 'in_progress', 'giáo viên cập nhật trạng thái ca của mình');

  -- tư vấn viên & ghi chú riêng tư
  perform pg_temp.as_user(c1);
  perform pg_temp.ok((select description from public.staff_counseling) is not null, 'tư vấn viên được giao đọc được nội dung tư vấn riêng tư');
  perform public.add_private_note('bbbbbbbb-0000-0000-0000-000000000001', 'Ghi chú riêng của tư vấn viên');
  perform pg_temp.ok((select count(*) from public.private_case_notes) = 1, 'tư vấn viên đọc ghi chú của mình');
  perform pg_temp.ok(((public.get_private_notes('bbbbbbbb-0000-0000-0000-000000000001')) ->> 'locked')::boolean = false, 'RPC ghi chú mở cho tư vấn viên');

  perform pg_temp.as_user(t1);
  perform pg_temp.denied($q$select public.add_private_note('bbbbbbbb-0000-0000-0000-000000000001', 'xen vào')$q$, 'giáo viên không ghi chú riêng tư');
  perform pg_temp.ok((select count(*) from public.private_case_notes) = 0, 'giáo viên không đọc được ghi chú riêng tư');

  perform pg_temp.as_user(sv);
  perform pg_temp.ok(((public.get_private_notes('bbbbbbbb-0000-0000-0000-000000000001')) ->> 'locked')::boolean, 'quản sinh: ghi chú riêng tư bị khóa');
  perform pg_temp.as_user(ad);
  perform pg_temp.ok(((public.get_private_notes('bbbbbbbb-0000-0000-0000-000000000001')) ->> 'locked')::boolean, 'BGH: ghi chú riêng tư mặc định bị khóa (cần cấp quyền)');
  perform public.grant_private_note_access('bbbbbbbb-0000-0000-0000-000000000001', ad, 7);
  perform pg_temp.ok(not ((public.get_private_notes('bbbbbbbb-0000-0000-0000-000000000001')) ->> 'locked')::boolean, 'BGH đọc được ghi chú sau khi được cấp quyền có thời hạn');

  perform pg_temp.as_user(s1);
  perform pg_temp.ok((select count(*) from public.private_case_notes) = 0, 'học sinh không bao giờ thấy ghi chú riêng tư');
  perform pg_temp.ok((select count(*) from public.case_events where event_type = 'note') = 0, 'học sinh không thấy ghi nhận nội bộ của nhân sự');
  perform pg_temp.ok((select count(*) from public.case_events) >= 3, 'học sinh vẫn thấy dòng thời gian xử lý của mình');
  perform pg_temp.ok((select count(*) from public.notifications where user_id = s1) >= 1, 'học sinh nhận thông báo khi trạng thái đổi');
end $$;

-- ---------- Ban giám hiệu, quản trị ----------
do $$
declare sv uuid := '00000000-0000-0000-0000-0000000000c1'; ad uuid := '00000000-0000-0000-0000-0000000000d1';
        s2 uuid := '00000000-0000-0000-0000-0000000000a2'; s1 uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  perform pg_temp.as_user(sv);
  perform public.staff_update_case('incident','aaaaaaaa-0000-0000-0000-000000000001', p_escalate => true);
  perform pg_temp.ok((select severity from public.staff_incidents) = 'urgent' and (select escalated_at from public.staff_incidents) is not null, 'quản sinh chuyển ca lên BGH (mức Khẩn cấp)');
  perform pg_temp.ok((public.admin_overview() -> 'totals' ->> 'incidents')::int = 1, 'quản sinh xem được thống kê tổng hợp');
  perform pg_temp.denied($q$select * from public.admin_audit_logs()$q$, 'quản sinh không xem audit log');
  perform pg_temp.denied($q$select public.approve_intervention('incident','aaaaaaaa-0000-0000-0000-000000000001')$q$, 'quản sinh không phê duyệt can thiệp');
  perform pg_temp.denied($q$select * from public.admin_list_users()$q$, 'quản sinh không quản lý người dùng');

  perform pg_temp.as_user(ad);
  perform pg_temp.ok((select count(*) from public.notifications where user_id = ad and title like 'Ca được chuyển%') = 1, 'BGH nhận thông báo ca được chuyển lên');
  perform public.approve_intervention('incident','aaaaaaaa-0000-0000-0000-000000000001', 'Đồng ý phương án');
  perform pg_temp.ok((select count(*) from public.case_events where event_type = 'approved') = 1, 'BGH phê duyệt can thiệp, có sự kiện trên dòng thời gian');
  perform pg_temp.ok((select count(*) from public.admin_audit_logs()) >= 6, 'BGH xem được audit log (có ghi lại các hành động ở trên)');
  perform pg_temp.ok((select count(*) from public.admin_list_users()) >= 7, 'BGH xem danh sách người dùng');
  perform pg_temp.denied($q$select public.admin_set_user('00000000-0000-0000-0000-0000000000d1', 'student')$q$, 'BGH không tự hạ quyền chính mình');

  -- vô hiệu hóa học sinh 2 => mất quyền ngay
  perform public.admin_set_user(s2, p_active => false);
  perform pg_temp.as_user(s2);
  perform pg_temp.denied($q$insert into public.counseling_requests (student_id, category, description) values ('00000000-0000-0000-0000-0000000000a2','study','x')$q$, 'tài khoản bị vô hiệu hóa không tạo được yêu cầu');
end $$;

-- ---------- Góp ý, tin nhắn, lịch hẹn, bằng chứng ----------
do $$
declare s1 uuid := '00000000-0000-0000-0000-0000000000a1'; s2 uuid := '00000000-0000-0000-0000-0000000000a2';
        t1 uuid := '00000000-0000-0000-0000-0000000000b1'; c1 uuid := '00000000-0000-0000-0000-0000000000b2';
        ad uuid := '00000000-0000-0000-0000-0000000000d1';
begin
  perform pg_temp.as_user(ad); perform public.admin_set_user(s2, p_active => true);

  perform pg_temp.as_user(s1);
  insert into public.suggestions (id, author_id, is_anonymous, title, content, category, visibility, status)
    values ('cccccccc-0000-0000-0000-000000000001', s1, true, 'Thêm ghế', 'Nội dung', 'facilities', 'public', 'resolved');
  insert into public.suggestions (id, author_id, title, content, category, visibility)
    values ('cccccccc-0000-0000-0000-000000000002', s1, 'Góp ý riêng', 'Nội dung', 'other', 'private');
  perform pg_temp.ok((select status from public.suggestions where id = 'cccccccc-0000-0000-0000-000000000001') = 'published', 'trạng thái góp ý do hệ thống đặt, không tin client');
  perform pg_temp.denied($q$insert into public.suggestions (author_id, title, content, category) values ('00000000-0000-0000-0000-0000000000a2','x','y','other')$q$, 'không giả mạo tác giả góp ý');

  perform pg_temp.as_user(s2);
  perform pg_temp.ok((select count(*) from public.suggestion_feed) = 1, 'học sinh khác chỉ thấy góp ý công khai');
  perform pg_temp.ok((select author_name from public.suggestion_feed) is null, 'góp ý ẩn danh không lộ tên tác giả');
  perform public.toggle_suggestion_vote('cccccccc-0000-0000-0000-000000000001');
  perform pg_temp.ok((select votes from public.suggestion_feed) = 1 and (select voted_by_me from public.suggestion_feed), 'bình chọn góp ý công khai');
  perform pg_temp.denied($q$select public.toggle_suggestion_vote('cccccccc-0000-0000-0000-000000000002')$q$, 'không bình chọn góp ý riêng tư');
  perform public.toggle_suggestion_vote('cccccccc-0000-0000-0000-000000000001');
  perform pg_temp.ok((select votes from public.suggestion_feed) = 0, 'bỏ bình chọn');

  -- tin nhắn: s1 <-> c1
  perform pg_temp.as_user(s1);
  insert into public.messages (counseling_request_id, sender_id, body) values ('bbbbbbbb-0000-0000-0000-000000000001', s2, 'Em chào thầy');
  perform pg_temp.ok((select sender_id from public.messages) = s1 and (select sender_kind from public.messages) = 'student', 'người gửi tin nhắn luôn là người đăng nhập (không giả mạo)');
  perform pg_temp.as_user(c1);
  insert into public.messages (counseling_request_id, body) values ('bbbbbbbb-0000-0000-0000-000000000001', 'Chào em');
  perform pg_temp.ok((select count(*) from public.list_threads()) = 1, 'tư vấn viên thấy cuộc trò chuyện');
  perform pg_temp.ok((select counterpart from public.list_threads()) = 'Học sinh 1', 'tư vấn viên thấy tên học sinh (ca không ẩn danh)');
  perform pg_temp.as_user(t1);
  perform pg_temp.ok((select count(*) from public.messages) = 0, 'giáo viên không được giao không đọc được tin nhắn');
  perform pg_temp.denied($q$insert into public.messages (counseling_request_id, body) values ('bbbbbbbb-0000-0000-0000-000000000001','chen ngang')$q$, 'giáo viên không được giao không gửi tin nhắn');
  perform pg_temp.as_user(s2);
  perform pg_temp.ok((select count(*) from public.messages) = 0, 'học sinh khác không đọc được tin nhắn');

  -- lịch hẹn
  perform pg_temp.as_user(c1);
  perform public.create_appointment('bbbbbbbb-0000-0000-0000-000000000001', now() + interval '2 day', 'in_person');
  perform pg_temp.as_user(s1);
  perform pg_temp.ok((select count(*) from public.list_my_appointments()) = 1, 'học sinh thấy lịch hẹn của mình');
  perform pg_temp.as_user(s2);
  perform pg_temp.ok((select count(*) from public.list_my_appointments()) = 0, 'học sinh khác không thấy lịch hẹn');
  perform pg_temp.denied($q$select public.create_appointment('bbbbbbbb-0000-0000-0000-000000000001', now(), 'online')$q$, 'học sinh không tự đặt lịch hẹn');

  -- bằng chứng (storage)
  perform pg_temp.as_user(s1);
  insert into storage.objects (bucket_id, name) values ('evidence', 'incidents/aaaaaaaa-0000-0000-0000-000000000001/anh.png');
  perform pg_temp.as_user(s2);
  perform pg_temp.denied($q$insert into storage.objects (bucket_id, name) values ('evidence','incidents/aaaaaaaa-0000-0000-0000-000000000001/gia-mao.png')$q$, 'học sinh khác không tải bằng chứng vào ca của người khác');
  perform pg_temp.ok((select count(*) from storage.objects) = 0, 'học sinh khác không đọc được bằng chứng');
  perform pg_temp.as_user(t1);
  perform pg_temp.ok((select count(*) from storage.objects) = 1, 'giáo viên được giao đọc được bằng chứng của ca');
  perform pg_temp.as_user(c1);
  perform pg_temp.ok((select count(*) from storage.objects) = 0, 'tư vấn viên không được giao ca báo cáo thì không đọc được bằng chứng');
end $$;

-- ---------- Dọn dữ liệu thử ----------
reset role;
delete from public.case_events where case_id::text like 'aaaaaaaa-%' or case_id::text like 'bbbbbbbb-%';
delete from public.counseling_requests where id::text like 'bbbbbbbb-%';
delete from public.incidents where id::text like 'aaaaaaaa-%';
delete from public.suggestions where id::text like 'cccccccc-%';
delete from storage.objects where bucket_id = 'evidence' and name like 'incidents/aaaaaaaa-%';
delete from public.audit_logs;
delete from auth.users where id::text like '00000000-0000-0000-0000-0000000000%';
delete from public.users where id::text like '00000000-0000-0000-0000-0000000000%';
\echo 'RBAC smoke test: TẤT CẢ ĐẠT'
