# Hướng dẫn triển khai

Hướng dẫn từng bước đầy đủ nằm ở README (mục 7 và 9). Tóm tắt:

## 1. Repository

```bash
git init && git add . && git commit -m "Nền tảng tư vấn học đường"
git branch -M main
git remote add origin <URL_REPOSITORY>
git push -u origin main
```

## 2. Supabase

1. Tạo dự án.
2. Chạy migration `001` → `005` theo thứ tự (`supabase db push` hoặc SQL Editor). Migration `004` tạo bucket riêng tư `evidence`; migration `005` tạo thông báo tiếp nhận báo cáo cho quản sinh.
3. Tắt đăng ký công khai; tạo tài khoản do nhà trường cấp.
4. Đặt tài khoản Ban giám hiệu đầu tiên bằng SQL (README mục 7, bước 4).
5. Kiểm tra phân quyền: đăng nhập từng vai trò, thử truy cập trái quyền.

## 3. GitHub Actions

- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Variables (tùy chọn): `VITE_SCHOOL_NAME`, `VITE_QUICK_EXIT_URL`, `VITE_ACCOUNT_EMAIL_DOMAIN`, `VITE_BASE_PATH`.
- Không đưa service-role/secret key vào frontend.

Workflows:
- `ci.yml`: pull request và push vào `develop` — typecheck, lint, test, build; job riêng chạy migration và kiểm thử RBAC/RLS trên Postgres 16.
- `deploy.yml`: push vào `main` — kiểm tra, build, triển khai GitHub Pages. Không có secret Supabase thì bản build chạy chế độ demo và workflow in cảnh báo.

## 4. GitHub Pages

Settings → Pages → Source: GitHub Actions. Project site nằm dưới `/<tên-repo>/`; `VITE_BASE_PATH` được đặt tự động, `404.html` được tạo cho việc tải lại trang con.

## 5. Vercel / Netlify

Kết nối repository, đặt cùng biến môi trường, cấu hình mọi đường dẫn về `index.html`, đặt `VITE_BASE_PATH=/`.

## 6. Render

Repository đã có sẵn `render.yaml`. Trong Render chọn **New → Blueprint**, kết nối repository và xác nhận file Blueprint.

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Rewrite SPA: `/*` → `/index.html`
- `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`: nhập trong Environment của Render, không commit vào Git.
- `VITE_SCHOOL_NAME` đã đặt là `Trường THPT Nguyễn Bỉnh Khiêm`; `VITE_BASE_PATH` phải là `/`.

Sau khi deploy, kiểm tra URL gốc và tải lại trực tiếp các route như `/login`, `/student`, `/supervisor/incidents`.

## 7. Checklist trước khi dùng cho học sinh thật

- [ ] Bản triển khai đã kết nối Supabase (không phải chế độ demo)
- [ ] Đã tắt đăng ký công khai
- [ ] Đã chạy `supabase/tests/run.sh` trên Postgres trống và đạt toàn bộ
- [ ] Đã thử trái quyền bằng tài khoản thật của từng vai trò trên môi trường Supabase
- [ ] Bucket `evidence` ở chế độ private
- [ ] Không có bí mật trong mã nguồn; chưa chạy seed trên dự án thật
- [ ] Đã cấu hình sao lưu và khôi phục
- [ ] Đã kiểm tra khả năng truy cập (axe/Lighthouse, trình đọc màn hình)
- [ ] Đã có quy trình xử lý ca khẩn cấp bên ngoài hệ thống (người trực, số điện thoại)
- [ ] Đã nhờ chuyên gia rà soát bảo mật và bảo vệ dữ liệu trẻ em
