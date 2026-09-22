import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronsLeft, ChevronsRight, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react'
import { useAuth, useMe } from '@/auth/AuthProvider'
import { portalOf } from '@/auth/portal'
import { useNotifications } from '@/data/hooks'
import { isDemoMode } from '@/lib/env'
import { ROLE_LABEL } from '@/lib/labels'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/cn'
import { Avatar, Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, IconButton, Logo, LogoMark, Tooltip } from '@/components/ui'
import { NAV, PORTAL_LABEL, type NavItem } from './nav'

const COLLAPSE_KEY = 'sc-sidebar-collapsed'

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
    } catch {
      /* bỏ qua */
    }
  }, [collapsed])
  return [collapsed, setCollapsed] as const
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-ctl px-3 text-body font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <item.icon className="size-[1.125rem] shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link
}

function Sidebar({ items, collapsed, onToggle }: { items: NavItem[]; collapsed: boolean; onToggle: () => void }) {
  const me = useMe()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const menu = items.filter((i) => i.group === 'menu')
  const sys = items.filter((i) => i.group === 'system')
  const portal = portalOf(me.role)
  return (
    <aside
      className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex', collapsed ? 'w-[4.5rem]' : 'w-64')}
      aria-label="Điều hướng chính"
    >
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'px-5')}>
        <Link to="/" aria-label="Nền tảng tư vấn học đường - trang chủ">
          {collapsed ? <LogoMark /> : <Logo />}
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-2">
        <div className="space-y-1">
          {!collapsed && <p className="px-3 pb-1 text-[0.6875rem] font-medium text-ink-3">Menu</p>}
          {menu.map((i) => <SidebarLink key={i.to} item={i} collapsed={collapsed} />)}
        </div>
        <div className="space-y-1">
          {!collapsed && <p className="px-3 pb-1 text-[0.6875rem] font-medium text-ink-3">Hệ thống</p>}
          {sys.map((i) => <SidebarLink key={i.to} item={i} collapsed={collapsed} />)}
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className={cn('flex items-center gap-3 rounded-ctl p-2', collapsed && 'justify-center p-0 py-2')}>
          <Avatar name={me.fullName} />
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-caption font-semibold text-ink">{me.fullName}</p>
              <p className="truncate text-[0.6875rem] text-ink-3">{ROLE_LABEL[me.role]}</p>
            </div>
          )}
          {!collapsed && (
            <Dropdown>
              <DropdownTrigger asChild>
                <IconButton label="Cài đặt tài khoản" className="size-9">
                  <Settings className="size-[1.125rem]" aria-hidden />
                </IconButton>
              </DropdownTrigger>
              <DropdownContent align="start" className="mb-2">
                <DropdownItem icon={<UserRound className="size-4" />} onSelect={() => navigate(`/${portal}/profile`)}>Hồ sơ của tôi</DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<LogOut className="size-4" />} onSelect={() => void signOut()}>Đăng xuất</DropdownItem>
              </DropdownContent>
            </Dropdown>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          className={cn('mt-1 flex h-9 w-full items-center gap-2 rounded-ctl px-3 text-caption text-ink-3 hover:bg-surface-2 hover:text-ink', collapsed && 'justify-center px-0')}
        >
          {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <><ChevronsLeft className="size-4" aria-hidden /><span>Thu gọn</span></>}
        </button>
      </div>
    </aside>
  )
}

function Header({ items }: { items: NavItem[] }) {
  const me = useMe()
  const { signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const loc = useLocation()
  const { data: notes } = useNotifications()
  const unread = notes?.filter((n) => !n.read).length ?? 0
  const portal = portalOf(me.role)
  const current = [...items].sort((a, b) => b.to.length - a.to.length).find((i) => (i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to)))
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 pt-safe backdrop-blur-md sm:px-6 lg:h-16 lg:px-8">
      <Link to="/" className="lg:hidden" aria-label="Trang chủ"><LogoMark /></Link>
      <nav aria-label="Vị trí hiện tại" className="min-w-0 flex-1">
        <p className="truncate text-caption text-ink-3">
          <span className="hidden lg:inline">{PORTAL_LABEL[portal]} <span aria-hidden className="mx-1.5">/</span></span>
          <span className="font-medium text-ink lg:font-normal lg:text-ink-2">{current?.label ?? 'Chi tiết'}</span>
        </p>
      </nav>
      <div className="flex items-center gap-1">
        <IconButton label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={toggle}>
          {theme === 'dark' ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
        </IconButton>
        <IconButton label={unread ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'} onClick={() => navigate(`/${portal}/notifications`)}>
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.625rem] font-semibold leading-4 text-on-brand ring-2 ring-bg" aria-hidden>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </IconButton>
        <Dropdown>
          <DropdownTrigger asChild>
            <button type="button" aria-label="Menu tài khoản" className="ml-1 rounded-full outline-offset-2">
              <Avatar name={me.fullName} />
            </button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownLabel>
              <span className="block font-medium text-ink">{me.fullName}</span>
              <span>{ROLE_LABEL[me.role]}</span>
            </DropdownLabel>
            <DropdownSeparator />
            <DropdownItem icon={<UserRound className="size-4" />} onSelect={() => navigate(`/${portal}/profile`)}>Hồ sơ của tôi</DropdownItem>
            <DropdownItem icon={<LogOut className="size-4" />} onSelect={() => void signOut()}>Đăng xuất</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  )
}

function MobileNav({ items }: { items: NavItem[] }) {
  const list = items.filter((i) => i.mobile).slice(0, 5)
  return (
    <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur-md lg:hidden">
      <ul className="mx-auto flex max-w-lg">
        {list.map((i) => (
          <li key={i.to} className="flex-1">
            <NavLink
              to={i.to}
              end={i.end}
              className={({ isActive }) => cn('flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] font-medium transition-colors', isActive ? 'text-brand' : 'text-ink-3')}
            >
              {({ isActive }) => (
                <>
                  <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-brand-soft')}>
                    <i.icon className="size-5" aria-hidden />
                  </span>
                  <span>{i.short ?? i.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AppShell() {
  const me = useMe()
  const loc = useLocation()
  const [collapsed, setCollapsed] = useCollapsed()
  const items = NAV[portalOf(me.role)]
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-ctl focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand">
        Bỏ qua điều hướng
      </a>
      <Sidebar items={items} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        {isDemoMode && (
          <div className="bg-warn-soft px-4 py-1.5 text-center text-caption text-warn-ink">
            Bản demo: dữ liệu chỉ là mẫu và sẽ mất khi tải lại trang.
          </div>
        )}
        <Header items={items} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 outline-none sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div key={loc.pathname} className="animate-page">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav items={items} />
    </div>
  )
}
