'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts'
import { readLogsForMonth } from '@/lib/db'
import { calculateDailyScore } from '@/lib/carbonEngine'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { DayCard } from '@/components/DayCard'
import { FileDown, Share2, Loader2, BarChart3 } from 'lucide-react'

function groupLogsByDate(logs) {
  const map = {}
  for (const log of logs) {
    if (!map[log.date]) map[log.date] = []
    map[log.date].push(log)
  }
  return map
}

function buildChartData(logsByDate) {
  return Object.entries(logsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => {
      const { score, totalCO2, breakdown } = calculateDailyScore(entries)
      return { date: date.slice(5), score, co2: totalCO2, ...breakdown }
    })
}

const CATEGORY_COLORS = {
  commute: '#22C55E',
  food:    '#0EA5E9',
  energy:  '#F59E0B',
  cooking: '#8B5CF6',
  waste:   '#EF4444',
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '12px',
  color: 'var(--color-foreground)',
}

export default function ReportsPage() {
  const { isOnline } = useOfflineSync()
  const [chartData, setChartData] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const cardRef = useRef(null)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  useEffect(() => {
    readLogsForMonth(year, month)
      .then((monthLogs) => {
        setLogs(monthLogs)
        setChartData(buildChartData(groupLogsByDate(monthLogs)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year, month])

  const bestDay  = chartData.length ? chartData.reduce((a, b) => b.score > a.score ? b : a) : null
  const worstDay = chartData.length ? chartData.reduce((a, b) => b.score < a.score ? b : a) : null

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ month: `${year}-${String(month).padStart(2, '0')}`, logs, chartData }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `prithvi-${year}-${month}.json`; a.click()
    URL.revokeObjectURL(url)
  }, [year, month, logs, chartData])

  const exportPDF = useCallback(async () => {
    setExporting(true)
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'), import('html2canvas')
      ])
      const canvas = await html2canvas(document.getElementById('report-content'), { scale: 2, useCORS: true })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`prithvi-report-${year}-${month}.pdf`)
    } catch { /* silent — browser may block */ }
    setExporting(false)
  }, [year, month])

  const shareCard = useCallback(async () => {
    if (!cardRef.current) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        if (navigator.share) {
          await navigator.share({ title: 'My Prithvi Carbon Report', files: [new File([blob], 'prithvi-day.png', { type: 'image/png' })] })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = 'prithvi-day.png'; a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch { /* silent */ }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <Loader2 className="size-8 text-primary animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading monthly report…</span>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-heading text-foreground">Monthly Reports</h1>
        <div className="rounded-2xl bg-card border border-border p-10 flex flex-col items-center gap-3 text-center">
          <BarChart3 className="size-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">No data yet. Start tracking to see your report.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="report-content">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Monthly Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {chartData.length} days logged
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            id="btn-export-pdf"
            onClick={exportPDF}
            disabled={exporting}
            aria-label="Export monthly report as PDF"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-accent transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <FileDown className="size-3.5" aria-hidden="true" />
            {exporting ? 'Exporting…' : 'PDF'}
          </button>
          <button
            id="btn-export-json"
            onClick={exportJSON}
            aria-label="Export monthly data as JSON"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-card border border-border hover:bg-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <FileDown className="size-3.5" aria-hidden="true" />
            JSON
          </button>
          <button
            id="btn-share-png"
            onClick={shareCard}
            aria-label="Share today's day card as image"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            Share Card
          </button>
        </div>
      </div>

      {/* Best / worst day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bestDay && (
          <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">Best Day</p>
            <p className="text-xl font-bold font-heading text-foreground">{bestDay.date}</p>
            <p className="text-sm text-muted-foreground">Score: {bestDay.score} · {bestDay.co2.toFixed(2)} kg CO₂</p>
          </div>
        )}
        {worstDay && (
          <div className="rounded-2xl bg-red-500/8 border border-red-500/20 p-4">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider mb-1">Worst Day</p>
            <p className="text-xl font-bold font-heading text-foreground">{worstDay.date}</p>
            <p className="text-sm text-muted-foreground">Score: {worstDay.score} · {worstDay.co2.toFixed(2)} kg CO₂</p>
          </div>
        )}
      </div>

      {/* Score trend */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm" aria-labelledby="score-chart-heading">
        <h2 id="score-chart-heading" className="text-sm font-semibold font-heading text-foreground mb-4">
          Daily Score Trend
        </h2>
        <div aria-label="Line chart showing your daily carbon score over the month">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* CO2 by category stacked bar */}
      <section className="rounded-2xl bg-card border border-border p-5 shadow-sm" aria-labelledby="breakdown-chart-heading">
        <h2 id="breakdown-chart-heading" className="text-sm font-semibold font-heading text-foreground mb-4">
          CO₂ by Category
        </h2>
        <div aria-label="Stacked bar chart showing CO2 breakdown by category each day">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <Bar key={cat} dataKey={cat} stackId="co2" fill={color} name={cat.charAt(0).toUpperCase() + cat.slice(1)} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Day card for sharing */}
      <div ref={cardRef}>
        <DayCard
          date={new Date()}
          score={chartData[chartData.length - 1]?.score ?? 0}
          bestAction={bestDay ? `Best score day: ${bestDay.date}` : 'Log more activities'}
          worstAction={worstDay ? `Worst score day: ${worstDay.date}` : 'No data yet'}
          coinsEarned={Math.round((chartData[chartData.length - 1]?.score ?? 0) * 13)}
        />
      </div>
    </div>
  )
}
