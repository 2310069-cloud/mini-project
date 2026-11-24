import React from 'react'
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react'
import { useSoc } from '../context/SocContext'
import type { Incident } from '../types'

export function CriticalIncidentBanner({ incident }: { incident: Incident }) {
  const { navigateTo } = useSoc()

  const isCritical = incident.severity === 'CRITICAL'
  const isHigh = incident.severity === 'HIGH'

  const toneClass = isCritical
    ? 'bg-sev-criticalBg border-sev-critical/40 text-sev-critical'
    : 'bg-sev-highBg border-sev-high/40 text-sev-high'
  const barClass = isCritical ? 'bg-sev-critical' : 'bg-sev-high'
  const buttonClass = isCritical
    ? 'bg-sev-critical hover:bg-sev-critical/85'
    : 'bg-sev-high hover:bg-sev-high/85 text-white'

  const label = isCritical ? 'Critical Incident' : isHigh ? 'High-Severity Incident' : `${incident.severity} Severity Incident`

  return (
    <div className={`relative overflow-hidden border rounded-md ${toneClass}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`} />
      <div className="flex items-center gap-4 px-4 py-3.5 pl-5">
        <div
          className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-sev-critical/20 text-sev-critical' : 'bg-sev-high/20 text-sev-high'
          }`}
        >
          {isCritical ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isCritical ? 'text-sev-critical' : 'text-sev-high'}`}>
              {label}
            </span>
            <span className="text-text-muted text-[11px] font-data">#{incident.id}</span>
            <span className="text-text-muted text-[11px] font-medium">· Assigned to: {incident.owner}</span>
          </div>
          <p className="text-[13.5px] text-text-primary font-medium mt-0.5 truncate">
            {incident.title} against <span className="font-data text-accent">{incident.targetHost}</span>
          </p>
          <p className="text-[12px] text-text-secondary mt-0.5 font-data">
            Source IP: {incident.sourceIp} · Risk {incident.riskScore}/100 · {incident.mitreId} ({incident.mitreName}) · Status: {incident.status}
          </p>
        </div>
        <button
          onClick={() => navigateTo('incidents', { id: incident.id })}
          className={`shrink-0 inline-flex items-center gap-1.5 text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-sm transition-colors ${buttonClass}`}
        >
          Investigate Incident
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
