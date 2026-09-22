import { Check, Minus } from 'lucide-react'
import { env, isDemoMode } from '@/lib/env'
import { Alert, Card, PageHeader } from '@/components/ui'

const MATRIX: { label: string; cells: (string | boolean)[] }[] = [
  { label: 'Xem trường hợp', cells: ['Của mình', 'Được giao', 'Được giao', 'Tất cả*', 'Tất cả*'] },
  { label: 'Cập nhật trạng thái', cells: [false, 'Ca được giao', 'Ca được giao', true, true] },
  { label: 'Phân công, đổi mức độ', cells: [false, false, false, true, true] },
  { label: 'Chuyển Ban giám hiệu', cells: [false, false, false, true, false] },
  { label: 'Phê duyệt can thiệp', cells: [false, false, false, false, true] },
  { label: 'Ghi chú riêng tư', cells: [false, false, 'Ca phụ trách', false, 'Khi được cấp quyền'] },
  { label: 'Số liệu tổng hợp', cells: [false, false, false, true, true] },
  { label: 'Người dùng và nhật ký', cells: [false, false, false, false, true] },
]
const HEAD = ['Học sinh', 'Giáo viên', 'Tư vấn viên', 'Quản sinh', 'Ban giám hiệu']

export default function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Cấu hình hệ thống" description="Thông tin cấu hình hiện tại và ma trận phân quyền." />
      {isDemoMode && <Alert kind="warning" title="Đang chạy bản demo">Chưa kết nối Supabase, nên dữ liệu chỉ là mẫu và không được lưu. Xem README để kết nối cơ sở dữ liệu thật.</Alert>}

      <Card className="divide-y divide-line">
        {[
          ['Tên trường', env.schoolName],
          ['Chế độ dữ liệu', isDemoMode ? 'Demo (dữ liệu mẫu, trong trình duyệt)' : 'Supabase (dữ liệu thật, có RLS)'],
          ['Trang đích của nút Thoát nhanh', env.quickExitUrl],
          ['Miền email tài khoản', `@${env.accountEmailDomain}`],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-ink-3">{k}</span><span className="break-all font-medium text-ink">{v}</span></div>
        ))}
      </Card>
      <p className="-mt-4 text-caption text-ink-3">Các giá trị này được đặt qua biến môi trường khi build (xem <code className="rounded bg-surface-2 px-1">.env.example</code>), không sửa được tại đây.</p>

      <section className="space-y-3">
        <div><h2 className="text-h2 font-semibold text-ink">Ma trận phân quyền</h2><p className="text-caption text-ink-3">Được kiểm tra ở cơ sở dữ liệu (RLS), giao diện chỉ ẩn hoặc hiện theo đó.</p></div>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-body">
            <caption className="sr-only">Quyền theo vai trò</caption>
            <thead><tr className="border-b border-line bg-surface-2/60"><th scope="col" className="px-4 py-3 text-caption font-medium text-ink-3">Quyền</th>{HEAD.map((h) => <th key={h} scope="col" className="px-3 py-3 text-center text-caption font-medium text-ink-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {MATRIX.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-4 py-3 text-left font-medium text-ink">{r.label}</th>
                  {r.cells.map((c, i) => (
                    <td key={i} className="px-3 py-3 text-center text-caption text-ink-2">
                      {c === true ? <Check className="mx-auto size-4 text-ok-ink" aria-label="Có" /> : c === false ? <Minus className="mx-auto size-4 text-ink-3" aria-label="Không" /> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-caption text-ink-3">* Trừ nội dung ở mức riêng tư cao và danh tính của người gửi ẩn danh.</p>
      </section>
    </div>
  )
}
