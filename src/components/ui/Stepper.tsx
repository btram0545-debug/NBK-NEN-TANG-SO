import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Chỉ báo tiến trình cho biểu mẫu nhiều bước. Mobile: thanh tiến trình gọn; desktop: các bước có tên. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Tiến trình" className="space-y-3">
      <p className="text-caption font-medium text-ink-2 sm:hidden">
        Bước {current + 1}/{steps.length} · {steps[current]}
      </p>
      <div className="flex gap-1.5 sm:hidden" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= current ? 'bg-brand' : 'bg-line')} />
        ))}
      </div>
      <ol className="hidden items-center gap-3 sm:flex">
        {steps.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s} className="flex flex-1 items-center gap-3 last:flex-none" aria-current={active ? 'step' : undefined}>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold',
                  done ? 'bg-brand text-on-brand' : active ? 'bg-brand-soft-2 text-brand-ink ring-2 ring-brand' : 'bg-surface-2 text-ink-3',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('text-caption font-medium', active ? 'text-ink' : 'text-ink-3')}>{s}</span>
              {i < steps.length - 1 && <span className={cn('h-px flex-1', done ? 'bg-brand' : 'bg-line')} aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
