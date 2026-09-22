import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <TabsPrimitive.List aria-label={label} className={cn('flex gap-1 overflow-x-auto border-b border-line scrollbar-none', className)}>
      {children}
    </TabsPrimitive.List>
  )
}
export function TabsTrigger({ value, children, count }: { value: string; children: ReactNode; count?: number }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-body font-medium text-ink-3 transition-colors hover:text-ink data-[state=active]:border-brand data-[state=active]:text-ink"
    >
      {children}
      {count !== undefined && count > 0 && <span className="rounded-full bg-surface-2 px-1.5 text-[0.6875rem] font-semibold text-ink-2">{count}</span>}
    </TabsPrimitive.Trigger>
  )
}

/** Bộ lọc dạng viên thuốc (pill) — gọn hơn tab, dùng cho lọc danh sách. */
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-caption font-medium transition-colors',
              active ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn('text-[0.6875rem]', active ? 'text-on-brand/80' : 'text-ink-3')}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
