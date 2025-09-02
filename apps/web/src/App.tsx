import React, { useEffect, useState } from 'react'
import { ChartUserTrend } from './components/ChartUserTrend'
import { ChartUserUsageBar } from './components/ChartUserUsageBar'
import { ChartSeatStatusPie } from './components/ChartSeatStatusPie'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { SummaryCards } from './components/SummaryCards'
import { SeatsTable } from './components/SeatsTable'
import type { IntegratedData } from './types'

export function App() {
  const [data, setData] = useState<IntegratedData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchApi = () => fetch('/api/data').then(async (r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
      return r.json() as Promise<IntegratedData>
    })
    const fetchStatic = () => fetch('/data.json').then(async (r) => {
      if (!r.ok) throw new Error(`STATIC ${r.status}`)
      return r.json() as Promise<IntegratedData>
    })

    fetchApi()
      .catch(() => fetchStatic())
      .then((json) => { if (!cancelled) { setData(json); setLoading(false) }})
      .catch((e) => { if (!cancelled) { setErr(e.message); setLoading(false) }})

    return () => { cancelled = true }
  }, [])

  return (
    <div className="container">
      <h1 className="text-2xl font-semibold text-zinc-800">GitHub Copilot Manager</h1>
      <Card>
        <CardHeader>
          <CardTitle>Web ダッシュボード (CSR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.location.reload()}>再読み込み</Button>
            <a href="/data.json" className="text-sm text-[hsl(var(--primary))] underline">data.json を確認</a>
          </div>
          {loading && <p className="text-zinc-600">読み込み中...</p>}
          {err && <p className="text-red-600">エラー: {err}</p>}
          {data && (
            <>
              <div className="mb-4">
                <SummaryCards data={data} />
              </div>
              <div className="charts">
                <ChartUserTrend data={data} />
                <ChartUserUsageBar data={data} />
                <ChartSeatStatusPie data={data} />
              </div>
              <div className="mt-4">
                <SeatsTable data={data} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
