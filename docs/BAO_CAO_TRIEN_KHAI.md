# Báo cáo thiết kế lại: Nền tảng tư vấn học đường

## A. Những gì đã thay đổi

**Từ**: một demo một tệp (`App.tsx`) với dữ liệu giả và nút "quản lý mẫu".
**Thành**: ứng dụng nhiều vai trò, có định tuyến, thư viện thành phần, lớp dữ liệu hai chế độ và phân quyền ở cơ sở dữ liệu.

- **Sản phẩm**: đổi tên thành "Nền tảng tư vấn học đường"; 5 vai trò (học sinh, giáo viên, tư vấn viên, quản sinh, Ban giám hiệu); 4 cổng làm việc; toàn bộ tiếng Việt.
- **Giao diện**: bộ token thiết kế (sáng mặc định, tối thiết kế riêng), thư viện thành phần (`src/components/ui`), khung ứng dụng có thanh bên thu gọn được và thanh điều hướng dưới trên mobile, các trạng thái rỗng / đang tải / lỗi cho mọi trang.
- **Học sinh**: trang chủ, đăng ký tư vấn 4 bước, báo cáo sự việc (ẩn danh, bằng chứng, Thoát nhanh), hộp thư góp ý, lịch hẹn, tin nhắn, thông báo, hồ sơ.
- **Nhân sự**: bảng ca có lọc/tìm, chi tiết ca hai cột (nội dung, diễn biến, xử lý), phân công, chuyển ca, phê duyệt, ghi chú riêng tư, đặt lịch.
- **Ban giám hiệu**: trung tâm điều hành, báo cáo tổng hợp (in/CSV), người dùng, nhật ký, cấu hình và ma trận phân quyền.
- **Cơ sở dữ liệu**: migration 002–004 (vai trò giáo viên, RBAC/RLS + RPC + view che thông tin, kho bằng chứng riêng tư); bộ kiểm thử 73 phép kiểm tra.
- **Hạ tầng**: CI có job cơ sở dữ liệu, deploy GitHub Pages có base path tự động, devcontainer, seed phát triển, README và docs viết lại.

**Lỗi thật đã phát hiện nhờ kiểm thử**
- View `staff_counseling` trả `NULL` thay vì `FALSE` cho ca riêng tư cao chưa được giao, làm lộ danh tính/nội dung. Đã sửa (`coalesce`) và có kiểm thử chặn lại.
- `tailwind-merge` xóa nhầm `text-on-brand` (chữ nút chính bị tối). Đã cấu hình lại.
- Trang chủ học sinh tràn ngang trên mobile; mã ca demo trùng nhau. Đã sửa.

## B. Kiến trúc

```
Trình duyệt (React) ── src/data/api.ts (hợp đồng duy nhất)
                         ├─ mockApi.ts      (demo, trong bộ nhớ)
                         └─ supabaseApi.ts  (Supabase: Auth, PostgREST, RPC, Storage)
Supabase: Postgres (RLS + view staff_* + RPC security definer) · Storage (bucket evidence riêng tư)
```

Quyền do cơ sở dữ liệu quyết định; giao diện chỉ ẩn/hiện. Chi tiết: `docs/ARCHITECTURE.md`, `docs/RBAC.md`, `docs/DATABASE.md`.

## C. Cách chạy

```bash
npm run setup && npm run dev      # chế độ demo, mật khẩu chung Demo@2026
npm run typecheck && npm run lint && npm test && npm run build
DB_URL=postgresql:///sctest bash supabase/tests/run.sh   # kiểm thử cơ sở dữ liệu (Postgres trống)
```

## D. Cách triển khai

Push `main` → `deploy.yml` kiểm tra, build, đưa lên GitHub Pages. Cần secrets `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY`; nếu thiếu, bản triển khai chạy chế độ demo và workflow cảnh báo. Xem README mục 9.

## E. Thiết lập Supabase

Tạo dự án → chạy migration 001–004 → tắt đăng ký công khai → tạo tài khoản → đặt Ban giám hiệu đầu tiên bằng SQL → điền `.env.local`. Xem README mục 7.

## F. Chưa hoàn thành và chưa được kiểm chứng

**Đã kiểm chứng bằng cách chạy**: typecheck, lint, 24 kiểm thử giao diện/dữ liệu demo, build, 73 phép kiểm tra phân quyền trên Postgres 16, kiểm tra tràn ngang và lỗi console trên 33 route ở 390 px và các route chính ở 768/1024 px, xem ảnh chụp các màn hình chính (sáng và tối).

**Chưa kiểm chứng**
- Chưa chạy với một dự án Supabase thật hoặc Supabase local (`supabaseApi.ts` và seed chỉ được kiểm tra gián tiếp qua giả lập Postgres). Cần thử đăng nhập, tải bằng chứng và từng RPC trên môi trường thật.
- Chưa chạy GitHub Actions thật; phiên bản action lấy từ repo gốc.
- Chưa kiểm tra khả năng truy cập bằng axe/Lighthouse hay trình đọc màn hình; chưa có E2E.
- Chưa xem lại ảnh chụp của mọi trang (một số trang chỉ được kiểm tra tự động).

**Chưa làm**: đặt lại mật khẩu tự động, Realtime cho tin nhắn, trình xem bằng chứng cho nhân sự, màn hình kiểm duyệt góp ý, cấp quyền xem ghi chú riêng tư từ giao diện, trợ lý AI.

**Lưu ý**: mật khẩu demo `Demo@2026` nằm trong JavaScript đã build. Không dùng bản demo cho học sinh thật. Trước khi vận hành thật, hoàn thành checklist trong `docs/DEPLOYMENT.md` và nhờ chuyên gia rà soát bảo mật, bảo vệ dữ liệu trẻ em; nên có quy trình xử lý ca khẩn cấp ngoài hệ thống.
