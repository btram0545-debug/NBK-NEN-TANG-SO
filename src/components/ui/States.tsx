import type { ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-shimmer rounded-ctl bg-surface-2', className)} />
}

export function EmptyState({ icon, title, description, action, className }: { icon: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink" aria-hidden>
        {icon}
      </div>
      <h3 className="text-h3 font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-body text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Bạn vui lòng thử lại nhé.'
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger-ink" aria-hidden>
        <AlertCircle className="size-7" />
      </div>
      <h3 className="text-h3 font-semibold text-ink">Chưa tải được nội dung</h3>
      <p className="mt-1 max-w-sm text-body text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2.5 py-16 text-ink-3">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-body">{label}</span>
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Đang tải" className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}
