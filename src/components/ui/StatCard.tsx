import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'brand' | 'teal' | 'warn' | 'danger' | 'ok'
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand-ink',
    teal: 'bg-teal-soft text-teal-ink',
    warn: 'bg-warn-soft text-warn-ink',
    danger: 'bg-danger-soft text-danger-ink',
    ok: 'bg-ok-soft text-ok-ink',
  }
  return (
    <Card className="flex items-start justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-caption text-ink-3">{label}</p>
        <p className="mt-1 text-[1.75rem] font-semibold leading-none tracking-tight text-ink tabular-nums">{value}</p>
        {hint && <p className="mt-2 text-caption text-ink-3">{hint}</p>}
      </div>
      {icon && (
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-ctl', tones[tone])} aria-hidden>
          {icon}
        </span>
      )}
    </Card>
  )
}
