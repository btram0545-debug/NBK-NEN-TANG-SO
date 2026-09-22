# RBAC

Năm vai trò: `student`, `teacher`, `counselor`, `supervisor`, `admin` (Ban giám hiệu). Giáo viên và tư vấn viên dùng chung cổng `/teacher/*` nhưng khác phạm vi quyền.

| Quyền | Học sinh | Giáo viên | Tư vấn viên | Quản sinh | Ban giám hiệu |
|---|---|---|---|---|---|
| Xem trường hợp | Của mình | Được giao | Được giao | Tất cả\* | Tất cả\* |
| Cập nhật trạng thái | – | Ca được giao (đang xử lý / cần bổ sung / đã xử lý) | Như giáo viên | Mọi trạng thái | Mọi trạng thái |
| Phân công, đổi mức độ | – | – | – | Có | Có |
| Chuyển Ban giám hiệu | – | – | – | Có | – |
| Phê duyệt can thiệp | – | – | – | – | Có |
| Ghi chú riêng tư (đọc/ghi) | – | – | Ca phụ trách | – | Đọc khi được cấp quyền có thời hạn |
| Đặt lịch hẹn | – | – | Ca phụ trách | Có | – |
| Số liệu tổng hợp | – | – | – | Có | Có |
| Người dùng, nhật ký hoạt động | – | – | – | – | Có |

\* Trừ nội dung ở mức *riêng tư cao* và danh tính người gửi *ẩn danh*: hai thông tin này bị che ở cấp cơ sở dữ liệu.

## Nguyên tắc

- RBAC kết hợp PostgreSQL RLS và RPC `security definer`; kiểm tra vai trò ở frontend chỉ để điều hướng.
- Đăng ký mới luôn là `student`, bất kể metadata. Người dùng không tự đổi được vai trò, trạng thái, mã học sinh, lớp.
- Quản trị viên không tự thay đổi vai trò/trạng thái của chính mình.
- Tài khoản bị vô hiệu hóa (`is_active = false`) mất quyền ghi ngay lập tức.
- Nhân sự đọc ca qua các view `staff_incidents`, `staff_counseling`, không đọc thẳng bảng gốc.
- Việc cấp quyền đọc ghi chú riêng tư (`grant_private_note_access`) chỉ do Ban giám hiệu thực hiện, có thời hạn và được ghi nhật ký.

- Ở cấp cơ sở dữ liệu, các thao tác chuyển lên Ban giám hiệu và đặt lịch hẹn được phép cho cả quản sinh và Ban giám hiệu (`is_case_power()`); giao diện chỉ hiển thị chúng cho quản sinh (và người phụ trách với lịch hẹn) vì Ban giám hiệu là bên nhận ca.

## Kiểm thử

`supabase/tests/rbac_smoke.sql` (73 phép kiểm tra) chạy bằng `supabase/tests/run.sh`; xem README mục 8.
