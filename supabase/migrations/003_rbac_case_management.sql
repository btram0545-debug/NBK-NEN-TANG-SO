-- =====================================================================
-- 003 — Phân quyền theo vai trò, quản lý trường hợp, riêng tư & audit
--
-- Nguyên tắc:
--  * Học sinh chỉ đọc/ghi dữ liệu của chính mình (bảng gốc + RLS).
--  * Nhân sự KHÔNG đọc bảng gốc; đọc qua view/RPC đã che dữ liệu ẩn danh
--    và áp dụng đúng phạm vi (giáo viên/tư vấn viên: chỉ ca được giao).
--  * Mọi thay đổi quan trọng đi qua RPC (security definer) => tự ghi audit.
--  * Frontend chỉ ẩn/hiện menu; quyền thật nằm ở đây.
-- =====================================================================

-- ---------- 1. Cột bổ sung ----------
alter table public.users
  add column if not exists phone text,
  add column if not exists department text,
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.incidents
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists involved text,
  add column if not exists escalated_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.users(id) on delete set null;

alter table public.counseling_requests
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists privacy_level text not null default 'standard',
  add column if not exists meeting_preference text not null default 'unsure',
  add column if not exists escalated_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.users(id) on delete set null;

alter table public.counseling_requests
  add constraint counseling_privacy_level_chk check (privacy_level in ('standard','restricted')),
  add constraint counseling_meeting_pref_chk check (meeting_preference in ('in_person','online','unsure')),
  add constraint counseling_description_len_chk check (char_length(description) between 1 and 5000);

alter table public.incidents
  add constraint incidents_description_len_chk check (char_length(description) between 1 and 5000);

alter table public.suggestions
  add constraint suggestions_len_chk check (char_length(title) between 1 and 160 and char_length(content) between 1 and 3000);

-- ---------- 2. Bảng mới ----------
create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_kind text not null check (case_kind in ('incident','counseling')),
  case_id uuid not null,
  event_type text not null check (event_type in ('created','assigned','status','escalated','approved','appointment','note')),
  status text,
  label text not null,
  detail text,
  staff_only boolean not null default false,
  actor_role public.user_role,
  created_at timestamptz not null default now()
);
create index case_events_case_idx on public.case_events (case_kind, case_id, created_at);

create table public.private_note_grants (
  counseling_request_id uuid not null references public.counseling_requests(id) on delete cascade,
  grantee_id uuid not null references public.users(id) on delete cascade,
  granted_by uuid references public.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (counseling_request_id, grantee_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('counseling','incident','appointment','system')),
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  counseling_request_id uuid not null references public.counseling_requests(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_kind text not null default 'student' check (sender_kind in ('student','staff')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (counseling_request_id, created_at);

alter table public.case_events enable row level security;
alter table public.private_note_grants enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;

-- ---------- 3. Hàm hỗ trợ ----------
-- Người dùng bị vô hiệu hóa mất toàn bộ quyền.
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid() and is_active;
$$;

create or replace function public.is_case_power()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() in ('supervisor','admin'), false);
$$;

create or replace function public.can_access_case(p_kind text, p_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case p_kind
    when 'incident' then exists (
      select 1 from public.incidents i
      where i.id = p_id and public.current_user_role() is not null
        and (i.reporter_id = auth.uid()
             or public.is_case_power()
             or (i.assigned_to = auth.uid() and public.current_user_role() in ('teacher','counselor'))))
    when 'counseling' then exists (
      select 1 from public.counseling_requests r
      where r.id = p_id and public.current_user_role() is not null
        and (r.student_id = auth.uid()
             or public.is_case_power()
             or (r.counselor_id = auth.uid() and public.current_user_role() in ('teacher','counselor'))))
    else false
  end;
$$;

create or replace function public.status_label(p text)
returns text language sql immutable as $$
  select case p
    when 'pending' then 'Chờ tiếp nhận' when 'submitted' then 'Mới tiếp nhận'
    when 'triaging' then 'Đang phân loại' when 'assigned' then 'Đã phân công'
    when 'in_progress' then 'Đang xử lý' when 'need_info' then 'Cần bổ sung thông tin'
    when 'resolved' then 'Đã xử lý' when 'archived' then 'Đã lưu trữ' else p end;
$$;

-- Hàm nội bộ: chỉ chủ sở hữu (owner) gọi được, client không gọi trực tiếp.
create or replace function public.push_notification(p_user uuid, p_category text, p_title text, p_body text, p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, category, title, body, link) values (p_user, p_category, p_title, p_body, p_link);
$$;

create or replace function public.write_audit(p_action text, p_entity text, p_entity_id uuid, p_old jsonb default null, p_new jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_old, p_new);
$$;

create or replace function public.add_case_event(p_kind text, p_id uuid, p_type text, p_status text, p_label text, p_detail text default null, p_staff_only boolean default false)
returns void language sql security definer set search_path = public as $$
  insert into public.case_events (case_kind, case_id, event_type, status, label, detail, staff_only, actor_role)
  values (p_kind, p_id, p_type, p_status, p_label, p_detail, p_staff_only, public.current_user_role());
$$;

revoke all on function public.push_notification(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.write_audit(text,text,uuid,jsonb,jsonb) from public, anon, authenticated;
revoke all on function public.add_case_event(text,uuid,text,text,text,text,boolean) from public, anon, authenticated;

-- ---------- 4. Trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger incidents_touch before update on public.incidents for each row execute function public.touch_updated_at();
create trigger counseling_touch before update on public.counseling_requests for each row execute function public.touch_updated_at();
create trigger suggestions_touch before update on public.suggestions for each row execute function public.touch_updated_at();
create trigger private_notes_touch before update on public.private_case_notes for each row execute function public.touch_updated_at();

-- Tạo hồ sơ khi có tài khoản Auth mới. Vai trò luôn là 'student':
-- KHÔNG đọc role từ metadata do người dùng cung cấp. Admin nâng quyền qua admin_set_user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Người dùng tự sửa hồ sơ nhưng không thể tự đổi vai trò / trạng thái / mã học sinh.
create or replace function public.guard_user_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.current_user_role() <> 'admin', true) then
    if new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.student_code is distinct from old.student_code
       or new.class_name is distinct from old.class_name then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end; $$;
create trigger users_guard before update on public.users for each row execute function public.guard_user_update();

-- Ghi sự kiện "đã tiếp nhận" khi học sinh tạo ca.
create or replace function public.log_case_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.case_events (case_kind, case_id, event_type, label, actor_role)
  values (tg_argv[0], new.id, 'created', 'Đã tiếp nhận yêu cầu', 'student');
  return new;
end; $$;
create trigger incidents_created after insert on public.incidents for each row execute function public.log_case_created('incident');
create trigger counseling_created after insert on public.counseling_requests for each row execute function public.log_case_created('counseling');

-- Góp ý: trạng thái do hệ thống quyết định, không tin dữ liệu từ client.
create or replace function public.set_suggestion_status()
returns trigger language plpgsql as $$
begin
  new.status = case when new.visibility = 'public' then 'published' else 'pending' end;
  return new;
end; $$;
create trigger suggestions_status before insert on public.suggestions for each row execute function public.set_suggestion_status();

-- Tin nhắn: người gửi luôn là người đang đăng nhập; phân loại theo vai trò.
create or replace function public.set_message_sender()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.sender_id = auth.uid();
  new.sender_kind = case when public.current_user_role() = 'student' then 'student' else 'staff' end;
  return new;
end; $$;
create trigger messages_sender before insert on public.messages for each row execute function public.set_message_sender();

-- ---------- 5. Chính sách RLS (thay thế bản 001) ----------
drop policy if exists "staff_read_incidents" on public.incidents;
drop policy if exists "staff_update_incidents" on public.incidents;
drop policy if exists "staff_read_counseling" on public.counseling_requests;
drop policy if exists "staff_update_counseling" on public.counseling_requests;
drop policy if exists "incident_evidence_staff_or_owner" on public.incident_evidence;
drop policy if exists "counselor_read_private_notes" on public.private_case_notes;
drop policy if exists "counselor_write_private_notes" on public.private_case_notes;
drop policy if exists "students_create_suggestions" on public.suggestions;
drop policy if exists "public_suggestions_read" on public.suggestions;
drop policy if exists "suggestion_vote" on public.suggestion_votes;
drop policy if exists "admin_manage_users" on public.users;
drop policy if exists "students_create_incidents" on public.incidents;
drop policy if exists "student_create_counseling" on public.counseling_requests;

-- users: tự đọc / tự sửa hồ sơ; admin đọc tất cả (sửa qua RPC để có audit).
create policy "users_update_self" on public.users for update to authenticated
  using (id = auth.uid() and public.current_user_role() is not null)
  with check (id = auth.uid());
create policy "admin_read_users" on public.users for select to authenticated
  using (public.current_user_role() = 'admin');

-- incidents / counseling: học sinh tạo & đọc của mình. Nhân sự đọc qua view.
create policy "students_create_incidents" on public.incidents for insert to authenticated
  with check (reporter_id = auth.uid() and public.current_user_role() = 'student'
              and status = 'submitted' and assigned_to is null);
create policy "student_create_counseling" on public.counseling_requests for insert to authenticated
  with check (student_id = auth.uid() and public.current_user_role() = 'student'
              and status = 'pending' and counselor_id is null);

-- bằng chứng
create policy "evidence_insert_reporter" on public.incident_evidence for insert to authenticated
  with check (exists (select 1 from public.incidents i where i.id = incident_id and i.reporter_id = auth.uid()));
create policy "evidence_select_case_access" on public.incident_evidence for select to authenticated
  using (deleted_at is null and public.can_access_case('incident', incident_id));

-- ghi chú riêng tư: chỉ tư vấn viên là tác giả, hoặc người được cấp quyền còn hiệu lực. KHÔNG có quyền mặc định cho admin/giáo viên/học sinh.
create policy "private_notes_read" on public.private_case_notes for select to authenticated
  using (
    (counselor_id = auth.uid() and public.current_user_role() = 'counselor')
    or exists (select 1 from public.private_note_grants g
               where g.counseling_request_id = private_case_notes.counseling_request_id
                 and g.grantee_id = auth.uid()
                 and (g.expires_at is null or g.expires_at > now())));
-- ghi chú chỉ được thêm qua RPC add_private_note (không có policy insert/update/delete cho client)

create policy "grants_read_own" on public.private_note_grants for select to authenticated
  using (grantee_id = auth.uid() or public.current_user_role() = 'admin');

-- góp ý
create policy "students_create_suggestions" on public.suggestions for insert to authenticated
  with check (author_id = auth.uid() and public.current_user_role() = 'student');
create policy "own_suggestions_read" on public.suggestions for select to authenticated
  using (author_id = auth.uid());
-- bình chọn & nguồn cấp góp ý công khai: qua view suggestion_feed + RPC toggle_suggestion_vote

-- lịch hẹn: người trong cuộc đọc; tạo qua RPC create_appointment
create policy "appointments_participants_read" on public.counseling_appointments for select to authenticated
  using (
    counselor_id = auth.uid()
    or public.is_case_power()
    or exists (select 1 from public.counseling_requests r
               where r.id = counseling_request_id and r.student_id = auth.uid()));

-- sự kiện xử lý: ai truy cập được ca thì thấy; ghi chú nội bộ chỉ nhân sự
create policy "case_events_read" on public.case_events for select to authenticated
  using (public.can_access_case(case_kind, case_id)
         and (not staff_only or public.current_user_role() <> 'student'));

-- thông báo
create policy "notifications_read_own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_mark_read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tin nhắn: học sinh chủ ca + người được giao
create or replace function public.is_thread_participant(p_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.counseling_requests r
    where r.id = p_request
      and public.current_user_role() is not null
      and (r.student_id = auth.uid()
           or (r.counselor_id = auth.uid() and public.current_user_role() in ('teacher','counselor'))));
$$;
create policy "messages_read_participants" on public.messages for select to authenticated
  using (public.is_thread_participant(counseling_request_id));
create policy "messages_send_participants" on public.messages for insert to authenticated
  with check (public.is_thread_participant(counseling_request_id));

-- ---------- 6. View dành cho nhân sự (che dữ liệu ẩn danh / riêng tư) ----------
create or replace view public.staff_directory with (security_invoker = false) as
  select id, full_name, role from public.users
  where is_active and role in ('teacher','counselor','supervisor','admin');

create or replace view public.staff_incidents with (security_invoker = false) as
  select i.id, i.incident_type, i.severity, i.title, i.description, i.incident_time, i.location, i.involved,
         i.status, i.assigned_to, i.created_at, i.updated_at, i.resolved_at, i.is_anonymous,
         i.escalated_at, i.approved_at,
         case when i.is_anonymous then null else i.reporter_id end as reporter_id,
         case when i.is_anonymous then null else u.full_name end as reporter_name,
         case when i.is_anonymous then null else u.class_name end as reporter_class,
         (select count(*) from public.incident_evidence e where e.incident_id = i.id and e.deleted_at is null)::int as evidence_count
  from public.incidents i
  left join public.users u on u.id = i.reporter_id
  where public.is_case_power()
     or (i.assigned_to = auth.uid() and public.current_user_role() in ('teacher','counselor'));

create or replace view public.staff_counseling with (security_invoker = false) as
  select r.id, r.category, r.urgency, r.status, r.counselor_id, r.created_at, r.updated_at, r.resolved_at,
         r.is_anonymous, r.privacy_level, r.meeting_preference, r.escalated_at, r.approved_at,
         case when v.see then r.title end as title,
         case when v.see then r.description end as description,
         case when r.is_anonymous or not v.see then null else r.student_id end as reporter_id,
         case when r.is_anonymous or not v.see then null else u.full_name end as reporter_name,
         case when r.is_anonymous or not v.see then null else u.class_name end as reporter_class
  from public.counseling_requests r
  left join public.users u on u.id = r.student_id
  cross join lateral (
    -- coalesce: ca chưa giao (counselor_id null) phải cho ra false, không phải null,
    -- nếu không "not see" cũng null và tên học sinh sẽ bị lộ.
    select coalesce(r.counselor_id = auth.uid()
                    or (r.privacy_level = 'standard' and public.is_case_power()), false) as see
  ) v
  where public.is_case_power()
     or (r.counselor_id = auth.uid() and public.current_user_role() in ('teacher','counselor'));

create or replace view public.suggestion_feed with (security_invoker = false) as
  select s.id, s.title, s.content, s.category, s.visibility, s.status, s.is_anonymous, s.created_at,
         case when s.is_anonymous then null else u.full_name end as author_name,
         (select count(*) from public.suggestion_votes v where v.suggestion_id = s.id)::int as votes,
         exists (select 1 from public.suggestion_votes v where v.suggestion_id = s.id and v.user_id = auth.uid()) as voted_by_me,
         (s.author_id = auth.uid()) as mine
  from public.suggestions s
  left join public.users u on u.id = s.author_id
  where public.current_user_role() is not null
    and ((s.visibility = 'public' and s.status in ('published','resolved'))
         or s.author_id = auth.uid()
         or public.is_case_power());

-- ---------- 7. RPC: xử lý ca ----------
create or replace function public.staff_update_case(
  p_kind text, p_id uuid,
  p_status text default null,
  p_severity public.incident_severity default null,
  p_assignee uuid default null,
  p_set_assignee boolean default false,
  p_escalate boolean default false,
  p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role public.user_role := public.current_user_role();
  v_power boolean := coalesce(v_role in ('supervisor','admin'), false);
  v_owner uuid; v_assigned uuid; v_status text; v_sev public.incident_severity;
  v_target public.user_role; v_target_name text;
  v_tbl text; v_asg text; v_sevcol text;
  v_early text[]; v_route text; v_cat text;
begin
  if v_role is null or v_role = 'student' then raise exception 'not_allowed' using errcode = '42501'; end if;

  if p_kind = 'incident' then
    v_tbl := 'incidents'; v_asg := 'assigned_to'; v_sevcol := 'severity'; v_early := array['submitted','triaging']; v_cat := 'incident';
    v_route := '/student/incidents/';
    select reporter_id, assigned_to, status::text, severity into v_owner, v_assigned, v_status, v_sev
      from public.incidents where id = p_id for update;
  elsif p_kind = 'counseling' then
    v_tbl := 'counseling_requests'; v_asg := 'counselor_id'; v_sevcol := 'urgency'; v_early := array['pending']; v_cat := 'counseling';
    v_route := '/student/counseling/';
    select student_id, counselor_id, status::text, urgency into v_owner, v_assigned, v_status, v_sev
      from public.counseling_requests where id = p_id for update;
  else
    raise exception 'bad_kind' using errcode = '22023';
  end if;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not v_power and v_assigned is distinct from auth.uid() then raise exception 'not_allowed' using errcode = '42501'; end if;

  -- Giao / chuyển người phụ trách (giáo viên chỉ chuyển ca của mình cho giáo viên/tư vấn viên)
  if p_set_assignee then
    if p_assignee is not null then
      select role, full_name into v_target, v_target_name from public.users where id = p_assignee and is_active;
      if v_target is null or v_target not in ('teacher','counselor') then raise exception 'bad_assignee' using errcode = '22023'; end if;
    end if;
    execute format('update public.%I set %I = $1 where id = $2', v_tbl, v_asg) using p_assignee, p_id;
    if p_assignee is not null then
      if v_status = any (v_early) then
        execute format('update public.%I set status = $1::%s where id = $2', v_tbl,
                       case when p_kind = 'incident' then 'public.incident_status' else 'public.counseling_status' end)
          using 'assigned', p_id;
        v_status := 'assigned';
      end if;
      perform public.add_case_event(p_kind, p_id, 'assigned', 'assigned', 'Đã giao cho ' || coalesce(v_target_name, 'người phụ trách'));
      perform public.push_notification(p_assignee, v_cat, 'Có ca mới được phân công', 'Một trường hợp mới vừa được giao cho bạn.', '/teacher/cases');
    end if;
    perform public.write_audit('Phân công ca', p_kind, p_id, jsonb_build_object('assignee', v_assigned), jsonb_build_object('assignee', p_assignee));
  end if;

  -- Mức độ (chỉ quản sinh / BGH)
  if p_severity is not null and p_severity is distinct from v_sev then
    if not v_power then raise exception 'not_allowed' using errcode = '42501'; end if;
    execute format('update public.%I set %I = $1 where id = $2', v_tbl, v_sevcol) using p_severity, p_id;
    perform public.write_audit('Đổi mức độ ca', p_kind, p_id, jsonb_build_object('severity', v_sev), jsonb_build_object('severity', p_severity));
    v_sev := p_severity;
  end if;

  -- Trạng thái
  if p_status is not null and p_status is distinct from v_status then
    if not v_power and p_status not in ('in_progress','need_info','resolved') then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
    execute format('update public.%I set status = $1::%s, resolved_at = case when $1 = ''resolved'' then now() else resolved_at end where id = $2',
                   v_tbl, case when p_kind = 'incident' then 'public.incident_status' else 'public.counseling_status' end)
      using p_status, p_id;
    perform public.add_case_event(p_kind, p_id, 'status', p_status, public.status_label(p_status));
    perform public.push_notification(v_owner, v_cat, 'Trạng thái yêu cầu đã thay đổi',
      'Yêu cầu của bạn: ' || public.status_label(p_status) || '.', v_route || p_id::text);
    perform public.write_audit('Đổi trạng thái ca', p_kind, p_id, jsonb_build_object('status', v_status), jsonb_build_object('status', p_status));
  end if;

  -- Chuyển lên Ban giám hiệu
  if p_escalate then
    if not v_power then raise exception 'not_allowed' using errcode = '42501'; end if;
    execute format('update public.%I set escalated_at = coalesce(escalated_at, now()), %I = ''urgent'' where id = $1', v_tbl, v_sevcol) using p_id;
    perform public.add_case_event(p_kind, p_id, 'escalated', null, 'Chuyển lên Ban giám hiệu');
    insert into public.notifications (user_id, category, title, body, link)
      select id, v_cat, 'Ca được chuyển lên Ban giám hiệu', 'Một trường hợp khẩn cấp đang chờ xem xét.', '/admin/cases/' || p_kind || '/' || p_id::text
      from public.users where role = 'admin' and is_active;
    perform public.write_audit('Chuyển ca lên BGH', p_kind, p_id);
  end if;

  -- Ghi nhận hỗ trợ (nội bộ nhân sự, học sinh không thấy)
  if p_note is not null and btrim(p_note) <> '' then
    perform public.add_case_event(p_kind, p_id, 'note', null, 'Ghi nhận hỗ trợ', left(btrim(p_note), 2000), true);
  end if;
end; $$;

create or replace function public.approve_intervention(p_kind text, p_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'admin' then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_kind = 'incident' then
    update public.incidents set approved_at = now(), approved_by = auth.uid() where id = p_id;
  elsif p_kind = 'counseling' then
    update public.counseling_requests set approved_at = now(), approved_by = auth.uid() where id = p_id;
  else raise exception 'bad_kind' using errcode = '22023'; end if;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  perform public.add_case_event(p_kind, p_id, 'approved', null, 'Ban giám hiệu đã phê duyệt phương án can thiệp', left(p_note, 2000));
  perform public.write_audit('Phê duyệt can thiệp', p_kind, p_id);
end; $$;

-- ---------- 8. RPC: ghi chú riêng tư ----------
create or replace function public.add_private_note(p_id uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'counselor'
     or not exists (select 1 from public.counseling_requests where id = p_id and counselor_id = auth.uid()) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_body is null or btrim(p_body) = '' or char_length(p_body) > 5000 then raise exception 'bad_note' using errcode = '22023'; end if;
  -- Lưu ý: cột note_encrypted hiện lưu văn bản thường được bảo vệ bằng RLS. Mã hóa cột (Vault/pgsodium) là việc cần làm trước pilot.
  insert into public.private_case_notes (counseling_request_id, counselor_id, note_encrypted) values (p_id, auth.uid(), btrim(p_body));
  perform public.write_audit('Thêm ghi chú riêng tư', 'private_note', p_id);
end; $$;

create or replace function public.get_private_notes(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ok boolean;
begin
  v_ok := exists (select 1 from public.counseling_requests r
                  where r.id = p_id and r.counselor_id = auth.uid() and public.current_user_role() = 'counselor')
       or exists (select 1 from public.private_note_grants g
                  where g.counseling_request_id = p_id and g.grantee_id = auth.uid()
                    and (g.expires_at is null or g.expires_at > now()) and public.current_user_role() is not null
                    and public.current_user_role() <> 'student');
  if not v_ok then return jsonb_build_object('locked', true, 'notes', '[]'::jsonb); end if;
  perform public.write_audit('Đọc ghi chú riêng tư', 'private_note', p_id);
  return jsonb_build_object('locked', false, 'notes', coalesce((
    select jsonb_agg(jsonb_build_object('id', n.id, 'body', n.note_encrypted, 'authorName', coalesce(u.full_name, '—'), 'createdAt', n.created_at) order by n.created_at desc)
    from public.private_case_notes n left join public.users u on u.id = n.counselor_id
    where n.counseling_request_id = p_id), '[]'::jsonb));
end; $$;

create or replace function public.grant_private_note_access(p_id uuid, p_grantee uuid, p_days int default 14)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'admin' then raise exception 'not_allowed' using errcode = '42501'; end if;
  insert into public.private_note_grants (counseling_request_id, grantee_id, granted_by, expires_at)
  values (p_id, p_grantee, auth.uid(), now() + make_interval(days => greatest(p_days, 1)))
  on conflict (counseling_request_id, grantee_id) do update set expires_at = excluded.expires_at, granted_by = excluded.granted_by;
  perform public.write_audit('Cấp quyền xem ghi chú riêng tư', 'private_note', p_id, null, jsonb_build_object('grantee', p_grantee, 'days', p_days));
end; $$;

-- ---------- 9. RPC: lịch hẹn, tin nhắn ----------
create or replace function public.create_appointment(p_request uuid, p_at timestamptz, p_type text, p_url text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_student uuid; v_counselor uuid;
begin
  select student_id, counselor_id into v_student, v_counselor from public.counseling_requests where id = p_request;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if not (public.is_case_power()
          or (v_counselor = auth.uid() and public.current_user_role() in ('teacher','counselor'))) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if v_counselor is null then raise exception 'need_assignee' using errcode = '22023'; end if;
  insert into public.counseling_appointments (counseling_request_id, counselor_id, scheduled_at, meeting_type, meeting_url)
  values (p_request, v_counselor, p_at, p_type, nullif(p_url, ''));
  perform public.add_case_event('counseling', p_request, 'appointment', null, 'Đã đặt lịch hẹn');
  perform public.push_notification(v_student, 'appointment', 'Bạn có lịch hẹn mới', 'Xem chi tiết trong mục Lịch hẹn.', '/student/appointments');
  perform public.write_audit('Tạo lịch hẹn', 'appointment', p_request);
end; $$;

create or replace function public.list_my_appointments()
returns table (id uuid, request_id uuid, topic text, counselor_id uuid, counselor_name text, student_name text,
               scheduled_at timestamptz, duration_minutes int, meeting_type text, meeting_url text, status text)
language sql stable security definer set search_path = public as $$
  select a.id, r.id, r.category, a.counselor_id, cu.full_name,
         case when r.is_anonymous or auth.uid() = r.student_id then null else su.full_name end,
         a.scheduled_at, a.duration_minutes, a.meeting_type, a.meeting_url, a.status
  from public.counseling_appointments a
  join public.counseling_requests r on r.id = a.counseling_request_id
  left join public.users cu on cu.id = a.counselor_id
  left join public.users su on su.id = r.student_id
  where public.current_user_role() is not null
    and (r.student_id = auth.uid() or a.counselor_id = auth.uid() or public.is_case_power())
  order by a.scheduled_at;
$$;

create or replace function public.list_threads()
returns table (request_id uuid, category text, counterpart text, last_message text, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.category,
         case when r.student_id = auth.uid() then coalesce(cu.full_name, 'Tư vấn viên')
              when r.is_anonymous then 'Học sinh (ẩn danh)'
              else coalesce(su.full_name, 'Học sinh') end,
         lm.body, lm.created_at
  from public.counseling_requests r
  left join public.users cu on cu.id = r.counselor_id
  left join public.users su on su.id = r.student_id
  left join lateral (select m.body, m.created_at from public.messages m
                     where m.counseling_request_id = r.id order by m.created_at desc limit 1) lm on true
  where r.counselor_id is not null and public.is_thread_participant(r.id)
  order by coalesce(lm.created_at, r.updated_at) desc;
$$;

-- ---------- 10. RPC: góp ý ----------
create or replace function public.toggle_suggestion_vote(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.current_user_role() is null then raise exception 'not_allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.suggestions where id = p_id and visibility = 'public' and status = 'published') then
    raise exception 'not_votable' using errcode = '22023';
  end if;
  if exists (select 1 from public.suggestion_votes where suggestion_id = p_id and user_id = auth.uid()) then
    delete from public.suggestion_votes where suggestion_id = p_id and user_id = auth.uid();
  else
    insert into public.suggestion_votes (suggestion_id, user_id) values (p_id, auth.uid());
  end if;
end; $$;

create or replace function public.moderate_suggestion(p_id uuid, p_status public.suggestion_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_case_power() then raise exception 'not_allowed' using errcode = '42501'; end if;
  update public.suggestions set status = p_status where id = p_id;
  perform public.write_audit('Kiểm duyệt góp ý', 'suggestion', p_id, null, jsonb_build_object('status', p_status));
end; $$;

-- ---------- 11. RPC: quản trị & thống kê ----------
create or replace function public.admin_overview(p_weeks int default 8)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_case_power() then raise exception 'not_allowed' using errcode = '42501'; end if;
  with allc as (
    select 'incident'::text as kind, id, incident_type::text as category, severity, status::text as status,
           created_at, updated_at, reporter_id as person, escalated_at from public.incidents
    union all
    select 'counseling', id, category, urgency, status::text, created_at, updated_at, student_id, escalated_at
    from public.counseling_requests
  ), active as (
    select * from allc where status in ('pending','submitted','triaging','assigned','in_progress','need_info')
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'counseling', (select count(*) from public.counseling_requests),
      'incidents', (select count(*) from public.incidents),
      'active', (select count(*) from active),
      'urgent', (select count(*) from active where severity = 'urgent'),
      'avgResponseHours', coalesce((
        select round((avg(extract(epoch from (e.first_at - a.created_at)) / 3600))::numeric, 1)
        from allc a join (select case_id, min(created_at) first_at from public.case_events where event_type = 'assigned' group by case_id) e on e.case_id = a.id), 0)),
    'trend', (select coalesce(jsonb_agg(jsonb_build_object(
        'label', to_char(w, 'DD/MM'),
        'counseling', (select count(*) from allc where kind = 'counseling' and date_trunc('week', created_at) = w),
        'incidents', (select count(*) from allc where kind = 'incident' and date_trunc('week', created_at) = w)) order by w), '[]'::jsonb)
      from generate_series(date_trunc('week', now()) - ((greatest(p_weeks,1) - 1) * interval '1 week'), date_trunc('week', now()), interval '1 week') w),
    'byType', (select coalesce(jsonb_agg(jsonb_build_object('key', category, 'value', c) order by c desc), '[]'::jsonb)
               from (select category, count(*) c from allc where kind = 'incident' group by category) t),
    'byCounseling', (select coalesce(jsonb_agg(jsonb_build_object('key', category, 'value', c) order by c desc), '[]'::jsonb)
               from (select category, count(*) c from allc where kind = 'counseling' group by category) t),
    'byStatus', (select coalesce(jsonb_agg(jsonb_build_object('key', status, 'value', c) order by c desc), '[]'::jsonb)
               from (select status, count(*) c from allc group by status) t),
    'byGrade', (select coalesce(jsonb_agg(jsonb_build_object('key', g, 'value', c) order by g), '[]'::jsonb)
               from (select coalesce(substring(u.class_name from '^\d+'), '—') g, count(*) c
                     from allc a left join public.users u on u.id = a.person group by 1) t),
    'attention', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'kind', kind, 'category', category, 'severity', severity, 'status', status,
        'createdAt', created_at, 'updatedAt', updated_at, 'escalated', escalated_at is not null)
        order by (escalated_at is not null) desc, created_at desc), '[]'::jsonb)
      from (select * from active where escalated_at is not null or severity = 'urgent' or (kind = 'incident' and severity = 'serious')
            order by (escalated_at is not null) desc, created_at desc limit 5) x)
  ) into v;
  return v;
end; $$;

create or replace function public.admin_list_users()
returns table (id uuid, full_name text, email text, role public.user_role, class_name text, is_active boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if public.current_user_role() is distinct from 'admin' then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select u.id, u.full_name, a.email::text, u.role, u.class_name, u.is_active
    from public.users u join auth.users a on a.id = u.id
    order by u.role, u.full_name;
end; $$;

create or replace function public.admin_set_user(p_id uuid, p_role public.user_role default null, p_active boolean default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_old public.users;
begin
  if public.current_user_role() is distinct from 'admin' then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_id = auth.uid() then raise exception 'cannot_modify_self' using errcode = '42501'; end if;
  select * into v_old from public.users where id = p_id;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.users set role = coalesce(p_role, role), is_active = coalesce(p_active, is_active) where id = p_id;
  perform public.write_audit(
    case when p_role is not null then 'Đổi vai trò người dùng' when p_active then 'Kích hoạt tài khoản' else 'Vô hiệu hóa tài khoản' end,
    'user', p_id, jsonb_build_object('role', v_old.role, 'is_active', v_old.is_active), jsonb_build_object('role', p_role, 'is_active', p_active));
end; $$;

create or replace function public.admin_audit_logs(p_limit int default 200)
returns table (id uuid, action text, entity_type text, entity_id uuid, actor_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.current_user_role() is distinct from 'admin' then raise exception 'not_allowed' using errcode = '42501'; end if;
  return query
    select l.id, l.action, l.entity_type, l.entity_id, coalesce(u.full_name, 'Hệ thống'), l.created_at
    from public.audit_logs l left join public.users u on u.id = l.actor_id
    order by l.created_at desc limit least(greatest(p_limit, 1), 500);
end; $$;

-- ---------- 12. Quyền thực thi ----------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;

do $$
declare f text;
begin
  foreach f in array array[
    'staff_update_case(text,uuid,text,public.incident_severity,uuid,boolean,boolean,text)',
    'approve_intervention(text,uuid,text)', 'add_private_note(uuid,text)', 'get_private_notes(uuid)',
    'grant_private_note_access(uuid,uuid,int)', 'create_appointment(uuid,timestamptz,text,text)',
    'list_my_appointments()', 'list_threads()', 'toggle_suggestion_vote(uuid)',
    'moderate_suggestion(uuid,public.suggestion_status)', 'admin_overview(int)', 'admin_list_users()',
    'admin_set_user(uuid,public.user_role,boolean)', 'admin_audit_logs(int)',
    'current_user_role()', 'is_case_power()', 'can_access_case(text,uuid)', 'is_thread_participant(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

grant select on public.staff_directory, public.staff_incidents, public.staff_counseling, public.suggestion_feed to authenticated;
