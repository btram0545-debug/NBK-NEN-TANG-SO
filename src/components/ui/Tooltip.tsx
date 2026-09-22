import * as T from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export const TooltipProvider = T.Provider

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content sideOffset={6} className="z-50 max-w-64 rounded-ctl bg-ink px-2.5 py-1.5 text-caption text-bg shadow-pop animate-fade-in">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}
