import React, { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { buildThreatTimeline } from '../data/timeseries'
import type { TimeRange } from '../types'
import { Card, CardHeader } from './ui/Card'
import { TimeRangeSelector } from './ui/TimeRangeSelector'
import { Activity } from 'lucide-react'
import { useSoc } from '../context/SocContext'

const SERIES = [
  { key: 'normal', name: 'Normal Activity', color: '#8b96a5' },
  { key: 'authFailures', name: 'Auth Failures', color: '#4c9aff' },
  { key: 'bruteForce', name: 'Brute-Force Attempts', color: '#e5484d' },
  { key: 'powershell', name: 'Suspicious PowerShell', color: '#f0883e' },
  { key: 'portScan', name: 'Port Scanning', color: '#e8b339' },
  { key: 'privEsc', name: 'Privilege Escalation', color: '#c04cff' },
] as const

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2 shadow-panel">
      <div className="text-[11px] text-text-muted font-data mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload
          .filter((p: any) => p.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2 text-[11.5px]">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-text-secondary">{p.name}:</span>
              <span className="font-data font-semibold text-text-primary tabular">{p.value}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

export function ThreatTimeline({ timeRange, onTimeRangeChange }: { timeRange: TimeRange; onTimeRangeChange: (r: TimeRange) => void }) {
  const { activeAttack } = useSoc()
  const data = useMemo(() => buildThreatTimeline(timeRange, activeAttack), [timeRange, activeAttack])
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <Card>
      <CardHeader
        title="Threat Activity Timeline"
        subtitle="Correlated security telemetry across all monitored sources"
        icon={<Activity size={16} />}
        action={<TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />}
      />

      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="#1c222b" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#232932' }}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2b323d', strokeWidth: 1 }} />
            {SERIES.map((s) =>
              hidden.has(s.key) ? null : (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={1.75}
                  fill={`url(#grad-${s.key})`}
                  stackId={s.key === 'normal' ? undefined : '1'}
                  dot={false}
                  activeDot={{ r: 3 }}
                  isAnimationActive={false}
                />
              )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend - clickable to toggle series */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-surface-border">
        {SERIES.map((s) => {
          const isHidden = hidden.has(s.key)
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`flex items-center gap-1.5 text-[11.5px] transition-opacity ${isHidden ? 'opacity-35' : ''}`}
            >
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
              <span className="text-text-secondary">{s.name}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
