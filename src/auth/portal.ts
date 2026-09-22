import type { Portal, Role } from '@/types'

/** Vai trò => cổng làm việc. Tư vấn viên dùng chung cổng với giáo viên. */
export const portalOf = (role: Role): Portal => (role === 'counselor' ? 'teacher' : role)
export const homeOf = (role: Role) => (portalOf(role) === 'admin' ? '/admin/dashboard' : `/${portalOf(role)}`)
export const isStaffRole = (role: Role) => role !== 'student'
