import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarClock, CheckCheck, MessageCircleHeart, Settings2, ShieldAlert } from 'lucide-react'
import { useMarkRead, useNotifications } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import type { AppNotification } from '@/types'
import { Button, EmptyState, ErrorState, FilterPills, ListSkeleton, PageHeader } from '@/components/ui'

const ICON = { counseling: MessageCircleHeart, incident: ShieldAlert, appointment: CalendarClock, system: Settings2 }
type Filter = 'all' | AppNotification['category']

export default function Notifications() {
  const { data, isLoading, isError, error, refetch } = useNotifications()
  const mark = useMarkRead()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const all = data ?? []
  const rows = all.filter((n) => filter === 'all' || n.category === filter)
  const unread = all.filter((n) => !n.read).length

  function open(n: AppNotification) {
    if (!n.read) mark.mutate([n.id])
    if (n.link) navigate(n.link)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo"
        description={unread ? `Bạn có ${unread} thông báo chưa đọc.` : 'Bạn đã xem hết thông báo.'}
        action={unread > 0 ? <Button variant="secondary" size="sm" icon={<CheckCheck className="size-4" />} loading={mark.isPending} onClick={() => mark.mutate(undefined)}>Đánh dấu đã đọc tất cả</Button> : undefined}
      />
      <FilterPills
        label="Loại thông báo"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Tất cả' },
          { value: 'counseling', label: 'Tư vấn' },
          { value: 'incident', label: 'Báo cáo' },
          { value: 'appointment', label: 'Lịch hẹn' },
          { value: 'system', label: 'Hệ thống' },
        ]}
      />
      {isLoading ? (
        <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton /></div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong"><EmptyState icon={<Bell className="size-7" />} title="Chưa có thông báo nào." description="Khi có cập nhật mới, bạn sẽ thấy ở đây." /></div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-surface">
          {rows.map((n) => {
            const I = ICON[n.category]
            return (
              <li key={n.id}>
                <button type="button" onClick={() => open(n)} className={cn('flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-2/60 sm:px-5', !n.read && 'bg-brand-soft/50')}>
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-surface-2 text-ink-3' : 'bg-brand-soft-2 text-brand-ink')} aria-hidden><I className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={cn('text-body', n.read ? 'font-medium text-ink-2' : 'font-semibold text-ink')}>{n.title}</span>
                      <span className="shrink-0 text-caption text-ink-3">{relativeTime(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block text-body text-ink-2">{n.body}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Chưa đọc" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
