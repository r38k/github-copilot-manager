import React from 'react'
import type { IntegratedData } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function SummaryCards({ data }: { data: IntegratedData }) {
  const activeUsers = data.billing.activeUserCount
  const estimatedCost = data.billing.estimatedCost
  const totalUsers = data.csvData?.totalUsers ?? 0
  const exceedingUsers = data.csvData?.exceedingUsers ?? 0
  const seatsTotal = data.seats.length
  const nonActive30d = data.seats.filter((s) => {
    if (!s.lastActivityAt) return true
    const last = new Date(s.lastActivityAt).getTime()
    const ago30 = Date.now() - 30 * 24 * 60 * 60 * 1000
    return last < ago30
  }).length
  const csvLast = data.dataSourceStatus?.csvLastUpdated
    ? new Date(String(data.dataSourceStatus.csvLastUpdated)).toLocaleString('ja-JP')
    : 'なし'

  const items = [
    { label: 'アクティブユーザー', value: `${activeUsers}名` },
    { label: '今月の推定コスト', value: `$${estimatedCost.toFixed(2)}` },
    { label: '利用ユーザー数', value: `${totalUsers}名` },
    { label: '制限超過ユーザー', value: `${exceedingUsers}名` },
    { label: '総座席数', value: `${seatsTotal}席` },
    { label: '非アクティブ(30日)', value: `${nonActive30d}名` },
    { label: 'CSV最終更新', value: csvLast },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-zinc-600">{it.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-zinc-900">{it.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

