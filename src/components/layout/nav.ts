import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileClock,
  Home,
  Inbox,
  LayoutDashboard,
  MessageCircleHeart,
  MessagesSquare,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { Portal } from '@/types'

export interface NavItem {
  to: string
  label: string
  short?: string
  icon: LucideIcon
  end?: boolean
  group: 'menu' | 'system'
  /** Có mặt trên thanh điều hướng dưới (mobile, tối đa 5). */
  mobile?: boolean
}

const system = (p: string): NavItem[] => [
  { to: `/${p}/notifications`, label: 'Thông báo', icon: Bell, group: 'system' },
  { to: `/${p}/profile`, label: 'Hồ sơ', short: 'Cá nhân', icon: UserRound, group: 'system', mobile: true },
]

export const NAV: Record<Portal, NavItem[]> = {
  student: [
    { to: '/student', label: 'Tổng quan', short: 'Trang chủ', icon: Home, end: true, group: 'menu', mobile: true },
    { to: '/student/counseling', label: 'Tư vấn học đường', short: 'Tư vấn', icon: MessageCircleHeart, group: 'menu', mobile: true },
    { to: '/student/incidents', label: 'Báo cáo sự việc', short: 'Báo cáo', icon: ShieldAlert, group: 'menu', mobile: true },
    { to: '/student/suggestions', label: 'Hộp thư góp ý', icon: Inbox, group: 'menu' },
    { to: '/student/appointments', label: 'Lịch hẹn', icon: CalendarDays, group: 'menu' },
    { to: '/student/messages', label: 'Tin nhắn', icon: MessagesSquare, group: 'menu', mobile: true },
    ...system('student'),
  ],
  teacher: [
    { to: '/teacher', label: 'Tổng quan', short: 'Trang chủ', icon: Home, end: true, group: 'menu', mobile: true },
    { to: '/teacher/cases', label: 'Trường hợp được giao', short: 'Trường hợp', icon: ClipboardList, group: 'menu', mobile: true },
    { to: '/teacher/schedule', label: 'Lịch làm việc', short: 'Lịch', icon: CalendarDays, group: 'menu', mobile: true },
    { to: '/teacher/messages', label: 'Tin nhắn', icon: MessagesSquare, group: 'menu', mobile: true },
    ...system('teacher'),
  ],
  supervisor: [
    { to: '/supervisor', label: 'Tổng quan', short: 'Trang chủ', icon: LayoutDashboard, end: true, group: 'menu', mobile: true },
    { to: '/supervisor/incidents', label: 'Báo cáo sự việc', short: 'Sự việc', icon: ShieldAlert, group: 'menu', mobile: true },
    { to: '/supervisor/cases', label: 'Yêu cầu tư vấn', short: 'Tư vấn', icon: MessageCircleHeart, group: 'menu', mobile: true },
    { to: '/supervisor/notifications', label: 'Thông báo', icon: Bell, group: 'system', mobile: true },
    { to: '/supervisor/profile', label: 'Hồ sơ', short: 'Cá nhân', icon: UserRound, group: 'system', mobile: true },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Trung tâm điều hành', short: 'Điều hành', icon: LayoutDashboard, group: 'menu', mobile: true },
    { to: '/admin/reports', label: 'Báo cáo tổng hợp', short: 'Báo cáo', icon: BarChart3, group: 'menu', mobile: true },
    { to: '/admin/users', label: 'Người dùng', icon: Users, group: 'menu', mobile: true },
    { to: '/admin/audit-logs', label: 'Nhật ký hoạt động', short: 'Nhật ký', icon: FileClock, group: 'menu', mobile: true },
    { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: Settings, group: 'system' },
    ...system('admin'),
  ],
}

export const PORTAL_LABEL: Record<Portal, string> = {
  student: 'Không gian học sinh',
  teacher: 'Không gian giáo viên',
  supervisor: 'Không gian quản sinh',
  admin: 'Ban giám hiệu',
}
