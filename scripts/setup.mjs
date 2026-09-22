// npm run setup: chuẩn bị môi trường phát triển lần đầu.
import { copyFileSync, existsSync } from 'node:fs'

if (!existsSync('.env.local')) {
  copyFileSync('.env.example', '.env.local')
  console.log('Đã tạo .env.local từ .env.example.')
} else {
  console.log('.env.local đã tồn tại — giữ nguyên.')
}
console.log(`
Xong. Bước tiếp theo:
  npm run dev

Chưa điền VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY?
Ứng dụng sẽ chạy ở chế độ demo (dữ liệu mẫu, không lưu lên máy chủ).`)
