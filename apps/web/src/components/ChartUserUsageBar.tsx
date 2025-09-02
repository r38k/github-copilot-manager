import React from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { IntegratedData } from '../types'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from './ui/chart'

export function ChartUserUsageBar({ data }: { data: IntegratedData }) {
  if (!data.csvData) {
    return <div className="chart"><h3 className="mb-2 text-sm font-medium text-zinc-600">ユーザー別利用量（上位）</h3><p className="text-zinc-600">CSV データがありません</p></div>
  }

  const userUsage = data.csvData.records.reduce((acc, record) => {
    const key = record.user
    const current = acc.get(key) ?? { user: key, totalUsage: 0 }
    current.totalUsage += record.useQuota
    acc.set(key, current)
    return acc
  }, new Map<string, { user: string; totalUsage: number }>())

  const chartData = Array.from(userUsage.values())
    .sort((a, b) => b.totalUsage - a.totalUsage)
    .slice(0, 10)

  return (
    <ChartContainer config={{ color: '#0ea5e9' }}>
      <h3 className="mb-2 text-sm font-medium text-zinc-600">ユーザー別利用量（上位10）</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="user" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar name="利用量" dataKey="totalUsage" fill="var(--chart-color)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
