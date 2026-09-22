import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge cần biết các token tùy biến trong styles/index.css,
 * nếu không `text-body` (cỡ chữ) sẽ bị coi là màu chữ và xóa nhầm `text-on-brand`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'body', 'caption'] }],
      rounded: [{ rounded: ['ctl', 'box', 'hero'] }],
      shadow: [{ shadow: ['pop', 'low'] }],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
