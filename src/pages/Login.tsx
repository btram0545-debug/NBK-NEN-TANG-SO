import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, HeartHandshake, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { homeOf, portalOf } from '@/auth/portal'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/mockApi'
import { env, showDemoAccounts } from '@/lib/env'
import { ROLE_LABEL } from '@/lib/labels'
import { Alert, Button, Checkbox, Dialog, Input, Logo, LogoMark } from '@/components/ui'

const REMEMBER_KEY = 'sc-remember-id'
const readRemembered = () => {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

function BrandArt() {
  return (
    <svg viewBox="0 0 520 520" className="pointer-events-none absolute -bottom-24 -right-24 w-[38rem] max-w-none opacity-90" aria-hidden fill="none">
      <circle cx="300" cy="300" r="250" stroke="white" strokeOpacity=".10" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="190" stroke="white" strokeOpacity=".14" strokeWidth="1.5" />
      <circle cx="300" cy="300" r="130" fill="white" fillOpacity=".06" />
      <path d="M215 250h170a34 34 0 0 1 34 34v62a34 34 0 0 1-34 34h-92l-54 46v-46h-24a34 34 0 0 1-34-34v-62a34 34 0 0 1 34-34Z" fill="white" fillOpacity=".14" />
      <path d="M180 330h96a26 26 0 0 1 26 26v40a26 26 0 0 1-26 26h-50l-40 34v-34a26 26 0 0 1-26-26v-40a26 26 0 0 1 26-26Z" fill="#2bb5a5" fillOpacity=".55" transform="translate(120 -110)" />
    </svg>
  )
}

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [identifier, setIdentifier] = useState(readRemembered)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(() => readRemembered() !== '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState<{ id?: string; pw?: string }>({})
  const [forgot, setForgot] = useState(false)

  if (user) return <Navigate to={homeOf(user.role)} replace />

  async function doSignIn(id: string, pw: string) {
    setBusy(true)
    setError('')
    try {
      const u = await signIn(id.trim(), pw)
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, id.trim())
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {
        /* bỏ qua */
      }
      const from = (loc.state as { from?: string } | null)?.from
      navigate(from && from.startsWith(`/${portalOf(u.role)}`) ? from : homeOf(u.role), { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa đăng nhập được. Bạn thử lại nhé.')
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const err = { id: identifier.trim() ? undefined : 'Bạn nhập email hoặc mã tài khoản nhé.', pw: password ? undefined : 'Bạn nhập mật khẩu nhé.' }
    setFieldErr(err)
    if (err.id || err.pw) return
    void doSignIn(identifier, password)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Bên trái: thương hiệu (chỉ desktop) */}
      <aside className="relative hidden overflow-hidden bg-[#1f4cbd] text-white lg:flex lg:flex-col lg:justify-between lg:p-14 dark:bg-[#14295a]">
        <BrandArt />
        <div className="relative flex items-center gap-3">
          <LogoMark className="size-10 drop-shadow" />
          <span className="text-[0.9375rem] font-medium text-white/90">{env.schoolName}</span>
        </div>
        <div className="relative max-w-xl">
          <h1 className="text-display font-semibold">Nền tảng tư vấn học đường</h1>
          <p className="mt-4 text-[1.125rem] leading-relaxed text-white/85">Nơi học sinh được lắng nghe, hỗ trợ và đồng hành.</p>
          <ul className="mt-10 space-y-4 text-body text-white/90">
            <li className="flex items-center gap-3"><HeartHandshake className="size-5 text-[#7fe0d3]" aria-hidden />Có người lắng nghe, không phán xét</li>
            <li className="flex items-center gap-3"><Lock className="size-5 text-[#7fe0d3]" aria-hidden />Nội dung riêng tư chỉ người được phân công mới xem</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#7fe0d3]" aria-hidden />Có thể gửi báo cáo ẩn danh khi cần</li>
          </ul>
        </div>
        <p className="relative text-caption text-white/60">Hệ thống dành cho học sinh, giáo viên và cán bộ nhà trường</p>
      </aside>

      {/* Bên phải: đăng nhập */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="mb-8 lg:hidden">
            <Logo />
            <p className="mt-5 text-body text-ink-2">Nơi học sinh được lắng nghe, hỗ trợ và đồng hành.</p>
          </div>

          <h2 className="text-h1 font-semibold text-ink">Đăng nhập</h2>
          <p className="mt-1 text-body text-ink-2">Dùng tài khoản do nhà trường cấp cho bạn.</p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            {error && <Alert kind="danger">{error}</Alert>}
            <Input
              label="Email hoặc mã tài khoản"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={fieldErr.id}
              placeholder="vd. hs2026001"
            />
            <div className="relative">
              <Input
                label="Mật khẩu"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErr.pw}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={show}
                className="absolute right-1 top-[1.75rem] inline-flex size-10 items-center justify-center rounded-ctl text-ink-3 hover:text-ink"
              >
                {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Checkbox checked={remember} onChange={setRemember} label="Ghi nhớ tài khoản" />
              <button type="button" onClick={() => setForgot(true)} className="text-caption font-medium text-brand-ink hover:underline">
                Quên mật khẩu?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Đăng nhập
            </Button>
          </form>

          <p className="mt-5 flex items-start gap-2 text-caption text-ink-3">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Kết nối được mã hóa. Không chia sẻ mật khẩu cho bất kỳ ai, kể cả giáo viên.
          </p>

          {showDemoAccounts && (
            <div className="mt-8 rounded-box bg-surface-2 p-4">
              <p className="text-caption font-semibold text-ink">Dùng thử bằng tài khoản mẫu</p>
              <p className="mt-0.5 text-caption text-ink-3">Mật khẩu chung: <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink">{DEMO_PASSWORD}</code></p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.code}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setIdentifier(a.code)
                      setPassword(DEMO_PASSWORD)
                      void doSignIn(a.code, DEMO_PASSWORD)
                    }}
                    className="rounded-ctl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand disabled:opacity-60"
                  >
                    <span className="block text-caption font-semibold text-ink">{ROLE_LABEL[a.role]}</span>
                    <span className="block truncate text-[0.6875rem] text-ink-3">{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={forgot}
        onOpenChange={setForgot}
        title="Quên mật khẩu?"
        description="Vì tài khoản do nhà trường cấp, bạn hãy nhờ giáo viên chủ nhiệm hoặc văn phòng nhà trường đặt lại mật khẩu giúp bạn."
        footer={<Button onClick={() => setForgot(false)}>Đã hiểu</Button>}
      />
    </div>
  )
}
