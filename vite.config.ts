import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// VITE_BASE_PATH: dùng khi deploy lên GitHub Pages dạng project site, ví dụ "/school-digital-platform/".
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // Chunk biểu đồ (Recharts) chỉ nạp khi vào trang có biểu đồ.
  build: { chunkSizeWarningLimit: 900 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
