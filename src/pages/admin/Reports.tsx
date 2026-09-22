import { Download, Printer } from 'lucide-react'
import { useOverview } from '@/data/hooks'
import { BarList, DonutChart, TrendChart, TrendLegend } from '@/components/charts'
import { Button, ChartCard, ErrorState, PageHeader, Skeleton, StatCard } from '@/components/ui'
import type { AdminOverview } from '@/types'

function exportCsv(d: AdminOverview) {
  const lines = [['Nhóm', 'Chỉ số', 'Số lượng']]
  const add = (group: string, rows: { label: string; value: number }[]) => rows.forEach((r) => lines.push([group, r.label, String(r.value)]))
  add('Theo tuần - Tư vấn', d.trend.map((t) => ({ label: t.label, value: t.counseling })))
  add('Theo tuần - Sự việc', d.trend.map((t) => ({ label: t.label, value: t.incidents })))
  add('Loại sự việc', d.byType)
  add('Chủ đề tư vấn', d.byCounseling)
  add('Trạng thái', d.byStatus)
  add('Khối lớp', d.byGrade)
  const csv = '\uFEFF' + lines.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `bao-cao-tong-hop-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const { data, isLoading, isError, error, refetch } = useOverview()
  return (
    <div className="space-y-8">
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Số liệu thống kê không kèm thông tin định danh học sinh."
        action={<div className="no-print flex gap-2"><Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => window.print()}>In</Button><Button variant="secondary" icon={<Download className="size-4" />} disabled={!data} onClick={() => data && exportCsv(data)}>Xuất CSV</Button></div>}
      />
      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {isLoading || !data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (
              <>
                <StatCard label="Yêu cầu tư vấn" value={data.totals.counseling} />
                <StatCard label="Báo cáo sự việc" value={data.totals.incidents} tone="teal" />
                <StatCard label="Đang xử lý" value={data.totals.active} tone="warn" />
                <StatCard label="Phản hồi trung bình" value={`${data.totals.avgResponseHours}h`} tone="ok" />
              </>
            )}
          </div>
          <ChartCard title="Xu hướng theo tuần" height={300} action={<TrendLegend />}>{data ? <TrendChart data={data.trend} /> : <Skeleton className="h-full" />}</ChartCard>
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Sự việc theo loại" height="auto">{data ? <BarList rows={data.byType} tone="teal" /> : <Skeleton className="h-40" />}</ChartCard>
            <ChartCard title="Chủ đề tư vấn" height="auto">{data ? <BarList rows={data.byCounseling} /> : <Skeleton className="h-40" />}</ChartCard>
            <ChartCard title="Trạng thái xử lý" height={260}>{data ? <DonutChart rows={data.byStatus} /> : <Skeleton className="h-full" />}</ChartCard>
            <ChartCard title="Số ca theo khối" height="auto">{data ? <BarList rows={data.byGrade} /> : <Skeleton className="h-40" />}</ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
