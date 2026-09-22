// GitHub Pages không có rewrite cho SPA: bản sao index.html thành 404.html
// để link sâu (vd. /student/counseling) vẫn nạp được ứng dụng.
import { copyFileSync, existsSync } from 'node:fs'

const index = 'dist/index.html'
if (!existsSync(index)) {
  console.error('Không tìm thấy dist/index.html — hãy chạy vite build trước.')
  process.exit(1)
}
copyFileSync(index, 'dist/404.html')
console.log('Đã tạo dist/404.html (SPA fallback cho GitHub Pages).')
