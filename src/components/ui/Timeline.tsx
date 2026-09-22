import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TimelineItem {
  id: string
  title: string
  time?: string
  detail?: ReactNode
  icon?: ReactNode
  tone?: 'brand' | 'teal' | 'ok' | 'warn' | 'danger' | 'neutral'
}

const dot = {
  brand: 'bg-brand-soft-2 text-brand-ink',
  teal: 'bg-teal-soft text-teal-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
  neutral: 'bg-surface-2 text-ink-2',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={it.id} className="relative flex gap-3.5 pb-6 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line" aria-hidden />}
          <span className={cn('z-[1] flex size-8 shrink-0 items-center justify-center rounded-full', dot[it.tone ?? 'brand'])} aria-hidden>
            {it.icon}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-medium text-ink">{it.title}</p>
              {it.time && <time className="text-caption text-ink-3">{it.time}</time>}
            </div>
            {it.detail && <div className="mt-1 text-body text-ink-2">{it.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
