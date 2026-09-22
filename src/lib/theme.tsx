import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'
const KEY = 'sc-theme'
const Ctx = createContext<{ theme: Theme; toggle: () => void } | null>(null)

const read = (): Theme => {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' // mặc định: sáng
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(read)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* bỏ qua: trình duyệt chặn lưu trữ */
    }
  }, [theme])
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTheme phải nằm trong ThemeProvider')
  return c
}
