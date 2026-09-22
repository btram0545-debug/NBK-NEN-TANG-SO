# Nền tảng tư vấn học đường

> Nơi học sinh được lắng nghe, hỗ trợ và đồng hành.

Ứng dụng web giúp học sinh THPT **xin tư vấn học đường**, **báo cáo sự việc** (kể cả ẩn danh) và **góp ý cho nhà trường**; giúp giáo viên, tư vấn viên, quản sinh và Ban giám hiệu tiếp nhận – phân công – theo dõi xử lý theo đúng quyền hạn.

Ứng dụng chạy được ngay ở **chế độ demo** (dữ liệu mẫu trong trình duyệt, không cần máy chủ) và chuyển sang **dữ liệu thật** khi cấu hình Supabase. Quyền truy cập luôn được kiểm tra ở cơ sở dữ liệu (RLS + RPC), giao diện chỉ ẩn/hiện theo đó.

## Mục lục

1. [Tính năng](#1-tính-năng)
2. [Vai trò và phân quyền](#2-vai-trò-và-phân-quyền)
3. [Công nghệ và kiến trúc](#3-công-nghệ-và-kiến-trúc)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Chạy thử nhanh (demo)](#5-chạy-thử-nhanh-demo)
6. [Biến môi trường](#6-biến-môi-trường)
7. [Thiết lập Supabase (dữ liệu thật)](#7-thiết-lập-supabase-dữ-liệu-thật)
8. [Kiểm thử](#8-kiểm-thử)
9. [Triển khai lên GitHub Pages](#9-triển-khai-lên-github-pages)
10. [Bảo mật và quyền riêng tư](#10-bảo-mật-và-quyền-riêng-tư)
11. [Thiết kế giao diện](#11-thiết-kế-giao-diện)
12. [Khả năng truy cập](#12-khả-năng-truy-cập)
13. [Hạn chế đã biết](#13-hạn-chế-đã-biết)
14. [Lộ trình](#14-lộ-trình)
15. [Tài liệu liên quan](#15-tài-liệu-liên-quan)

## 1. Tính năng

**Học sinh**
- Trang chủ với ô "hôm nay bạn thấy thế nào" (chỉ lưu trên thiết bị, không gửi đi, không dùng để đánh giá).
- Đăng ký tư vấn 4 bước; chọn *gửi ẩn danh* và mức riêng tư (*thông thường* / *riêng tư cao*).
- Báo cáo sự việc: loại, mức độ, thời điểm, địa điểm, người liên quan, đính kèm ảnh/video/âm thanh (kho riêng tư), gửi ẩn danh. Có nút **Thoát nhanh** (hoặc nhấn Esc hai lần).
- Hộp thư góp ý kiểu bảng tin: công khai (có ủng hộ) hoặc riêng tư.
- Theo dõi tiến trình từng yêu cầu, lịch hẹn, nhắn tin với người phụ trách, thông báo.

**Giáo viên / tư vấn viên**
- Danh sách ca được giao, cập nhật trạng thái, ghi nhận hỗ trợ, đặt lịch hẹn, nhắn tin.
- Tư vấn viên phụ trách có thêm **ghi chú riêng tư** mà không ai khác xem được.

**Quản sinh**
- Tiếp nhận, phân loại, phân công; đổi mức độ; chuyển ca lên Ban giám hiệu.
- Bảng số liệu và biểu đồ theo tuần / loại sự việc.

**Ban giám hiệu**
- "Trung tâm điều hành": chỉ số tổng quan, mục **Cần chú ý**, xu hướng, phân bố theo trạng thái / loại / khối.
- Phê duyệt can thiệp, báo cáo tổng hợp (in, xuất CSV), quản lý người dùng, nhật ký hoạt động.

**Chung**: giao diện sáng (mặc định) và tối, responsive (điện thoại → máy tính), tiếng Việt toàn bộ.

## 2. Vai trò và phân quyền

| Quyền | Học sinh | Giáo viên | Tư vấn viên | Quản sinh | Ban giám hiệu |
|---|---|---|---|---|---|
| Xem trường hợp | Của mình | Được giao | Được giao | Tất cả\* | Tất cả\* |
| Cập nhật trạng thái | – | Ca được giao | Ca được giao | Có | Có |
| Phân công, đổi mức độ | – | – | – | Có | Có |
| Chuyển Ban giám hiệu | – | – | – | Có | – |
| Phê duyệt can thiệp | – | – | – | – | Có |
| Ghi chú riêng tư | – | – | Ca phụ trách | – | Khi được cấp quyền có thời hạn |
| Số liệu tổng hợp | – | – | – | Có | Có |
| Người dùng, nhật ký | – | – | – | – | Có |

\* Trừ nội dung ở mức *riêng tư cao* và danh tính của người gửi *ẩn danh*.

Cơ sở dữ liệu cho phép cả Ban giám hiệu gọi thao tác chuyển ca và đặt lịch, nhưng giao diện chỉ hiển thị chúng cho quản sinh (và người phụ trách với lịch hẹn).

Giáo viên và tư vấn viên dùng chung cổng làm việc (`/teacher/*`) nhưng khác phạm vi quyền. Đăng ký mới **luôn** là học sinh; chỉ Ban giám hiệu (hoặc quản trị hệ thống qua SQL) mới nâng vai trò.

## 3. Công nghệ và kiến trúc

- **Giao diện**: React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI, Recharts, React Router, TanStack Query.
- **Dữ liệu**: Supabase (PostgreSQL + Auth + Storage). Toàn bộ giao diện chỉ gọi qua một hợp đồng duy nhất `src/data/api.ts` với hai cách cài đặt:
  - `mockApi.ts`: demo trong bộ nhớ, mô phỏng đúng các quy tắc phân quyền.
  - `supabaseApi.ts`: dữ liệu thật; ghi dữ liệu qua RPC, nhân sự đọc qua các view đã che thông tin.
- **Phân quyền**: RLS trên mọi bảng, các view `staff_*` che danh tính/nội dung, RPC `security definer` kiểm tra vai trò cho từng thao tác; mọi hàm nội bộ bị thu hồi quyền gọi từ client.
- **CI/CD**: GitHub Actions (kiểm tra web, kiểm thử cơ sở dữ liệu, triển khai GitHub Pages).

Chọn cài đặt nào phụ thuộc biến môi trường: có `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` thì dùng Supabase, không thì demo.

## 4. Cấu trúc thư mục

```
src/
  auth/            phiên đăng nhập, chặn route theo vai trò
  components/      ui/ (thư viện thành phần), layout/, cases/, charts/
  data/            api.ts (hợp đồng), mockApi.ts, supabaseApi.ts, hooks.ts
  lib/             nhãn tiếng Việt, định dạng, theme, biến môi trường
  pages/           student/, staff/, admin/, shared/, Login
  styles/index.css bộ token thiết kế (màu, bo góc, kiểu chữ, chuyển động)
  types/           kiểu dữ liệu dùng chung
supabase/
  migrations/      001..004 (lược đồ, vai trò giáo viên, RBAC/RLS, kho bằng chứng)
  tests/           rbac_smoke.sql, stub_supabase.sql, run.sh
  seed.sql         dữ liệu mẫu cho môi trường phát triển
docs/              SRS, kiến trúc, cơ sở dữ liệu, RBAC, bảo mật, triển khai
.github/workflows/ ci.yml, deploy.yml
```

## 5. Chạy thử nhanh (demo)

Yêu cầu Node.js 20 trở lên.

```bash
npm run setup      # cài phụ thuộc + tạo .env.local từ .env.example
npm run dev        # http://localhost:5173
```

Ở chế độ demo, trang đăng nhập có nút chọn nhanh 5 vai trò. Mật khẩu chung: `Demo@2026`. Dữ liệu chỉ nằm trong trình duyệt và mất khi tải lại trang.

Các lệnh khác: `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck`, `npm test`.

Dùng GitHub Codespaces: mở repo bằng Codespaces, môi trường tự cài đặt qua `.devcontainer`.

## 6. Biến môi trường

Sao chép `.env.example` thành `.env.local`. **Không commit** `.env.local`.

| Biến | Ý nghĩa |
|---|---|
| `VITE_SUPABASE_URL` | URL dự án Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Khóa publishable/anon. **Không bao giờ** dùng service-role key ở đây |
| `VITE_SCHOOL_NAME` | Tên trường hiển thị ở trang đăng nhập |
| `VITE_QUICK_EXIT_URL` | Trang trung tính mà nút Thoát nhanh chuyển tới |
| `VITE_ACCOUNT_EMAIL_DOMAIN` | Cho phép đăng nhập bằng mã (vd. `hs2026001` → `hs2026001@<miền>`) |
| `VITE_SHOW_DEMO_ACCOUNTS` | Chỉ khi chạy dev với Supabase local đã seed: hiện tài khoản mẫu |
| `VITE_BASE_PATH` | Đường dẫn gốc khi deploy dạng project site (workflow tự đặt) |

## 7. Thiết lập Supabase (dữ liệu thật)

1. **Tạo dự án** trên [supabase.com](https://supabase.com).
2. **Chạy migration theo thứ tự** `001` → `004` trong `supabase/migrations/` (Supabase CLI: `supabase link` rồi `supabase db push`; hoặc dán từng tệp vào SQL Editor). Migration `004` tạo sẵn bucket riêng tư `evidence`.
3. **Tắt đăng ký công khai**: trong phần cấu hình Authentication của Supabase, tắt tùy chọn cho phép đăng ký mới (tên mục có thể khác theo phiên bản giao diện Supabase). Tài khoản do nhà trường cấp (Authentication → Users → *Add user*).
4. **Tạo tài khoản quản trị đầu tiên**: thêm người dùng trong Auth, rồi ở SQL Editor chạy (vai trò `postgres` được phép, người dùng thường thì không):
   ```sql
   update public.users set role = 'admin', full_name = 'Họ tên', department = 'Ban giám hiệu'
   where id = '<uuid người dùng trong Auth>';
   ```
   Các vai trò còn lại (`teacher`, `counselor`, `supervisor`, `student`) do Ban giám hiệu đổi trong giao diện **Người dùng**.
5. **Điền `.env.local`** (URL + publishable key ở Project Settings → API).
6. **Kiểm tra**: đăng nhập bằng từng vai trò, thử mở đường dẫn không thuộc quyền và xác nhận bị chặn.

Dữ liệu mẫu cho môi trường **phát triển** (Supabase local): `supabase db reset` sẽ chạy `seed.sql`, tạo 7 tài khoản (mật khẩu `Demo@2026`) và vài ca mẫu. **Đừng chạy seed trên dự án thật.**

## 8. Kiểm thử

```bash
npm test                     # 24 kiểm thử giao diện / dữ liệu demo (Vitest)
npm run typecheck && npm run lint
```

Kiểm thử phân quyền cơ sở dữ liệu (73 phép kiểm tra: cô lập giữa học sinh, che ẩn danh, ghi chú riêng tư, quyền theo vai trò, bằng chứng, thông báo…) chạy trên một Postgres **trống**:

```bash
createdb sctest
DB_URL=postgresql:///sctest bash supabase/tests/run.sh
```

Runner tự dựng phần giả lập Supabase tối thiểu, chạy 4 migration, bộ kiểm thử, rồi nạp seed; thoát mã khác 0 nếu có phép kiểm tra không đạt. CI chạy đúng quy trình này trên Postgres 16 ở mỗi pull request. **Không chạy trên database production.**

## 9. Triển khai lên GitHub Pages

1. Đẩy mã lên GitHub, nhánh `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions:
   - Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - Variables (tùy chọn): `VITE_SCHOOL_NAME`, `VITE_QUICK_EXIT_URL`, `VITE_ACCOUNT_EMAIL_DOMAIN`. Nếu dùng tên miền riêng, đặt `VITE_BASE_PATH` = `/`.
4. Push vào `main`: workflow `deploy.yml` kiểm tra, build và triển khai. Đường dẫn con (`/<tên-repo>/`) được xử lý tự động; `404.html` được tạo để tải lại trang con không bị lỗi.

> Nếu chưa đặt secret Supabase, bản triển khai sẽ chạy ở chế độ **demo** (dữ liệu mẫu) và workflow in cảnh báo. Không dùng bản này cho học sinh thật.

Có thể dùng Vercel/Netlify thay GitHub Pages: đặt cùng các biến môi trường và cấu hình mọi đường dẫn trả về `index.html`.

## 10. Bảo mật và quyền riêng tư

- Frontend chỉ dùng publishable key; không có service-role key trong mã hay build.
- RLS bật trên mọi bảng; nhân sự truy cập ca qua view đã che thông tin, không đọc thẳng bảng gốc.
- Báo cáo ẩn danh: danh tính người gửi bị che khỏi quản sinh/Ban giám hiệu; đường dẫn tệp bằng chứng không chứa mã người gửi.
- Nội dung *riêng tư cao* chỉ tư vấn viên được phân công xem. Ghi chú riêng tư chỉ tư vấn viên phụ trách; Ban giám hiệu chỉ xem khi được cấp quyền có thời hạn (và việc cấp quyền được ghi nhật ký).
- Trạng thái góp ý, người gửi tin nhắn, vai trò khi đăng ký đều do máy chủ quyết định, không tin dữ liệu từ client.
- Tài khoản bị vô hiệu hóa mất quyền ghi ngay lập tức.
- Nút **Thoát nhanh** chỉ chuyển sang trang khác ngay; nó **không xóa** lịch sử duyệt web hay dấu vết mạng. Giao diện nói rõ điều này.
- Tính năng trò chuyện AI **chưa có**; nếu bổ sung phải theo `docs/AI-SAFETY.md` (chỉ hỗ trợ lắng nghe/cung cấp thông tin, có người duyệt khi cần).

Trước khi dùng cho học sinh thật, hãy xem checklist trong `docs/DEPLOYMENT.md` và nhờ chuyên gia bảo mật rà soát.

## 11. Thiết kế giao diện

- Nền sáng lạnh, xanh dương thương hiệu, teal làm điểm nhấn "an toàn"; màu đỏ chỉ dành cho mức Khẩn cấp.
- Chế độ tối được thiết kế lại từng màu ngữ nghĩa (không chỉ đảo màu).
- Bộ token trong `src/styles/index.css`; thành phần dùng lại trong `src/components/ui/`.
- Mobile ưu tiên: thanh điều hành dưới (tối đa 5 mục), thanh hành động dính đáy ở biểu mẫu, bảng chuyển thành thẻ.

## 12. Khả năng truy cập

Đã làm: nhãn và thông báo lỗi gắn với từng trường (`aria-describedby`), vòng focus rõ ràng, lối tắt "Bỏ qua điều hướng", vùng chạm ≥ 44px cho nút chính, tôn trọng `prefers-reduced-motion`, không chỉ dựa vào màu để truyền đạt trạng thái, bảng có `caption` và `scope`.

Chưa làm: chưa chạy công cụ kiểm tra tự động (axe/Lighthouse) và chưa thử với trình đọc màn hình. Nên thực hiện trước khi triển khai chính thức.

## 13. Hạn chế đã biết

- Chế độ demo chứa mật khẩu mẫu `Demo@2026` trong mã JavaScript đã build (dù chỉ dùng cho dữ liệu mẫu).
- Quên mật khẩu: hiện chỉ hướng dẫn liên hệ nhà trường; chưa có luồng đặt lại tự động.
- Nhắn tin cập nhật theo chu kỳ 15 giây (chưa dùng Realtime).
- Bằng chứng đính kèm hiện chỉ hiển thị số lượng; chưa có trình xem tệp cho nhân sự trong giao diện.
- Chưa có kiểm thử đầu-cuối (E2E) trên Supabase thật, chưa có phân trang cho danh sách rất lớn.
- Chưa có màn hình kiểm duyệt góp ý cho nhân sự (RPC `moderate_suggestion` đã có ở cơ sở dữ liệu).

## 14. Lộ trình

Đặt lại mật khẩu; Realtime cho tin nhắn; xem bằng chứng an toàn cho nhân sự; kiểm duyệt góp ý; cấp quyền đọc ghi chú riêng tư cho Ban giám hiệu từ giao diện; báo cáo định kỳ; E2E với Playwright; trợ lý AI có người duyệt (theo `docs/AI-SAFETY.md`).

## 15. Tài liệu liên quan

`docs/SRS.md` · `docs/ARCHITECTURE.md` · `docs/DATABASE.md` · `docs/RBAC.md` · `docs/SECURITY.md` · `docs/AI-SAFETY.md` · `docs/DEPLOYMENT.md` · `docs/PROJECT_PLAN.md`
