import React from 'react'

export function Card({
  children,
  className = '',
  padded = true,
}: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`bg-surface-2 border border-surface-border rounded-md ${padded ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: { title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <div className="text-text-secondary mt-0.5 shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary tracking-tight truncate">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">
      {children}
    </div>
  )
}
