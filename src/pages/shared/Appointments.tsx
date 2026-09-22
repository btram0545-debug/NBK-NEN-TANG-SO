import { CalendarDays, ExternalLink, MapPin, Video } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useAppointments } from '@/data/hooks'
import { cn } from '@/lib/cn'
import { formatDate, formatTime, formatWeekday, isSameDay } from '@/lib/format'
import { MEETING_LABEL } from '@/lib/labels'
import type { Appointment } from '@/types'
import { Badge, EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/ui'

function Row({ a, staff }: { a: Appointment; staff: boolean }) {
  const d = new Date(a.scheduledAt)
  const today = isSameDay(d)
  return (
    <li className="flex gap-4 px-4 py-4 sm:px-5">
      <div className={cn('flex w-14 shrink-0 flex-col items-center justify-center rounded-box py-2', today ? 'bg-brand text-on-brand' : 'bg-surface-2 text-ink')}>
        <span className="text-[0.6875rem] font-medium uppercase opacity-80">{new Intl.DateTimeFormat('vi-VN', { month: 'short' }).format(d)}</span>
        <span className="text-h2 font-semibold leading-none">{d.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{a.topic}</p>
        <p className="mt-0.5 text-caption capitalize text-ink-3">{formatWeekday(a.scheduledAt)}, {formatTime(a.scheduledAt)} · {a.durationMinutes} phút · {formatDate(a.scheduledAt)}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-2">
          <span className="inline-flex items-center gap-1.5">{a.type === 'online' ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}{MEETING_LABEL[a.type]}</span>
          <span>{staff ? (a.student ? `Học sinh: ${a.student.name}` : 'Học sinh ẩn danh') : `Tư vấn viên: ${a.counselor.name}`}</span>
          <span className="font-mono text-ink-3">{a.caseCode}</span>
        </p>
        {a.meetingUrl && a.status === 'scheduled' && (
          <a href={a.meetingUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-brand-ink hover:underline">
            Vào phòng họp <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
      {a.status !== 'scheduled' && <Badge tone={a.status === 'done' ? 'ok' : 'neutral'}>{a.status === 'done' ? 'Đã diễn ra' : 'Đã hủy'}</Badge>}
    </li>
  )
}

export default function Appointments({ title = 'Lịch hẹn', description }: { title?: string; description?: string }) {
  const me = useMe()
  const { data, isLoading, isError, error, refetch } = useAppointments()
  const staff = me.role !== 'student'
  const all = [...(data ?? [])]
  const upcoming = all.filter((a) => a.status === 'scheduled' && new Date(a.scheduledAt).getTime() > Date.now() - 3_600_000).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const past = all.filter((a) => !upcoming.includes(a)).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description ?? (staff ? 'Các buổi hẹn bạn phụ trách.' : 'Các buổi hẹn với tư vấn viên của bạn.')} />
      {isLoading ? (
        <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton rows={3} /></div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : all.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong">
          <EmptyState icon={<CalendarDays className="size-7" />} title="Chưa có lịch hẹn nào." description={staff ? 'Khi bạn đặt lịch từ một trường hợp, buổi hẹn sẽ hiện ở đây.' : 'Khi tư vấn viên đặt lịch cho bạn, buổi hẹn sẽ hiện ở đây.'} />
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-h2 font-semibold text-ink">Sắp tới</h2>
            {upcoming.length ? <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-surface">{upcoming.map((a) => <Row key={a.id} a={a} staff={staff} />)}</ul> : <p className="text-body text-ink-3">Không có buổi hẹn nào sắp tới.</p>}
          </section>
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-h2 font-semibold text-ink">Đã qua</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-box border border-line bg-surface opacity-80">{past.map((a) => <Row key={a.id} a={a} staff={staff} />)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
