import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  /** modal: hộp thoại giữa màn hình. sheet: ngăn kéo (dưới trên mobile, bên phải trên desktop). */
  variant?: 'modal' | 'sheet'
}

export function Dialog({ open, onOpenChange, title, description, children, footer, variant = 'modal' }: Props) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] animate-fade-in" />
        <D.Content
          className={cn(
            'fixed z-50 flex max-h-[90dvh] flex-col bg-surface shadow-pop focus:outline-none',
            variant === 'modal'
              ? 'left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-hero animate-pop-in'
              : 'inset-x-0 bottom-0 rounded-t-hero animate-sheet-in sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-hero',
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div className="min-w-0">
              <D.Title className="text-h2 font-semibold text-ink">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1 text-body text-ink-2">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{title}</D.Description>
              )}
            </div>
            <D.Close aria-label="Đóng" className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-ctl text-ink-3 hover:bg-surface-2 hover:text-ink">
              <X className="size-5" aria-hidden />
            </D.Close>
          </div>
          {children && <div className="overflow-y-auto px-6 py-3">{children}</div>}
          {footer && <div className="flex flex-col-reverse gap-2 px-6 pb-6 pt-3 sm:flex-row sm:justify-end pb-safe">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
  danger,
  children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  onConfirm: () => void
  loading?: boolean
  danger?: boolean
  children?: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Để sau
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
