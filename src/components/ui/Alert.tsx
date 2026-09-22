import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Kind = 'info' | 'success' | 'warning' | 'danger' | 'privacy'
const styles: Record<Kind, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-brand-soft text-brand-ink', icon: <Info className="size-5" /> },
  success: { box: 'bg-ok-soft text-ok-ink', icon: <CheckCircle2 className="size-5" /> },
  warning: { box: 'bg-warn-soft text-warn-ink', icon: <AlertTriangle className="size-5" /> },
  danger: { box: 'bg-danger-soft text-danger-ink', icon: <XCircle className="size-5" /> },
  privacy: { box: 'bg-teal-soft text-teal-ink', icon: <ShieldCheck className="size-5" /> },
}

export function Alert({ kind = 'info', title, children, action, className }: { kind?: Kind; title?: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  const s = styles[kind]
  return (
    <div role={kind === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-box px-4 py-3.5', s.box, className)}>
      <span className="mt-0.5 shrink-0" aria-hidden>{s.icon}</span>
      <div className="min-w-0 flex-1 text-caption leading-relaxed">
        {title && <p className="text-body font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-[0.875rem]')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
