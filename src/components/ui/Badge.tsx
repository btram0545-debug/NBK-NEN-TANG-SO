import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { SEVERITY_LABEL, SEVERITY_TONE, STATUS_LABEL, STATUS_TONE, type Tone } from '@/lib/labels'
import type { CaseStatus, Severity } from '@/types'

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  brand: 'bg-brand-soft text-brand-ink',
  teal: 'bg-teal-soft text-teal-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
}
const dots: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  brand: 'bg-brand',
  teal: 'bg-teal',
  ok: 'bg-ok-ink',
  warn: 'bg-warn-ink',
  danger: 'bg-danger',
}

export function Badge({ tone = 'neutral', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium leading-5', tones[tone], className)}>
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} aria-hidden />}
      {children}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: CaseStatus }) => (
  <Badge tone={STATUS_TONE[status]} dot>
    {STATUS_LABEL[status]}
  </Badge>
)

export const SeverityBadge = ({ severity }: { severity: Severity }) => (
  <Badge tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</Badge>
)
