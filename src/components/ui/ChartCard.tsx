import type { ReactNode } from 'react'
import { Card } from './Card'

export function ChartCard({ title, description, children, action, height = 240 }: { title: string; description?: string; children: ReactNode; action?: ReactNode; height?: number | 'auto' }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-h3 font-semibold text-ink">{title}</h3>
          {description && <p className="text-caption text-ink-3">{description}</p>}
        </div>
        {action}
      </div>
      <div style={height === 'auto' ? undefined : { height }} className="w-full text-caption">
        {children}
      </div>
    </Card>
  )
}
