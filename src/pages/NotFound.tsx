import { Compass } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { homeOf } from '@/auth/portal'
import { EmptyState, LinkButton } from '@/components/ui'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <EmptyState icon={<Compass className="size-7" />} title="Không tìm thấy trang này" description="Đường dẫn có thể đã thay đổi hoặc không tồn tại." action={<LinkButton to={user ? homeOf(user.role) : '/login'}>Về trang chủ</LinkButton>} />
    </div>
  )
}
