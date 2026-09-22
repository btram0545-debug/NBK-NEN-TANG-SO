import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, KeyRound, LogOut, Mail, Phone, School, Settings } from 'lucide-react'
import { useAuth, useMe } from '@/auth/AuthProvider'
import { api } from '@/data'
import { isDemoMode } from '@/lib/env'
import { ROLE_LABEL } from '@/lib/labels'
import { useTheme } from '@/lib/theme'
import { Alert, Avatar, Badge, Button, Card, Dialog, Input, PageHeader, Switch, useToast } from '@/components/ui'

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-ink-3" aria-hidden>{icon}</span>
      <div className="min-w-0"><p className="text-caption text-ink-3">{label}</p><p className="truncate text-body text-ink">{children}</p></div>
    </div>
  )
}

export default function Profile() {
  const me = useMe()
  const { signOut, setUser } = useAuth()
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(me.fullName)
  const [phone, setPhone] = useState(me.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  async function saveProfile() {
    if (name.trim().length < 2) return toast.error('Họ tên chưa hợp lệ.')
    setSaving(true)
    try {
      setUser(await api.updateProfile({ fullName: name.trim(), phone: phone.trim() }))
      toast.success('Đã lưu thông tin.')
      setEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chưa lưu được.')
    } finally {
      setSaving(false)
    }
  }

  async function changePw() {
    if (pw.length < 8) return setPwErr('Mật khẩu cần ít nhất 8 ký tự.')
    if (pw !== pw2) return setPwErr('Hai mật khẩu chưa khớp.')
    setPwErr('')
    setPwBusy(true)
    try {
      await api.changePassword(pw)
      toast.success('Đã đổi mật khẩu.')
      setPwOpen(false)
      setPw('')
      setPw2('')
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : 'Chưa đổi được mật khẩu.')
    } finally {
      setPwBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader title="Hồ sơ của tôi" />
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={me.fullName} size="xl" />
          <div className="min-w-0">
            <h2 className="truncate text-h2 font-semibold text-ink">{me.fullName}</h2>
            <div className="mt-1.5 flex flex-wrap gap-2"><Badge tone="brand">{ROLE_LABEL[me.role]}</Badge>{me.className && <Badge>Lớp {me.className}</Badge>}</div>
          </div>
        </div>
        {editing ? (
          <div className="mt-6 space-y-4 border-t border-line pt-6">
            <Input label="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Số điện thoại" optional inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <div className="flex gap-2"><Button loading={saving} onClick={() => void saveProfile()}>Lưu</Button><Button variant="ghost" onClick={() => setEditing(false)}>Hủy</Button></div>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line border-t border-line">
            <Row icon={<Mail className="size-5" />} label="Email">{me.email}</Row>
            {me.studentCode && <Row icon={<School className="size-5" />} label="Mã học sinh">{me.studentCode}</Row>}
            {me.department && <Row icon={<Building2 className="size-5" />} label="Đơn vị">{me.department}</Row>}
            <Row icon={<Phone className="size-5" />} label="Điện thoại">{me.phone || <span className="text-ink-3">Chưa cập nhật</span>}</Row>
            <div className="pt-4"><Button variant="secondary" size="sm" onClick={() => { setName(me.fullName); setPhone(me.phone ?? ''); setEditing(true) }}>Chỉnh sửa thông tin</Button></div>
          </div>
        )}
      </Card>

      <section className="space-y-2">
        <h2 className="text-h3 font-semibold text-ink">Cài đặt</h2>
        <Card className="divide-y divide-line px-5">
          <Switch checked={theme === 'dark'} onCheckedChange={toggle} label="Giao diện tối" description="Dịu mắt hơn khi dùng buổi tối." />
          <div className="flex items-center justify-between gap-4 py-3">
            <div><p className="text-body font-medium text-ink">Mật khẩu</p><p className="text-caption text-ink-3">Nên đổi định kỳ và không dùng chung.</p></div>
            <Button variant="secondary" size="sm" icon={<KeyRound className="size-4" />} onClick={() => setPwOpen(true)}>Đổi</Button>
          </div>
          {me.role === 'admin' && (
            <Link to="/admin/settings" className="flex items-center gap-3 py-3 text-body font-medium text-ink"><Settings className="size-5 text-ink-3" aria-hidden />Cấu hình hệ thống</Link>
          )}
        </Card>
      </section>

      {isDemoMode && <Alert kind="warning">Bản demo: thay đổi ở đây chỉ lưu trong phiên hiện tại.</Alert>}

      <Button variant="secondary" className="w-full sm:w-auto" icon={<LogOut className="size-4" />} onClick={() => void signOut()}>
        Đăng xuất
      </Button>

      <Dialog open={pwOpen} onOpenChange={setPwOpen} title="Đổi mật khẩu" footer={<><Button variant="secondary" onClick={() => setPwOpen(false)}>Để sau</Button><Button loading={pwBusy} onClick={() => void changePw()}>Đổi mật khẩu</Button></>}>
        <div className="space-y-4 pb-2">
          <Input label="Mật khẩu mới" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="Ít nhất 8 ký tự." />
          <Input label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={pwErr} />
        </div>
      </Dialog>
    </div>
  )
}
