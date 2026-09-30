import React from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useSoc } from '../context/SocContext'
import type { Incident } from '../types'

export function CriticalIncidentBanner({ incident }: { incident: Incident }) {
  const { navigateTo } = useSoc()

  return (
    <div className="relative overflow-hidden bg-sev-criticalBg border border-sev-critical/40 rounded-md">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-sev-critical" />
      <div className="flex items-center gap-4 px-4 py-3.5 pl-5">
        <div className="h-9 w-9 rounded-sm bg-sev-critical/20 flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-sev-critical" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sev-critical">
              Critical Incident
            </span>
            <span className="text-text-muted text-[11px] font-data">{incident.id}</span>
          </div>
          <p className="text-[13.5px] text-text-primary font-medium mt-0.5 truncate">
            Brute-force activity detected against <span className="font-data">{incident.targetHost}</span> — {incident.title}
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5 font-data">
            Source {incident.sourceIp} · Risk {incident.riskScore}/100 · {incident.mitreId} {incident.mitreName} · Status: {incident.status}
          </p>
        </div>
        <button
          onClick={() => navigateTo('incidents', { id: incident.id })}
          className="shrink-0 inline-flex items-center gap-1.5 bg-sev-critical hover:bg-sev-critical/85 text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-sm transition-colors"
        >
          Investigate
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
