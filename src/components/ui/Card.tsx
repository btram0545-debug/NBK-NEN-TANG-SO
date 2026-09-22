import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Khối nội dung có viền mảnh. Dùng tiết chế: ưu tiên khoảng trắng và tiêu đề để tạo thứ bậc. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-box border border-line bg-surface', className)} {...rest} />
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-h2 font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-caption text-ink-3">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-h1 font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-body text-ink-2">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}
