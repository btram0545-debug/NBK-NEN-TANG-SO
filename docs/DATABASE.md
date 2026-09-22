# Database

Xem SQL tại `supabase/migrations/`:

| Tệp | Nội dung |
|---|---|
| `001_initial_schema.sql` | Lược đồ ban đầu: `users`, `incidents`, `incident_evidence`, `counseling_requests`, `counseling_appointments`, `private_case_notes`, `suggestions`, `suggestion_votes`, `audit_logs` |
| `002_add_teacher_role.sql` | Thêm vai trò `teacher` (tách tệp vì enum mới phải commit trước khi dùng) |
| `003_rbac_case_management.sql` | Cột bổ sung (ẩn danh, mức riêng tư, leo thang, phê duyệt…), bảng `case_events`, `private_note_grants`, `notifications`, `messages`; hàm và trigger; chính sách RLS; view `staff_*`, `suggestion_feed`; các RPC quản lý ca |
| `004_evidence_storage.sql` | Bucket riêng tư `evidence` (25 MB, chỉ ảnh/video/âm thanh) và chính sách tải lên/đọc |

## Ghi chú thiết kế

- Đường dẫn bằng chứng: `incidents/<incident_id>/<uuid>-<tên tệp>`; không chứa mã người gửi để không lộ danh tính báo cáo ẩn danh. Không có chính sách sửa/xóa: bằng chứng đã gửi là bất biến.
- Hàm nội bộ (`push_notification`, `write_audit`, `add_case_event`…) bị thu hồi quyền gọi từ client; các RPC công khai được cấp `execute` cho `authenticated` một cách tường minh.
- Nhật ký (`audit_logs`) chỉ ghi ai làm gì, khi nào; không chứa nội dung chia sẻ hay ghi chú riêng tư.
- Dữ liệu bằng chứng nằm ở private bucket; không dùng URL công khai.

## Seed và kiểm thử

- `supabase/seed.sql`: dữ liệu **phát triển** (7 tài khoản, vài ca mẫu). Không chạy trên dự án thật.
- `supabase/tests/run.sh`: dựng giả lập Supabase tối thiểu trên Postgres trống, chạy migration, kiểm thử phân quyền, rồi nạp seed.
