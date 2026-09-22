import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Kind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: Kind
  message: string
}
interface Ctx {
  success: (m: string) => void
  error: (m: string) => void
  info: (m: string) => void
}
const ToastContext = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const seq = useRef(0)
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), [])
  const push = useCallback(
    (kind: Kind, message: string) => {
      const id = ++seq.current
      setItems((l) => [...l.slice(-2), { id, kind, message }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
    },
    [dismiss],
  )
  const api = useMemo<Ctx>(() => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-box bg-ink px-4 py-3 text-body text-bg shadow-pop animate-toast-in',
            )}
          >
            <span className="mt-0.5 shrink-0" aria-hidden>
              {t.kind === 'success' ? <CheckCircle2 className="size-5 text-[#7fd8a4]" /> : t.kind === 'error' ? <XCircle className="size-5 text-[#ff9b9b]" /> : <Info className="size-5 text-[#9db9ff]" />}
            </span>
            <p className="flex-1">{t.message}</p>
            <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)} className="-mr-1 inline-flex size-6 items-center justify-center rounded-md opacity-70 hover:opacity-100">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const c = useContext(ToastContext)
  if (!c) throw new Error('useToast phải nằm trong ToastProvider')
  return c
}
