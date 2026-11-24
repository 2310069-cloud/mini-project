import React from 'react'
import {
  Database, Combine, ShieldHalf, Workflow, GitMerge, Gauge, BrainCircuit, Siren, ArrowDown,
} from 'lucide-react'
import { Card, CardHeader } from './ui/Card'

const STAGES = [
  { label: 'Log Sources', sub: 'Windows, Linux, Firewall, EDR', icon: Database },
  { label: 'Log Collector', sub: 'Agent-based & syslog ingestion', icon: Combine },
  { label: 'SIEM / Wazuh', sub: 'Centralized event aggregation', icon: ShieldHalf },
  { label: 'Event Normalization', sub: 'Schema mapping & enrichment', icon: Workflow },
  { label: 'Rule-Based Detection', sub: 'Signature & threshold rules', icon: GitMerge },
  { label: 'Correlation Engine', sub: 'Multi-event pattern linking', icon: Combine },
  { label: 'Risk Scoring', sub: 'Weighted severity calculation', icon: Gauge },
  { label: 'AI Security Analyst', sub: 'Offline local intelligence', icon: BrainCircuit },
  { label: 'Incident Response', sub: 'Automated & manual actions', icon: Siren },
]

export function ArchitectureDiagram() {
  return (
    <Card>
      <CardHeader
        title="SOC Architecture"
        subtitle="End-to-end detection & response pipeline"
      />
      <div className="bg-surface-1 bg-grid rounded-sm border border-surface-border p-4">
        <div className="flex flex-col items-stretch">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            const isAI = stage.label === 'AI Security Analyst'
            return (
              <React.Fragment key={stage.label}>
                <div
                  className={`flex items-center gap-3 rounded-sm border px-3.5 py-2.5 ${
                    isAI
                      ? 'bg-accent/10 border-accent/40'
                      : 'bg-surface-3 border-surface-borderLight'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0 ${isAI ? 'bg-accent/20 text-accent' : 'bg-surface-4 text-text-secondary'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-[13px] font-semibold ${isAI ? 'text-accent' : 'text-text-primary'}`}>{stage.label}</div>
                    <div className="text-[11px] text-text-muted">{stage.sub}</div>
                  </div>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown size={14} className="text-text-muted/50" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
