import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  /** Ẩn ở màn hình nhỏ (chỉ hiện trong dạng thẻ khi mobile nếu có mobileTitle/mobileMeta). */
  hideOnMobile?: boolean
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  caption: string
  /** Trên mobile, hiển thị mỗi dòng dưới dạng thẻ do hàm này dựng. */
  mobileCard?: (row: T) => ReactNode
}

/** Bảng dữ liệu: bảng thật trên màn hình rộng, danh sách thẻ trên mobile. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, caption, mobileCard }: Props<T>) {
  return (
    <>
      {mobileCard && (
        <ul className="space-y-2 md:hidden" aria-label={caption}>
          {rows.map((r) => (
            <li key={rowKey(r)}>
              <Card
                className={cn('p-4', onRowClick && 'cursor-pointer active:bg-surface-2')}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
              >
                {mobileCard(r)}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Card className={cn('overflow-hidden', mobileCard && 'hidden md:block')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-body">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={cn('px-3 py-3 text-caption font-medium text-ink-3 first:pl-4 last:pr-4', c.className)}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr
                  key={rowKey(r)}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-surface-2/60')}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-3 py-3.5 align-middle first:pl-4 last:pr-4', c.className)}>
                      {c.cell(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
