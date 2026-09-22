import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'danger-soft'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-ctl font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px'
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover shadow-low',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  soft: 'bg-brand-soft text-brand-ink hover:bg-brand-soft-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-95',
  'danger-soft': 'bg-danger-soft text-danger-ink hover:brightness-95',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-caption',
  md: 'h-11 px-4 text-body',
  lg: 'h-12 px-6 text-body',
}
// eslint-disable-next-line react-refresh/only-export-components
export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', extra?: string) =>
  cn(base, variants[variant], sizes[size], extra)

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

interface LinkButtonProps extends LinkProps {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}
export function LinkButton({ variant = 'primary', size = 'md', icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn('relative inline-flex size-10 items-center justify-center rounded-ctl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink', className)}
      {...rest}
    >
      {children}
    </button>
  )
}
