import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import type { CountRow } from '@/types'
import { cn } from '@/lib/cn'

const AXIS = { fontSize: 12, fill: 'var(--ink-3)' }

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-ctl border border-line bg-surface px-3 py-2 text-caption shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-ink-2"><span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />{p.name}: <b className="text-ink">{p.value}</b></p>
      ))}
    </div>
  )
}

export function TrendChart({ data }: { data: { label: string; counseling: number; incidents: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="g-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--brand)" stopOpacity={0} /></linearGradient>
          <linearGradient id="g-i" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--teal)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--teal)" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <RTooltip content={<ChartTip />} cursor={{ stroke: 'var(--line-strong)' }} />
        <Area type="monotone" dataKey="counseling" name="Tư vấn" stroke="var(--brand)" strokeWidth={2} fill="url(#g-c)" isAnimationActive={false} />
        <Area type="monotone" dataKey="incidents" name="Sự việc" stroke="var(--teal)" strokeWidth={2} fill="url(#g-i)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TrendLegend() {
  return (
    <div className="flex items-center gap-4 text-caption text-ink-2">
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-brand" aria-hidden />Tư vấn</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-teal" aria-hidden />Sự việc</span>
    </div>
  )
}

const DONUT = ['var(--brand)', 'var(--teal)', '#e0a537', '#8a6fd1', '#5aa0d8', 'var(--line-strong)', '#c76b8f', 'var(--ink-3)']

export function DonutChart({ rows }: { rows: CountRow[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  return (
    <div className="flex h-full flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-full min-h-40 w-full max-w-[13rem] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false}>
              {rows.map((r, i) => <Cell key={r.key} fill={DONUT[i % DONUT.length]} />)}
            </Pie>
            <RTooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h1 font-semibold tabular-nums text-ink">{total}</span>
          <span className="text-caption text-ink-3">trường hợp</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-1.5 overflow-y-auto text-caption">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink-2">{r.label}</span>
            <span className="font-medium tabular-nums text-ink">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Thanh ngang thuần CSS — nhẹ, dễ đọc, dễ truy cập hơn biểu đồ cột cho danh mục có nhãn dài. */
export function BarList({ rows, tone = 'brand' }: { rows: CountRow[]; tone?: 'brand' | 'teal' }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="py-6 text-center text-body text-ink-3">Chưa có dữ liệu.</p>
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-caption"><span className="truncate text-ink-2">{r.label}</span><span className="font-semibold tabular-nums text-ink">{r.value}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="presentation">
            <div className={cn('h-full rounded-full', tone === 'brand' ? 'bg-brand' : 'bg-teal')} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
