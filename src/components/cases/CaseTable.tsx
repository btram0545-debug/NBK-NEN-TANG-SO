import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpCircle, ClipboardList, Eye, EyeOff, MoreHorizontal, Search, UserRoundPlus } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { portalOf } from '@/auth/portal'
import { useStaffMembers, useUpdateAnyCase } from '@/data/hooks'
import { formatDate, relativeTime } from '@/lib/format'
import { caseHref } from '@/lib/routes'
import { isActiveStatus } from '@/lib/labels'
import { categoryLabel } from '@/lib/labels'
import type { CaseItem, CaseStatus } from '@/types'
import { Avatar, ConfirmDialog, DataTable, Dialog, Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, EmptyState, FilterPills, IconButton, Button, SeverityBadge, Select, StatusBadge, useToast, type Column } from '@/components/ui'
import { CaseIcon } from './CaseRow'

type Scope = 'all' | 'active' | 'triage' | 'urgent' | 'done'
const TRIAGE: CaseStatus[] = ['pending', 'submitted', 'triaging']
const RANK = { urgent: 0, serious: 1, normal: 2 }

export function CaseTable({ cases }: { cases: CaseItem[] }) {
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const portal = portalOf(me.role)
  const power = me.role === 'supervisor' || me.role === 'admin'
  const update = useUpdateAnyCase()
  const staff = useStaffMembers()
  const [scope, setScope] = useState<Scope>('active')
  const [q, setQ] = useState('')
  const [assignFor, setAssignFor] = useState<CaseItem | null>(null)
  const [assignee, setAssignee] = useState('')
  const [escFor, setEscFor] = useState<CaseItem | null>(null)

  const counts = useMemo(
    () => ({
      all: cases.length,
      active: cases.filter((c) => isActiveStatus(c.status)).length,
      triage: cases.filter((c) => TRIAGE.includes(c.status)).length,
      urgent: cases.filter((c) => c.severity === 'urgent' && isActiveStatus(c.status)).length,
      done: cases.filter((c) => !isActiveStatus(c.status)).length,
    }),
    [cases],
  )

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return cases
      .filter((c) => (scope === 'all' ? true : scope === 'active' ? isActiveStatus(c.status) : scope === 'triage' ? TRIAGE.includes(c.status) : scope === 'urgent' ? c.severity === 'urgent' && isActiveStatus(c.status) : !isActiveStatus(c.status)))
      .filter((c) => !term || `${c.code} ${c.title} ${c.reporter?.name ?? ''} ${c.assignee?.name ?? ''}`.toLowerCase().includes(term))
      .sort((a, b) => (isActiveStatus(a.status) === isActiveStatus(b.status) ? RANK[a.severity] - RANK[b.severity] || b.updatedAt.localeCompare(a.updatedAt) : isActiveStatus(a.status) ? -1 : 1))
  }, [cases, scope, q])

  const open = (c: CaseItem) => navigate(caseHref(portal, c.kind, c.id))
  const run = (c: CaseItem, patch: Parameters<typeof update.mutate>[0]['patch'], ok: string, done?: () => void) =>
    update.mutate({ kind: c.kind, id: c.id, patch }, { onSuccess: () => { toast.success(ok); done?.() }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa thực hiện được.') })

  const columns: Column<CaseItem>[] = [
    {
      key: 'case',
      header: 'Trường hợp',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <CaseIcon kind={c.kind} severity={c.severity} className="size-9" />
          <div className="min-w-0"><p className="truncate font-medium text-ink">{c.title}</p><p className="font-mono text-caption text-ink-3">{c.code}</p></div>
        </div>
      ),
    },
    {
      key: 'who',
      header: 'Người gửi',
      cell: (c) => c.reporter ? (
        <span className="flex items-center gap-2"><Avatar name={c.reporter.name} size="sm" /><span className="truncate"><span className="block truncate text-body text-ink">{c.reporter.name}</span>{c.reporter.className && <span className="block text-caption text-ink-3">{c.reporter.className}</span>}</span></span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-caption text-ink-3"><EyeOff className="size-3.5" aria-hidden />{c.isAnonymous ? 'Ẩn danh' : 'Không hiển thị'}</span>
      ),
    },
    { key: 'sev', header: 'Mức độ', cell: (c) => <SeverityBadge severity={c.severity} /> },
    { key: 'status', header: 'Trạng thái', cell: (c) => <StatusBadge status={c.status} /> },
    ...(power ? [{ key: 'assignee', header: 'Phụ trách', cell: (c: CaseItem) => c.assignee ? <span className="text-body text-ink">{c.assignee.name}</span> : <span className="text-caption font-medium text-warn-ink">Chưa phân công</span> } as Column<CaseItem>] : []),
    { key: 'time', header: 'Cập nhật', className: 'hidden xl:table-cell', cell: (c) => <span className="whitespace-nowrap text-caption text-ink-3">{relativeTime(c.updatedAt)}</span> },
    {
      key: 'act',
      header: '',
      className: 'w-10 text-right',
      cell: (c) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown>
            <DropdownTrigger asChild><IconButton label={`Thao tác cho ${c.code}`} className="size-9"><MoreHorizontal className="size-5" aria-hidden /></IconButton></DropdownTrigger>
            <DropdownContent>
              <DropdownItem icon={<Eye className="size-4" />} onSelect={() => open(c)}>Xem chi tiết</DropdownItem>
              {power && (
                <>
                  <DropdownSeparator />
                  <DropdownLabel>Xử lý nhanh</DropdownLabel>
                  <DropdownItem icon={<UserRoundPlus className="size-4" />} onSelect={() => { setAssignee(c.assignee?.id ?? ''); setAssignFor(c) }}>{c.assignee ? 'Chuyển người phụ trách' : 'Phân công'}</DropdownItem>
                  {me.role === 'supervisor' && !c.escalated && isActiveStatus(c.status) && <DropdownItem danger icon={<ArrowUpCircle className="size-4" />} onSelect={() => setEscFor(c)}>Chuyển Ban giám hiệu</DropdownItem>}
                </>
              )}
            </DropdownContent>
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterPills
          label="Lọc trường hợp"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'active', label: 'Đang xử lý', count: counts.active },
            ...(power ? [{ value: 'triage' as Scope, label: 'Cần phân loại', count: counts.triage }] : []),
            { value: 'urgent', label: 'Khẩn cấp', count: counts.urgent },
            { value: 'done', label: 'Đã xong', count: counts.done },
            { value: 'all', label: 'Tất cả', count: counts.all },
          ]}
        />
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input type="search" aria-label="Tìm trường hợp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã, tên…" className="h-10 w-full rounded-ctl border border-line-strong bg-surface pl-9 pr-3 text-body text-ink focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30" />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong">
          <EmptyState icon={<ClipboardList className="size-7" />} title={cases.length === 0 ? 'Chưa có trường hợp nào.' : 'Không có trường hợp phù hợp.'} description={cases.length === 0 ? 'Khi có trường hợp được giao, bạn sẽ thấy ở đây.' : 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'} />
        </div>
      ) : (
        <DataTable
          caption="Danh sách trường hợp"
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          onRowClick={open}
          mobileCard={(c) => (
            <div className="flex items-start gap-3">
              <CaseIcon kind={c.kind} severity={c.severity} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><p className="font-medium text-ink">{c.title}</p><StatusBadge status={c.status} /></div>
                <p className="mt-0.5 text-caption text-ink-3"><span className="font-mono">{c.code}</span> · {c.reporter?.name ?? (c.isAnonymous ? 'Ẩn danh' : '—')} · {formatDate(c.createdAt)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">{c.severity !== 'normal' && <SeverityBadge severity={c.severity} />}{power && <span className="text-caption text-ink-2">{c.assignee ? c.assignee.name : 'Chưa phân công'}</span>}<span className="text-caption text-ink-3">{categoryLabel(c.kind, c.category)}</span></div>
              </div>
            </div>
          )}
        />
      )}

      <Dialog
        open={assignFor !== null}
        onOpenChange={(o) => !o && setAssignFor(null)}
        title="Phân công người phụ trách"
        description={assignFor ? `${assignFor.title} · ${assignFor.code}` : undefined}
        footer={<><Button variant="secondary" onClick={() => setAssignFor(null)}>Để sau</Button><Button disabled={!assignee} loading={update.isPending} onClick={() => assignFor && run(assignFor, { assigneeId: assignee }, 'Đã phân công.', () => setAssignFor(null))}>Phân công</Button></>}
      >
        <div className="pb-2">
          <Select label="Người phụ trách" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="" disabled>Chọn người…</option>
            {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role === 'counselor' ? 'Tư vấn viên' : 'Giáo viên'})</option>)}
          </Select>
        </div>
      </Dialog>
      <ConfirmDialog
        open={escFor !== null}
        onOpenChange={(o) => !o && setEscFor(null)}
        title="Chuyển ca lên Ban giám hiệu?"
        description={escFor ? `${escFor.title} · ${escFor.code}. Ban giám hiệu sẽ nhận thông báo ngay.` : undefined}
        confirmLabel="Chuyển lên"
        danger
        loading={update.isPending}
        onConfirm={() => escFor && run(escFor, { escalate: true }, 'Đã chuyển lên Ban giám hiệu.', () => setEscFor(null))}
      />
    </div>
  )
}
