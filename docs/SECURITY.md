# Security & Privacy

## Anonymous reporting

Anonymous mode sử dụng token riêng để theo dõi case. Không nên tuyên bố ẩn danh tuyệt đối ở mọi tầng vì hệ thống/thiết bị vẫn có thể có metadata.

## Sensitive data

- Private Storage
- RLS
- Least privilege
- Audit logs
- No secrets in frontend
- No service-role/secret key in browser

## Quick Exit

Chuyển nhanh về màn hình trung tính và loại bỏ dữ liệu nhạy cảm khỏi giao diện hiện tại. Không tuyên bố tính năng này xóa toàn bộ browser/network history.

## Production requirements

Trước khi pilot phải kiểm thử RLS, RBAC, file access, audit và backup/recovery.
