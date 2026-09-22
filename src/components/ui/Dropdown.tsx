import * as M from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const Dropdown = M.Root
export const DropdownTrigger = M.Trigger

export function DropdownContent({ children, align = 'end', className }: { children: ReactNode; align?: 'start' | 'end'; className?: string }) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={8}
        className={cn('z-50 min-w-52 rounded-box border border-line bg-surface p-1.5 shadow-pop animate-pop-in', className)}
      >
        {children}
      </M.Content>
    </M.Portal>
  )
}

export function DropdownItem({ children, icon, onSelect, danger, disabled }: { children: ReactNode; icon?: ReactNode; onSelect?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <M.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex h-10 cursor-pointer select-none items-center gap-2.5 rounded-ctl px-2.5 text-body outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-2',
        danger ? 'text-danger-ink' : 'text-ink',
      )}
    >
      {icon && <span className="text-ink-3" aria-hidden>{icon}</span>}
      {children}
    </M.Item>
  )
}
export const DropdownSeparator = () => <M.Separator className="my-1.5 h-px bg-line" />
export const DropdownLabel = ({ children }: { children: ReactNode }) => <M.Label className="px-2.5 py-1.5 text-caption text-ink-3">{children}</M.Label>
