import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Portal } from '@/types'
import { LoadingState } from '@/components/ui'
import { useAuth } from './AuthProvider'
import { homeOf, portalOf } from './portal'

/**
 * Chặn ở phía giao diện để người dùng không lạc vào màn hình không thuộc quyền.
 * Quyền thật sự vẫn do cơ sở dữ liệu (RLS / RPC) quyết định — đây chỉ là lớp điều hướng.
 */
export function RequirePortal({ portal }: { portal: Portal }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="grid min-h-dvh place-items-center"><LoadingState label="Đang kiểm tra phiên đăng nhập…" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (portalOf(user.role) !== portal) return <Navigate to={homeOf(user.role)} replace />
  return <Outlet />
}

export function RedirectHome() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-dvh place-items-center"><LoadingState /></div>
  return <Navigate to={user ? homeOf(user.role) : '/login'} replace />
}
