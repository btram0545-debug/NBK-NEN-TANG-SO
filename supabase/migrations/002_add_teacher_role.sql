-- Thêm vai trò "teacher" (giáo viên).
-- Phải nằm trong file riêng: giá trị enum mới chỉ dùng được sau khi transaction commit.
alter type public.user_role add value if not exists 'teacher' before 'supervisor';
