-- =====================================================================
-- DỮ LIỆU MẪU CHO PHÁT TRIỂN (Supabase local: `supabase db reset` sẽ tự chạy tệp này).
-- KHÔNG chạy trên dự án Supabase thật của trường. KHÔNG đưa dữ liệu học sinh thật vào mã nguồn.
-- Mật khẩu mọi tài khoản mẫu: Demo@2026  |  Đăng nhập bằng email dưới đây hoặc mã (vd. hs2026001).
-- =====================================================================

with seed(id, code, full_name) as (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'hs2026001', 'Nguyễn Minh Anh'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'hs2026002', 'Trần Gia Bảo'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'hs2026003', 'Lê Hoàng Yến'),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'gv2026001', 'Trần Thu Hà'),
  ('00000000-0000-4000-8000-000000000012'::uuid, 'tv2026001', 'Lê Quốc Bảo'),
  ('00000000-0000-4000-8000-000000000013'::uuid, 'qs2026001', 'Phạm Văn Long'),
  ('00000000-0000-4000-8000-000000000014'::uuid, 'bgh2026001', 'Nguyễn Thị Lan')
),
new_users as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
         code || '@school.example', crypt('Demo@2026', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', full_name),
         now(), now(), '', '', '', ''
  from seed
  on conflict (id) do nothing
  returning id
),
new_identities as (
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), id, id::text,
         jsonb_build_object('sub', id::text, 'email', code || '@school.example', 'email_verified', true),
         'email', now(), now(), now()
  from seed
  on conflict do nothing
  returning user_id
)
select (select count(*) from new_users) as users_created, (select count(*) from new_identities) as identities_created;

-- Vai trò do quản trị đặt (trigger handle_new_user luôn tạo học sinh; đây là bước của quản trị viên hệ thống).
-- Giáo viên chủ nhiệm dùng vai trò 'teacher' (thêm ở migration 002).
update public.users u
set role = s.role::public.user_role, class_name = s.class_name, student_code = s.student_code, department = s.department
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'student',    '11A2', 'HS2026001', null),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'student',    '10A1', 'HS2026002', null),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'student',    '10A3', 'HS2026003', null),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'teacher',    null,   null,        'Tổ Ngữ văn – GVCN 11A2'),
  ('00000000-0000-4000-8000-000000000012'::uuid, 'counselor',  null,   null,        'Tổ tư vấn học đường'),
  ('00000000-0000-4000-8000-000000000013'::uuid, 'supervisor', null,   null,        'Quản sinh'),
  ('00000000-0000-4000-8000-000000000014'::uuid, 'admin',      null,   null,        'Ban giám hiệu')
) as s(id, role, class_name, student_code, department)
where u.id = s.id;

-- Một yêu cầu tư vấn đang được xử lý, một báo cáo ẩn danh mới, một góp ý công khai.
insert into public.counseling_requests (id, student_id, category, description, status, counselor_id, is_anonymous, privacy_level, meeting_preference, created_at)
values ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-000000000001', 'study_pressure',
        'Dạo này mình áp lực vì lịch học dày và sắp thi cuối kỳ.', 'in_progress', '00000000-0000-4000-8000-000000000012',
        false, 'standard', 'in_person', now() - interval '6 days')
on conflict (id) do nothing;

insert into public.incidents (id, reporter_id, incident_type, severity, description, status, is_anonymous, created_at)
values ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001', 'cyberbullying', 'serious',
        'Có nhóm chat lớp đăng ảnh chế và lời lẽ chê bai một bạn.', 'submitted', true, now() - interval '1 day')
on conflict (id) do nothing;

insert into public.suggestions (id, author_id, title, content, category, visibility, is_anonymous)
values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-000000000002', 'Thêm ghế đá ở sân trường',
        'Giờ ra chơi nhiều bạn không có chỗ ngồi nghỉ, mong nhà trường bổ sung ghế ở khu sân sau.', 'facilities', 'public', false)
on conflict (id) do nothing;
