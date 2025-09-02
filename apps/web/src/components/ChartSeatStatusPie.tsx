import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { IntegratedData } from '../types'
import { ChartContainer, ChartTooltipContent } from './ui/chart'

export function ChartSeatStatusPie({ data }: { data: IntegratedData }) {
  const activeCount = data.billing.activeUserCount
  const pendingCancellation = data.seats.filter(s => s.pendingCancellationDate).length
  const recentActive = data.seats.filter(s => {
    if (!s.lastActivityAt) return false
    const last = new Date(s.lastActivityAt).getTime()
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return last > weekAgo
  }).length

  const chartData = [
    { name: 'アクティブ', value: activeCount, fill: '#22c55e' },
    { name: '解約予定', value: pendingCancellation, fill: '#f59e0b' },
    { name: '最近活動', value: recentActive, fill: '#06b6d4' },
  ]

  return (
    <ChartContainer>
      <h3 className="mb-2 text-sm font-medium text-zinc-600">座席利用状況</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

