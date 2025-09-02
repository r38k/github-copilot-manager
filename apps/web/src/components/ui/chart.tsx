import React from 'react'
import type { TooltipProps } from 'recharts'

export type ChartConfig = {
  color?: string
}

export function ChartContainer({ children, className = '', config }: { children: React.ReactNode; className?: string; config?: ChartConfig }) {
  const color = config?.color ?? '#2563eb'
  return (
    <div className={`chart ${className}`} style={{ ['--chart-color' as any]: color }}>
      {children}
    </div>
  )
}

export function ChartTooltipContent({ label, payload }: TooltipProps<number, string>) {
  if (!payload || payload.length === 0) return null
  const p = payload[0]
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm shadow">
      <div className="text-zinc-500">{label}</div>
      <div className="font-medium" style={{ color: 'var(--chart-color)' }}>{p.value}</div>
    </div>
  )
}

export function ChartLegendContent(props: any) {
  const items = Array.isArray(props?.payload) ? props.payload : []
  if (!items.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
      {items.map((it: any, i: number) => (
        <span key={i} className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: it.color }} />
          {it.value}
        </span>
      ))}
    </div>
  )
}
