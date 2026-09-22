import { Link } from 'react-router-dom'
import { CalendarClock, ClipboardCheck, Siren } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useAppointments, useStaffCases } from '@/data/hooks'
import { formatTime, isSameDay } from '@/lib/format'
import { isActiveStatus, ROLE_LABEL } from '@/lib/labels'
import { CaseRow, listBox } from '@/components/cases/CaseRow'
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Section, StatCard } from '@/components/ui'

const RANK = { urgent: 0, serious: 1, normal: 2 }

export default function TeacherDashboard() {
  const me = useMe()
  const cases = useStaffCases()
  const appts = useAppointments()
  const active = (cases.data ?? []).filter((c) => isActiveStatus(c.status)).sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.updatedAt.localeCompare(a.updatedAt))
  const today = (appts.data ?? []).filter((a) => a.status === 'scheduled' && isSameDay(a.scheduledAt))
  const hour = new Date().getHours()
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="space-y-8">
      <PageHeader title={`${hello}, ${me.fullName.split(' ').pop()}`} description={`${ROLE_LABEL[me.role]}${me.department ? ` · ${me.department}` : ''}`} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Đang phụ trách" value={active.length} icon={<ClipboardCheck className="size-5" />} hint="Trường hợp chưa xử lý xong" />
        <StatCard label="Cần ưu tiên" value={active.filter((c) => c.severity !== 'normal').length} tone="warn" icon={<Siren className="size-5" />} hint="Nghiêm trọng hoặc khẩn cấp" />
        <StatCard label="Lịch hẹn hôm nay" value={today.length} tone="teal" icon={<CalendarClock className="size-5" />} hint={today[0] ? `Sớm nhất lúc ${formatTime(today[0].scheduledAt)}` : 'Hôm nay bạn không có lịch'} />
      </div>

      <Section title="Cần bạn xem" action={active.length > 5 ? <Link to="/teacher/cases" className="text-caption font-medium text-brand-ink hover:underline">Xem tất cả</Link> : undefined}>
        {cases.isLoading ? <div className={listBox}><ListSkeleton rows={3} /></div> : cases.isError ? <ErrorState error={cases.error} onRetry={() => void cases.refetch()} /> : active.length === 0 ? (
          <div className="rounded-box border border-dashed border-line-strong"><EmptyState icon={<ClipboardCheck className="size-7" />} title="Bạn chưa có trường hợp nào cần xử lý." description="Khi quản sinh giao ca cho bạn, ca đó sẽ hiện ở đây kèm thông báo." /></div>
        ) : (
          <div className={listBox}>{active.slice(0, 5).map((c) => <CaseRow key={c.id} item={c} portal="teacher" />)}</div>
        )}
      </Section>
    </div>
  )
}
