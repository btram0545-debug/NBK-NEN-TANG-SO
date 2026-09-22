import { Link } from 'react-router-dom'
import { Activity, Inbox, Siren, Timer } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useOverview, useStaffCases } from '@/data/hooks'
import { CaseRow, listBox } from '@/components/cases/CaseRow'
import { BarList, TrendChart, TrendLegend } from '@/components/charts'
import { ChartCard, EmptyState, ErrorState, ListSkeleton, PageHeader, Section, Skeleton, StatCard } from '@/components/ui'

const TRIAGE = ['pending', 'submitted', 'triaging']

export default function SupervisorDashboard() {
  const me = useMe()
  const ov = useOverview()
  const cases = useStaffCases()
  const triage = (cases.data ?? []).filter((c) => TRIAGE.includes(c.status)).sort((a, b) => (a.severity === 'urgent' ? -1 : 0) - (b.severity === 'urgent' ? -1 : 0) || b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-8">
      <PageHeader title="Tổng quan quản sinh" description={`Xin chào ${me.fullName}. Đây là tình hình tiếp nhận và xử lý hiện tại.`} />

      {ov.isError ? <ErrorState error={ov.error} onRetry={() => void ov.refetch()} /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ov.isLoading || !ov.data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
            <>
              <StatCard label="Đang xử lý" value={ov.data.totals.active} icon={<Activity className="size-5" />} />
              <StatCard label="Cần phân loại" value={triage.length} tone="warn" icon={<Inbox className="size-5" />} hint="Chưa có người phụ trách" />
              <StatCard label="Khẩn cấp" value={ov.data.totals.urgent} tone="danger" icon={<Siren className="size-5" />} />
              <StatCard label="Phản hồi trung bình" value={`${ov.data.totals.avgResponseHours}h`} tone="teal" icon={<Timer className="size-5" />} hint="Từ lúc gửi đến lúc có người nhận" />
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ChartCard title="Số ca theo tuần" description="8 tuần gần nhất (tuần này chưa kết thúc)" action={<TrendLegend />}>
          {ov.data ? <TrendChart data={ov.data.trend} /> : <Skeleton className="h-full" />}
        </ChartCard>
        <ChartCard title="Sự việc theo loại" description="Tất cả báo cáo đã nhận" height="auto">{ov.data ? <BarList rows={ov.data.byType} tone="teal" /> : <Skeleton className="h-40" />}</ChartCard>
      </div>

      <Section title="Cần phân loại và phân công" action={<Link to="/supervisor/incidents" className="text-caption font-medium text-brand-ink hover:underline">Mở danh sách</Link>}>
        {cases.isLoading ? <div className={listBox}><ListSkeleton rows={3} /></div> : cases.isError ? <ErrorState error={cases.error} onRetry={() => void cases.refetch()} /> : triage.length === 0 ? (
          <div className="rounded-box border border-dashed border-line-strong"><EmptyState icon={<Inbox className="size-7" />} title="Không còn ca nào chờ phân loại." description="Các ca mới sẽ hiện ở đây ngay khi học sinh gửi." /></div>
        ) : (
          <div className={listBox}>{triage.slice(0, 6).map((c) => <CaseRow key={c.id} item={c} portal="supervisor" showAssignee />)}</div>
        )}
      </Section>
    </div>
  )
}
