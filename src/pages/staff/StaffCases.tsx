import type { CaseKind } from '@/types'
import { useStaffCases } from '@/data/hooks'
import { CaseTable } from '@/components/cases/CaseTable'
import { ErrorState, ListSkeleton, PageHeader } from '@/components/ui'

const COPY = {
  all: { title: 'Trường hợp được giao', description: 'Các yêu cầu tư vấn và báo cáo sự việc bạn đang phụ trách.' },
  incident: { title: 'Báo cáo sự việc', description: 'Tiếp nhận, phân loại và phân công xử lý các báo cáo.' },
  counseling: { title: 'Yêu cầu tư vấn', description: 'Theo dõi các yêu cầu tư vấn học đường.' },
}

export default function StaffCases({ kind }: { kind?: CaseKind }) {
  const { data, isLoading, isError, error, refetch } = useStaffCases()
  const c = COPY[kind ?? 'all']
  const rows = (data ?? []).filter((x) => !kind || x.kind === kind)
  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description={c.description} />
      {isLoading ? <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton rows={5} /></div> : isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : <CaseTable cases={rows} />}
    </div>
  )
}
