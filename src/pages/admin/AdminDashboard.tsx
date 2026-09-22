import { Link } from 'react-router-dom'
import { Activity, BadgeAlert, CheckCircle2, ChevronRight, RefreshCw, Siren, Timer } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useOverview } from '@/data/hooks'
import { formatTime, relativeTime } from '@/lib/format'
import { caseHref } from '@/lib/routes'
import { BarList, DonutChart, TrendChart, TrendLegend } from '@/components/charts'
import { CaseIcon } from '@/components/cases/CaseRow'
import { Badge, Button, Card, ChartCard, EmptyState, ErrorState, PageHeader, SeverityBadge, Skeleton, StatCard, StatusBadge } from '@/components/ui'

export default function AdminDashboard() {
  const me = useMe()
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useOverview()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trung tâm điều hành"
        description={`Xin chào ${me.fullName}. Bức tranh tổng quan về hỗ trợ và an toàn học đường.`}
        action={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && <span className="hidden text-caption text-ink-3 sm:inline">Cập nhật {formatTime(new Date(dataUpdatedAt).toISOString())}</span>}
            <Button variant="secondary" size="sm" loading={isFetching} icon={<RefreshCw className="size-4" />} onClick={() => void refetch()}>Làm mới</Button>
          </div>
        }
      />

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {isLoading || !data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
              <>
                <StatCard label="Tổng số ca" value={data.totals.counseling + data.totals.incidents} hint={`${data.totals.counseling} tư vấn · ${data.totals.incidents} sự việc`} icon={<Activity className="size-5" />} />
                <StatCard label="Đang xử lý" value={data.totals.active} tone="teal" icon={<CheckCircle2 className="size-5" />} />
                <StatCard label="Khẩn cấp" value={data.totals.urgent} tone={data.totals.urgent ? 'danger' : 'ok'} icon={<Siren className="size-5" />} hint={data.totals.urgent ? 'Cần theo dõi sát' : 'Hiện không có ca khẩn cấp'} />
                <StatCard label="Phản hồi trung bình" value={`${data.totals.avgResponseHours}h`} tone="warn" icon={<Timer className="size-5" />} hint="Từ lúc gửi đến lúc có người nhận" />
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Card className="flex flex-col overflow-hidden border-warn-ink/25">
              <div className="flex items-center gap-3 border-b border-line bg-warn-soft px-5 py-4">
                <BadgeAlert className="size-5 text-warn-ink" aria-hidden />
                <div><h2 className="text-h3 font-semibold text-warn-ink">Cần chú ý</h2><p className="text-caption text-warn-ink/80">Ca khẩn cấp hoặc đã chuyển Ban giám hiệu</p></div>
              </div>
              {isLoading || !data ? (
                <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
              ) : data.attention.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="size-7" />} title="Hiện chưa có ca nào cần chú ý." description="Khi có ca khẩn cấp, ca sẽ hiện ở đây." />
              ) : (
                <ul className="divide-y divide-line">
                  {data.attention.map((c) => (
                    <li key={c.id}>
                      <Link to={caseHref('admin', c.kind, c.id)} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/60">
                        <CaseIcon kind={c.kind} severity={c.severity} className="size-9" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">{c.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-3"><span className="font-mono">{c.code}</span><span>{relativeTime(c.createdAt)}</span></p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5"><SeverityBadge severity={c.severity} /><StatusBadge status={c.status} />{c.escalated && !c.approved && <Badge tone="danger" dot>Chờ phê duyệt</Badge>}{c.approved && <Badge tone="ok">Đã phê duyệt</Badge>}</div>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <ChartCard title="Xu hướng theo tuần" description="Số ca mới theo tuần (tuần này chưa kết thúc)" height={300} action={<TrendLegend />}>
              {data ? <TrendChart data={data.trend} /> : <Skeleton className="h-full" />}
            </ChartCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Trạng thái xử lý" height={230}>{data ? <DonutChart rows={data.byStatus} /> : <Skeleton className="h-full" />}</ChartCard>
            <ChartCard title="Sự việc theo loại" height="auto">{data ? <BarList rows={data.byType} tone="teal" /> : <Skeleton className="h-40" />}</ChartCard>
            <ChartCard title="Chủ đề tư vấn" height="auto">{data ? <BarList rows={data.byCounseling} /> : <Skeleton className="h-40" />}</ChartCard>
            <ChartCard title="Số ca theo khối" height="auto">{data ? <BarList rows={data.byGrade} /> : <Skeleton className="h-40" />}</ChartCard>
          </div>
          <p className="text-caption text-ink-3">Số liệu tổng hợp không kèm họ tên hay nội dung chia sẻ của học sinh.</p>
        </>
      )}
    </div>
  )
}
