import { cn } from '@/lib/cn'
import { env } from '@/lib/env'

/** Biểu tượng: khung chat (lắng nghe) + khiên (an toàn) + mũ cử nhân (học đường). */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8 shrink-0', className)} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} fill="none">
      <path d="M16 2.2 27.6 6.6v8.9c0 6.6-4.9 11.7-11.6 14.3C9.3 27.2 4.4 22.1 4.4 15.5V6.6L16 2.2Z" fill="var(--brand)" />
      <path d="M12.4 9.6h7.2a2.6 2.6 0 0 1 2.6 2.6v4.4a2.6 2.6 0 0 1-2.6 2.6h-4.1l-3.6 2.9v-2.9a2.6 2.6 0 0 1-2.1-2.6v-4.4a2.6 2.6 0 0 1 2.6-2.6Z" fill="#fff" />
      <path d="M16 11.4 20.4 13.4 16 15.4 11.6 13.4 16 11.4Z" fill="#0E8A7D" />
      <path d="M13.4 14.9v1.6c0 .7 1.2 1.3 2.6 1.3s2.6-.6 2.6-1.3v-1.6" stroke="#0E8A7D" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[0.9375rem] font-semibold tracking-tight text-ink">Tư vấn học đường</span>
          <span className="block truncate text-[0.6875rem] text-ink-3">{env.schoolName}</span>
        </span>
      )}
    </span>
  )
}
