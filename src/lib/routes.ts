import type { CaseKind, Portal } from '@/types'

/** Đường dẫn tới trang chi tiết của một ca, theo cổng của người xem. */
export function caseHref(portal: Portal, kind: CaseKind, id: string) {
  switch (portal) {
    case 'student':
      return `/student/${kind === 'incident' ? 'incidents' : 'counseling'}/${id}`
    case 'supervisor':
      return `/supervisor/${kind === 'incident' ? 'incidents' : 'cases'}/${id}`
    case 'teacher':
      return `/teacher/cases/${kind}/${id}`
    case 'admin':
      return `/admin/cases/${kind}/${id}`
  }
}
