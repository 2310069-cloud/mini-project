import React from 'react'
import type { TimeRange } from '../../types'

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '15m', label: 'Last 15 min' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
]

export function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  return (
    <div className="inline-flex items-center bg-surface-3 border border-surface-borderLight rounded-sm p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-[12px] px-2.5 py-1.5 rounded-sm font-medium transition-colors whitespace-nowrap ${
            value === opt.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
