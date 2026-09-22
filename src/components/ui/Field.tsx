import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-ctl border bg-surface px-3.5 text-body text-ink transition-colors placeholder:text-ink-3 hover:border-ink-3 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand/30 disabled:bg-surface-2 disabled:text-ink-3'
const border = (invalid?: boolean) => (invalid ? 'border-danger' : 'border-line-strong')

interface FieldProps {
  id?: string
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
  className?: string
}
/** Bọc nhãn + gợi ý + thông báo lỗi, đảm bảo aria-describedby / aria-invalid. */
export function Field({ id: idProp, label, hint, error, optional, children, className }: FieldProps) {
  const auto = useId()
  const id = idProp ?? auto
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-caption font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="font-normal text-ink-3">Không bắt buộc</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-caption text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type Common = { id?: string; label: string; hint?: string; error?: string; optional?: boolean; wrapperClassName?: string }

export function Input({ id: idProp, label, hint, error, optional, wrapperClassName, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field id={idProp} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(control, border(invalid), 'h-11', className)} {...rest} />
      )}
    </Field>
  )
}

export function Textarea({ id: idProp, label, hint, error, optional, wrapperClassName, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field id={idProp} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(control, border(invalid), 'min-h-32 resize-y py-3 leading-relaxed', className)}
          {...rest}
        />
      )}
    </Field>
  )
}

export function Select({ id: idProp, label, hint, error, optional, wrapperClassName, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field id={idProp} label={label} hint={hint} error={error} optional={optional} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={cn(control, border(invalid), 'h-11 appearance-none pr-10', className)} {...rest}>
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        </div>
      )}
    </Field>
  )
}

/** Ô chọn lớn, dễ chạm — dùng cho lựa chọn 1 trong nhiều (radio). */
export function ChoiceCard({
  checked,
  onChange,
  name,
  value,
  title,
  description,
  icon,
}: {
  checked: boolean
  onChange: () => void
  name: string
  value: string
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <label
      className={cn(
        'group relative flex min-h-14 cursor-pointer items-center gap-3 rounded-box border bg-surface px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand',
        checked ? 'border-brand bg-brand-soft' : 'border-line hover:border-line-strong hover:bg-surface-2',
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {icon && <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-ctl', checked ? 'bg-brand text-on-brand' : 'bg-surface-2 text-ink-2')}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{title}</span>
        {description && <span className="block text-caption text-ink-3">{description}</span>}
      </span>
      <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', checked ? 'border-brand bg-brand text-on-brand' : 'border-line-strong')} aria-hidden>
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </label>
  )
}

export function Checkbox({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
          checked ? 'border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface',
        )}
        aria-hidden
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-body text-ink">{label}</span>
        {description && <span className="block text-caption text-ink-3">{description}</span>}
      </span>
    </label>
  )
}

export function Switch({ checked, onCheckedChange, label, description, disabled, bare }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean; bare?: boolean }) {
  const id = useId()
  const root = (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      disabled={disabled}
      aria-label={bare ? label : undefined}
      onCheckedChange={onCheckedChange}
      className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-brand disabled:opacity-50"
    >
      <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  )
  if (bare) return root
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-body font-medium text-ink">{label}</span>
        {description && <span className="block text-caption text-ink-3">{description}</span>}
      </label>
      {root}
    </div>
  )
}
