import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/data'
import type { AuthUser } from '@/types'

interface AuthState {
  user: AuthUser | null
  /** true khi đang khôi phục phiên đăng nhập lần đầu. */
  loading: boolean
  signIn: (identifier: string, password: string) => Promise<AuthUser>
  signOut: () => Promise<void>
  setUser: (u: AuthUser) => void
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const qc = useQueryClient()

  useEffect(() => {
    let alive = true
    api
      .restoreSession()
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const u = await api.signIn(identifier, password)
      qc.clear() // không để dữ liệu của người trước lẫn sang người sau
      setUser(u)
      return u
    },
    [qc],
  )

  const signOut = useCallback(async () => {
    await api.signOut().catch(() => undefined)
    qc.clear()
    setUser(null)
  }, [qc])

  const value = useMemo(() => ({ user, loading, signIn, signOut, setUser }), [user, loading, signIn, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth phải nằm trong AuthProvider')
  return c
}

/** Người dùng đã đăng nhập (chỉ dùng bên trong route đã được bảo vệ). */
// eslint-disable-next-line react-refresh/only-export-components
export function useMe(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('Chưa đăng nhập')
  return user
}
