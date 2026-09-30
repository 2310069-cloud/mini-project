import type { Severity } from '../types'

interface SeverityStyle {
  label: string
  text: string
  bg: string
  border: string
  dot: string
  fill: string // for chart fills
}

export const SEVERITY_STYLES: Record<Severity, SeverityStyle> = {
  CRITICAL: {
    label: 'Critical',
    text: 'text-sev-critical',
    bg: 'bg-sev-criticalBg',
    border: 'border-sev-critical',
    dot: 'bg-sev-critical',
    fill: '#e5484d',
  },
  HIGH: {
    label: 'High',
    text: 'text-sev-high',
    bg: 'bg-sev-highBg',
    border: 'border-sev-high',
    dot: 'bg-sev-high',
    fill: '#f0883e',
  },
  MEDIUM: {
    label: 'Medium',
    text: 'text-sev-medium',
    bg: 'bg-sev-mediumBg',
    border: 'border-sev-medium',
    dot: 'bg-sev-medium',
    fill: '#e8b339',
  },
  LOW: {
    label: 'Low',
    text: 'text-sev-low',
    bg: 'bg-sev-lowBg',
    border: 'border-sev-low',
    dot: 'bg-sev-low',
    fill: '#4c9aff',
  },
  INFO: {
    label: 'Info',
    text: 'text-sev-info',
    bg: 'bg-sev-infoBg',
    border: 'border-sev-info',
    dot: 'bg-sev-info',
    fill: '#8b96a5',
  },
}

export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

export function riskColor(risk: number): string {
  if (risk >= 80) return 'text-sev-critical'
  if (risk >= 60) return 'text-sev-high'
  if (risk >= 35) return 'text-sev-medium'
  return 'text-sev-low'
}

export function riskBarColor(risk: number): string {
  if (risk >= 80) return 'bg-sev-critical'
  if (risk >= 60) return 'bg-sev-high'
  if (risk >= 35) return 'bg-sev-medium'
  return 'bg-sev-low'
}

export function statusStyle(status: string): { text: string; bg: string } {
  switch (status) {
    case 'Open':
    case 'New':
      return { text: 'text-sev-high', bg: 'bg-sev-highBg' }
    case 'Investigating':
      return { text: 'text-sev-medium', bg: 'bg-sev-mediumBg' }
    case 'Contained':
      return { text: 'text-accent', bg: 'bg-accent/10' }
    case 'Resolved':
    case 'Closed':
    case 'Completed':
      return { text: 'text-status-success', bg: 'bg-status-successBg' }
    case 'Suppressed':
    case 'False Positive':
      return { text: 'text-text-muted', bg: 'bg-white/5' }
    case 'Pending':
    case 'Executing':
      return { text: 'text-sev-low', bg: 'bg-sev-lowBg' }
    case 'Failed':
      return { text: 'text-sev-critical', bg: 'bg-sev-criticalBg' }
    default:
      return { text: 'text-text-secondary', bg: 'bg-white/5' }
  }
}
