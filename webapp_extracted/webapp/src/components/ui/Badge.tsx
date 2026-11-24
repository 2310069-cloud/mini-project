import React from 'react'
import type { Severity } from '../../types'
import { SEVERITY_STYLES, statusStyle } from '../../lib/severity'

export function SeverityBadge({ severity, size = 'md' }: { severity: Severity; size?: 'sm' | 'md' }) {
  const s = SEVERITY_STYLES[severity]
  const sizeCls = size === 'sm' ? 'text-xxs px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm font-semibold uppercase tracking-wide ${s.bg} ${s.text} ${sizeCls} border ${s.border}/30 font-data`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusStyle(status)
  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {status}
    </span>
  )
}

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  const tones: Record<string, string> = {
    default: 'bg-surface-3 text-text-secondary border-surface-border',
    accent: 'bg-accent/10 text-accent border-accent/30',
    muted: 'bg-white/5 text-text-muted border-surface-border',
  }
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}
