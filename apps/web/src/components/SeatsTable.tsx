import React from 'react'
import type { IntegratedData } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function SeatsTable({ data }: { data: IntegratedData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>座席一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-left text-xs text-zinc-600">
                <th className="px-3 py-2">ユーザー名</th>
                <th className="px-3 py-2">ユーザーID</th>
                <th className="px-3 py-2">割り当て日</th>
                <th className="px-3 py-2">最終活動</th>
                <th className="px-3 py-2">解約予定</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.seats.map((s) => {
                const assigned = new Date(s.assignedAt).toLocaleDateString('ja-JP')
                const last = s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString('ja-JP') : '-'
                const cancel = s.pendingCancellationDate ? new Date(s.pendingCancellationDate).toLocaleDateString('ja-JP') : '-'
                return (
                  <tr key={s.userId} className="border-b border-zinc-100">
                    <td className="px-3 py-2">{s.login}</td>
                    <td className="px-3 py-2">{s.userId}</td>
                    <td className="px-3 py-2">{assigned}</td>
                    <td className="px-3 py-2">{last}</td>
                    <td className="px-3 py-2">{cancel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

