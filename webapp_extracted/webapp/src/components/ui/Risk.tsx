import React from 'react'
import { riskColor, riskBarColor } from '../../lib/severity'

export function RiskScore({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeCls = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }[size]
  return (
    <span className={`font-data font-bold tabular ${riskColor(score)} ${sizeCls}`}>
      {score}
      <span className="text-text-muted text-xs font-normal">/100</span>
    </span>
  )
}

export function RiskBar({ score, showLabel = false }: { score: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-surface-4 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${riskBarColor(score)}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      {showLabel && <span className={`font-data text-xs tabular font-semibold ${riskColor(score)}`}>{score}</span>}
    </div>
  )
}

export function RiskGaugeRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(100, score) / 100)
  const color = score >= 80 ? '#e5484d' : score >= 60 ? '#f0883e' : score >= 35 ? '#e8b339' : '#4c9aff'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1c222b" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data font-bold text-2xl tabular" style={{ color }}>{score}</span>
        <span className="text-text-muted text-xxs -mt-0.5">/ 100</span>
      </div>
    </div>
  )
}
