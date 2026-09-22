import type { ReactNode } from 'react'

/** Thanh hành động dính đáy (mobile) — nút to, dễ chạm; trên desktop nằm cuối biểu mẫu. */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 px-4 pb-safe pt-3 backdrop-blur-md sm:px-6 lg:static lg:z-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="mx-auto flex max-w-2xl items-center gap-3 pb-3 lg:pb-0">{children}</div>
    </div>
  )
}
