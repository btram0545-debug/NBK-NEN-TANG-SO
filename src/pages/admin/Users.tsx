import { useMemo, useState } from 'react'
import { Search, Users as UsersIcon } from 'lucide-react'
import { useMe } from '@/auth/AuthProvider'
import { useUpdateUser, useUsers } from '@/data/hooks'
import { ROLE_LABEL } from '@/lib/labels'
import type { Role, UserRow } from '@/types'
import { Avatar, Badge, ConfirmDialog, DataTable, EmptyState, ErrorState, FilterPills, ListSkeleton, PageHeader, Switch, useToast, type Column } from '@/components/ui'

const ROLES = Object.keys(ROLE_LABEL) as Role[]

export default function Users() {
  const me = useMe()
  const toast = useToast()
  const { data, isLoading, isError, error, refetch } = useUsers()
  const update = useUpdateUser()
  const [role, setRole] = useState<'all' | Role>('all')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState<UserRow | null>(null)

  const rows = useMemo(() => (data ?? []).filter((u) => (role === 'all' || u.role === role) && (!q.trim() || `${u.fullName} ${u.email} ${u.className ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, role, q])

  const act = (u: UserRow, patch: { role?: Role; isActive?: boolean }, ok: string, done?: () => void) =>
    update.mutate({ id: u.id, patch }, { onSuccess: () => { toast.success(ok); done?.() }, onError: (e) => toast.error(e instanceof Error ? e.message : 'Chưa cập nhật được.') })

  const columns: Column<UserRow>[] = [
    { key: 'name', header: 'Người dùng', cell: (u) => <div className="flex items-center gap-3"><Avatar name={u.fullName} /><div className="min-w-0"><p className="truncate font-medium text-ink">{u.fullName}{u.id === me.id && <span className="ml-2 text-caption font-normal text-ink-3">(bạn)</span>}</p><p className="truncate text-caption text-ink-3">{u.email}</p></div></div> },
    { key: 'class', header: 'Lớp', cell: (u) => u.className ?? <span className="text-ink-3">—</span> },
    {
      key: 'role',
      header: 'Vai trò',
      cell: (u) => (
        <select aria-label={`Vai trò của ${u.fullName}`} value={u.role} disabled={u.id === me.id || update.isPending} onChange={(e) => act(u, { role: e.target.value as Role }, 'Đã đổi vai trò.')} className="h-9 rounded-ctl border border-line-strong bg-surface px-2.5 text-body text-ink disabled:bg-surface-2 disabled:text-ink-3">
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      ),
    },
    { key: 'st', header: 'Trạng thái', cell: (u) => <Badge tone={u.isActive ? 'ok' : 'neutral'} dot>{u.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</Badge> },
    { key: 'act', header: 'Hoạt động', className: 'text-right', cell: (u) => <div className="flex justify-end"><Switch bare checked={u.isActive} disabled={u.id === me.id || update.isPending} label={`${u.isActive ? "Vô hiệu hóa" : "Kích hoạt"} ${u.fullName}`} onCheckedChange={(v) => (v ? act(u, { isActive: true }, 'Đã kích hoạt tài khoản.') : setTarget(u))} /></div> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Người dùng" description="Quản lý vai trò và trạng thái tài khoản. Mọi thay đổi đều được ghi vào nhật ký." />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterPills label="Lọc theo vai trò" value={role} onChange={setRole} options={[{ value: 'all', label: 'Tất cả', count: data?.length }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r], count: data?.filter((u) => u.role === r).length }))]} />
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input type="search" aria-label="Tìm người dùng" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, email…" className="h-10 w-full rounded-ctl border border-line-strong bg-surface pl-9 pr-3 text-body text-ink focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30" />
        </div>
      </div>
      {isLoading ? <div className="overflow-hidden rounded-box border border-line bg-surface"><ListSkeleton rows={6} /></div> : isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : rows.length === 0 ? (
        <div className="rounded-box border border-dashed border-line-strong"><EmptyState icon={<UsersIcon className="size-7" />} title="Không tìm thấy người dùng nào." description="Thử đổi bộ lọc hoặc từ khóa." /></div>
      ) : (
        <DataTable
          caption="Danh sách người dùng"
          columns={columns}
          rows={rows}
          rowKey={(u) => u.id}
          mobileCard={(u) => (
            <div className="space-y-3">
              <div className="flex items-center gap-3"><Avatar name={u.fullName} /><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{u.fullName}</p><p className="truncate text-caption text-ink-3">{u.email}</p></div><Badge tone={u.isActive ? 'ok' : 'neutral'} dot>{u.isActive ? 'Hoạt động' : 'Vô hiệu'}</Badge></div>
              <div className="flex items-center gap-3">
                <select aria-label={`Vai trò của ${u.fullName}`} value={u.role} disabled={u.id === me.id} onChange={(e) => act(u, { role: e.target.value as Role }, 'Đã đổi vai trò.')} className="h-10 flex-1 rounded-ctl border border-line-strong bg-surface px-2.5 text-body text-ink disabled:bg-surface-2">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <Switch bare checked={u.isActive} disabled={u.id === me.id} label={`${u.isActive ? "Vô hiệu hóa" : "Kích hoạt"} ${u.fullName}`} onCheckedChange={(v) => (v ? act(u, { isActive: true }, 'Đã kích hoạt tài khoản.') : setTarget(u))} />
              </div>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
        title="Vô hiệu hóa tài khoản?"
        description={target ? `${target.fullName} sẽ không thể đăng nhập hoặc gửi nội dung mới cho đến khi được kích hoạt lại.` : undefined}
        confirmLabel="Vô hiệu hóa"
        danger
        loading={update.isPending}
        onConfirm={() => target && act(target, { isActive: false }, 'Đã vô hiệu hóa tài khoản.', () => setTarget(null))}
      />
    </div>
  )
}
