import { useState } from 'react'
import { Plus, MessageCircleHeart, ShieldAlert } from 'lucide-react'
import { useMyCases } from '@/data/hooks'
import type { CaseKind } from '@/types'
import { CaseRow, listBox } from '@/components/cases/CaseRow'
import { EmptyState, ErrorState, FilterPills, LinkButton, ListSkeleton, PageHeader } from '@/components/ui'
import { isActiveStatus } from '@/lib/labels'

const COPY = {
  counseling: {
    title: 'Tư vấn học đường',
    description: 'Bạn không cần phải giải quyết mọi chuyện một mình.',
    cta: 'Đăng ký tư vấn',
    to: '/student/counseling/new',
    empty: 'Bạn chưa có yêu cầu tư vấn nào.',
    emptyText: 'Khi bạn muốn chia sẻ về học tập, bạn bè, gia đình hay cảm xúc, tư vấn viên luôn sẵn sàng lắng nghe.',
    icon: MessageCircleHeart,
  },
  incident: {
    title: 'Báo cáo sự việc',
    description: 'Nếu có điều khiến bạn hoặc người khác không an toàn, hãy cho nhà trường biết.',
    cta: 'Gửi báo cáo',
    to: '/student/incidents/new',
    empty: 'Bạn chưa gửi báo cáo nào.',
    emptyText: 'Nếu bạn thấy hoặc gặp chuyện không an toàn, bạn có thể báo cho nhà trường, kể cả ẩn danh.',
    icon: ShieldAlert,
  },
} as const

export default function CaseList({ kind }: { kind: CaseKind }) {
  const c = COPY[kind]
  const { data, isLoading, isError, error, refetch } = useMyCases()
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const all = (data ?? []).filter((x) => x.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const rows = all.filter((x) => (filter === 'all' ? true : filter === 'active' ? isActiveStatus(x.status) : !isActiveStatus(x.status)))

  return (
    <div className="space-y-6">
      <PageHeader title={c.title} description={c.description} action={<LinkButton to={c.to} icon={<Plus className="size-4" />}>{c.cta}</LinkButton>} />

      {isLoading ? (
        <div className={listBox}><ListSkeleton /></div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : all.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong">
          <EmptyState icon={<c.icon className="size-7" />} title={c.empty} description={c.emptyText} action={<LinkButton to={c.to}>{c.cta}</LinkButton>} />
        </div>
      ) : (
        <>
          <FilterPills
            label="Lọc theo trạng thái"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Tất cả', count: all.length },
              { value: 'active', label: 'Đang xử lý', count: all.filter((x) => isActiveStatus(x.status)).length },
              { value: 'done', label: 'Đã xong', count: all.filter((x) => !isActiveStatus(x.status)).length },
            ]}
          />
          {rows.length === 0 ? (
            <p className="py-10 text-center text-body text-ink-3">Không có yêu cầu nào trong mục này.</p>
          ) : (
            <div className={listBox}>{rows.map((r) => <CaseRow key={r.id} item={r} portal="student" />)}</div>
          )}
        </>
      )}
    </div>
  )
}
