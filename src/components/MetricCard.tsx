import React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  deltaDirection = 'up',
  deltaTone = 'neutral',
  icon,
  accentClass = 'text-text-primary',
  footnote,
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  deltaLabel?: string
  deltaDirection?: 'up' | 'down'
  deltaTone?: 'good' | 'bad' | 'neutral'
  icon?: React.ReactNode
  accentClass?: string
  footnote?: string
}) {
  const toneCls =
    deltaTone === 'good' ? 'text-status-success' : deltaTone === 'bad' ? 'text-sev-critical' : 'text-text-muted'

  return (
    <div className="bg-surface-2 border border-surface-border rounded-md p-4 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xxs font-semibold uppercase tracking-widest text-text-muted truncate">{label}</span>
        {icon && <span className="text-text-muted shrink-0">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-data font-bold text-[26px] leading-none tabular ${accentClass}`}>{value}</span>
        {unit && <span className="text-text-muted text-sm font-medium">{unit}</span>}
      </div>
      {(delta || footnote) && (
        <div className="flex items-center gap-1.5 text-xs">
          {delta && (
            <span className={`inline-flex items-center gap-0.5 font-medium font-data ${toneCls}`}>
              {deltaDirection === 'up' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {delta}
            </span>
          )}
          {deltaLabel && <span className="text-text-muted">{deltaLabel}</span>}
          {footnote && <span className="text-text-muted">{footnote}</span>}
        </div>
      )}
    </div>
  )
}
