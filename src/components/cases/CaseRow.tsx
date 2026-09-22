import { Link } from 'react-router-dom'
import { ChevronRight, MessageCircleHeart, ShieldAlert, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, relativeTime } from '@/lib/format'
import { caseHref } from '@/lib/routes'
import type { CaseItem, Portal } from '@/types'
import { SeverityBadge, StatusBadge } from '@/components/ui'

export function CaseIcon({ kind, severity, className }: { kind: CaseItem['kind']; severity?: CaseItem['severity']; className?: string }) {
  const Icon = kind === 'incident' ? ShieldAlert : MessageCircleHeart
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        severity === 'urgent' ? 'bg-danger-soft text-danger-ink' : kind === 'incident' ? 'bg-teal-soft text-teal-ink' : 'bg-brand-soft text-brand-ink',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

/** Một dòng trong danh sách ca (dành cho học sinh và nhân sự). */
export function CaseRow({ item, portal, showAssignee }: { item: CaseItem; portal: Portal; showAssignee?: boolean }) {
  return (
    <Link
      to={caseHref(portal, item.kind, item.id)}
      className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-2/60 sm:px-5"
    >
      <CaseIcon kind={item.kind} severity={item.severity} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-medium text-ink">{item.title}</p>
          {item.isAnonymous && (
            <span className="inline-flex items-center gap-1 text-caption text-ink-3">
              <EyeOff className="size-3.5" aria-hidden /> Ẩn danh
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-caption text-ink-3">
          <span className="font-mono">{item.code}</span> · Gửi {formatDate(item.createdAt)} · {relativeTime(item.updatedAt)}
          {showAssignee && <> · {item.assignee ? item.assignee.name : 'Chưa phân công'}</>}
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        {item.severity !== 'normal' && <SeverityBadge severity={item.severity} />}
        <StatusBadge status={item.status} />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
        <StatusBadge status={item.status} />
      </div>
      <ChevronRight className="hidden size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden />
    </Link>
  )
}

export const listBox = 'divide-y divide-line overflow-hidden rounded-box border border-line bg-surface'
