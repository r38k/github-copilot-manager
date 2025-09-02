import React, { useMemo, useState } from 'react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { IntegratedData } from '../types'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from './ui/chart'
import { Button } from './ui/button'

type Granularity = 'day' | 'week' | 'month' | 'year'

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  const week = String(weekNo).padStart(2, '0')
  return `${date.getUTCFullYear()}-W${week}`
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function yearKey(d: Date): string {
  return `${d.getUTCFullYear()}`
}

export function ChartUserTrend({ data }: { data: IntegratedData }) {
  const [granularity, setGranularity] = useState<Granularity>('day')
  if (!data.csvData) {
    return <div className="chart"><h3>ユーザー数の推移</h3><p className="text-zinc-600">CSV データがありません</p></div>
  }

  const chartData = useMemo(() => {
    const buckets = new Map<string, Set<string>>()
    for (const rec of data.csvData!.records) {
      const d = new Date(rec.timestamp)
      if (Number.isNaN(d.getTime())) continue
      let key: string
      switch (granularity) {
        case 'week': key = isoWeekKey(d); break
        case 'month': key = monthKey(d); break
        case 'year': key = yearKey(d); break
        case 'day':
        default:
          key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      }
      if (!buckets.has(key)) buckets.set(key, new Set<string>())
      buckets.get(key)!.add(rec.user)
    }

    const sorted = Array.from(buckets.entries())
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 累積ユニーク
    const usersByKey = new Map<string, Set<string>>()
    for (const rec of data.csvData!.records) {
      const d = new Date(rec.timestamp)
      if (Number.isNaN(d.getTime())) continue
      let key: string
      switch (granularity) {
        case 'week': key = isoWeekKey(d); break
        case 'month': key = monthKey(d); break
        case 'year': key = yearKey(d); break
        case 'day':
        default:
          key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      }
      if (!usersByKey.has(key)) usersByKey.set(key, new Set<string>())
      usersByKey.get(key)!.add(rec.user)
    }
    const seen = new Set<string>()
    const cumulative = new Map<string, number>()
    for (const pt of sorted) {
      for (const u of usersByKey.get(pt.date) ?? []) seen.add(u)
      cumulative.set(pt.date, seen.size)
    }

    return sorted.map(pt => ({ ...pt, cumulative: cumulative.get(pt.date)! }))
  }, [data.csvData, granularity])

  return (
    <ChartContainer config={{ color: '#2563eb' }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-600">ユーザー数の推移</h3>
        <div className="flex items-center gap-1">
          {([
            ['日', 'day'],
            ['週', 'week'],
            ['月', 'month'],
            ['年', 'year'],
          ] as const).map(([label, key]) => (
            <Button key={key} size="sm" variant={granularity === key ? 'default' : 'secondary'} onClick={() => setGranularity(key as Granularity)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Line name="ユーザー数" type="monotone" dataKey="count" stroke="var(--chart-color)" dot={false} isAnimationActive={false} />
          <Line name="累積ユニーク" type="monotone" dataKey="cumulative" stroke="#16a34a" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
