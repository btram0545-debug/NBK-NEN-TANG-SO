import { useEffect } from 'react'
import { ArrowUpRight, Lock } from 'lucide-react'
import { env } from '@/lib/env'
import { Tooltip } from '@/components/ui'

function quickExit() {
  // replace(): trang hiện tại không nằm lại trong danh sách "quay lại" của tab này.
  window.location.replace(env.quickExitUrl)
}

/**
 * Thanh riêng tư kèm nút Thoát nhanh.
 * Lưu ý trung thực: nút chỉ chuyển sang trang khác ngay lập tức; KHÔNG xóa lịch sử trình duyệt hay dấu vết mạng.
 */
export function QuickExitBar() {
  useEffect(() => {
    let last = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const now = Date.now()
      if (now - last < 600) quickExit()
      last = now
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="sticky top-14 z-20 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-8 lg:px-8">
      <p className="flex items-center gap-2 text-caption text-ink-2">
        <Lock className="size-3.5 text-teal" aria-hidden />
        Khu vực riêng tư
      </p>
      <Tooltip content="Chuyển ngay sang trang khác (hoặc nhấn Esc hai lần). Nút này không xóa lịch sử duyệt web — nếu cần, hãy dùng chế độ ẩn danh của trình duyệt.">
        <button
          type="button"
          onClick={quickExit}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-caption font-medium text-ink hover:bg-surface-2"
        >
          Thoát nhanh
          <ArrowUpRight className="size-3.5" aria-hidden />
        </button>
      </Tooltip>
    </div>
  )
}
