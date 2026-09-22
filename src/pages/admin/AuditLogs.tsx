import { useMemo, useState } from 'react'
import { FileClock, Search } from 'lucide-react'
import { useAuditLogs } from '@/data/hooks'
import { formatDateTime } from '@/lib/format'
import type { AuditRow } from '@/types'
import { Alert, DataTable, EmptyState, ErrorState, ListSkeleton, PageHeader, type Column } from '@/components/ui'

export default function AuditLogs() {
  const { data, isLoading, isError, error, refetch } = useAuditLogs()
  const [q, setQ] = useState('')
  const rows = useMemo(() => (data ?? []).filter((r) => !q.trim() || `${r.action} ${r.actorName} ${r.entityType}`.toLowerCase().includes(q.trim().toLowerCase())), [data, q])
  const columns: Column<AuditRow>[] = [
    { key: 't', header: 'Thời gian', cell: (r) => <span className="whitespace-nowrap text-caption text-ink-2">{formatDateTime(r.createdAt)}</span> },
    { key: 'a', header: 'Hành động', cell: (r) => <span className="font-medium text-ink">{r.action}</span> },
    { key: 'w', header: 'Người thực hiện', cell: (r) => r.actorName },
    { key: 'e', header: 'Đối tượng', cell: (r) => <span className="text-caption text-ink-3">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ''}</span> },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Nhật ký hoạt động" description="Ghi lại các thao tác quan trọng: phân công, đổi trạng thái, phê duyệt, thay đổi quyền." />
      <Alert kind="privacy">Nhật ký chỉ ghi ai làm gì và khi nào. Nội dung chia sẻ và ghi chú riêng tư không nằm trong nhật ký.</Alert>
      <div className="relative md:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <input type="search" aria-label="Tìm trong nhật ký" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm hành động, người thực hiện…" className="h-10 w-full rounded-ctl border border-line-strong bg-surface pl-9 pr-3 text-body text-ink focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30" />
      </div>
      {isLoading ? <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton rows={6} /></div> : isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : rows.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong"><EmptyState icon={<FileClock className="size-7" />} title="Chưa có bản ghi nào." /></div>
      ) : (
        <DataTable caption="Nhật ký hoạt động" columns={columns} rows={rows} rowKey={(r) => r.id} mobileCard={(r) => (<div><p className="font-medium text-ink">{r.action}</p><p className="mt-0.5 text-caption text-ink-3">{r.actorName} · {formatDateTime(r.createdAt)}</p></div>)} />
      )}
    </div>
  )
}
