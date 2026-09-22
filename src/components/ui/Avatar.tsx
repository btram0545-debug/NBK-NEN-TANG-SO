import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const palette = [
  'bg-brand-soft-2 text-brand-ink',
  'bg-teal-soft text-teal-ink',
  'bg-warn-soft text-warn-ink',
  'bg-ok-soft text-ok-ink',
  'bg-surface-2 text-ink-2',
]
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const dim = { sm: 'size-7 text-[0.6875rem]', md: 'size-9 text-caption', lg: 'size-11 text-body', xl: 'size-20 text-h1' }[size]
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', dim, palette[hash(name) % palette.length], className)}
    >
      {initials(name)}
    </span>
  )
}
