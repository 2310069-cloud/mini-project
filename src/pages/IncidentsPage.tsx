import React, { useMemo, useState } from 'react'
import {
  FolderOpen, Clock, Server, Fingerprint, FileSearch, Crosshair, BrainCircuit,
  Zap, ChevronRight, ShieldBan, KeyRound, RefreshCcw, Search as SearchIcon, UserCheck,
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { SEVERITY_ORDER } from '../lib/severity'
import { SeverityBadge, StatusBadge, Pill } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RiskGaugeRing } from '../components/ui/Risk'
import { formatDateTime, formatTime } from '../lib/format'
import type { Incident, IncidentStatus } from '../types'
import { AI_ANALYSES } from '../data/aiAnalyst'

const SECTIONS = [
  { id: 'summary', label: 'Summary', icon: FileSearch },
  { id: 'assets', label: 'Affected Assets', icon: Server },
  { id: 'indicators', label: 'Indicators', icon: Fingerprint },
  { id: 'evidence', label: 'Evidence', icon: SearchIcon },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'mitre', label: 'MITRE Mapping', icon: Crosshair },
  { id: 'ai', label: 'AI Analysis', icon: BrainCircuit },
  { id: 'response', label: 'Response Actions', icon: Zap },
] as const

export function IncidentsPage() {
  const { incidents, updateIncident, currentParams, responseActions, executeAction, navigateTo } = useSoc()
  const [severity, setSeverity] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(currentParams.id ?? incidents[0]?.id ?? null)
  const [activeSection, setActiveSection] = useState<string>('summary')

  const statuses: IncidentStatus[] = ['New', 'Investigating', 'Contained', 'Resolved', 'Closed']

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (severity !== 'All' && i.severity !== severity) return false
      if (status !== 'All' && i.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!i.id.toLowerCase().includes(q) && !i.title.toLowerCase().includes(q) && !i.targetHost.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [incidents, severity, status, search])

  const selected = incidents.find((i) => i.id === selectedId) ?? null

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <FolderOpen size={20} className="text-accent" /> Incident Management
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">Investigation workspace for confirmed security incidents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Incident list */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <SelectFilter label="Severity" value={severity} onChange={setSeverity} options={SEVERITY_ORDER} />
            <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search incidents..." />

          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filtered.map((inc) => {
              const active = inc.id === selectedId
              return (
                <button
                  key={inc.id}
                  onClick={() => { setSelectedId(inc.id); setActiveSection('summary') }}
                  className={`w-full text-left rounded-md border p-3.5 transition-colors ${
                    active ? 'bg-accent/10 border-accent/40' : 'bg-surface-2 border-surface-border hover:border-surface-borderLight'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-data text-[11px] text-text-muted">{inc.id}</span>
                    <SeverityBadge severity={inc.severity} size="sm" />
                  </div>
                  <p className="text-[13px] font-semibold text-text-primary leading-snug line-clamp-2">{inc.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-data text-[11px] text-text-muted">{inc.mitreId}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center text-text-muted text-sm py-8">No incidents match filters</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selected ? (
            <IncidentDetail
              incident={selected}
              onUpdate={(patch) => updateIncident(selected.id, patch)}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              responseActions={responseActions.filter((r) => r.incidentId === selected.id)}
              executeAction={executeAction}
              onGoToAI={() => navigateTo('ai', { id: selected.id })}
            />
          ) : (
            <Card className="h-64 flex items-center justify-center text-text-muted text-sm">
              Select an incident to view details
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function IncidentDetail({
  incident, onUpdate, activeSection, setActiveSection, responseActions, executeAction, onGoToAI,
}: {
  incident: Incident
  onUpdate: (patch: Partial<Incident>) => void
  activeSection: string
  setActiveSection: (s: string) => void
  responseActions: any[]
  executeAction: (id: string) => void
  onGoToAI: () => void
}) {
  const ai = AI_ANALYSES[incident.id]

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-data text-[12px] text-text-muted">{incident.id}</span>
              <SeverityBadge severity={incident.severity} size="sm" />
              <StatusBadge status={incident.status} />
            </div>
            <h2 className="text-lg font-bold text-text-primary leading-snug">{incident.title}</h2>
            <div className="flex items-center gap-3 mt-2 text-[12px] text-text-secondary flex-wrap">
              <span className="inline-flex items-center gap-1"><Crosshair size={12} /> {incident.mitreId} · {incident.mitreName}</span>
              <span className="inline-flex items-center gap-1"><Server size={12} className="font-data" /> {incident.targetHost}</span>
              <span className="inline-flex items-center gap-1"><UserCheck size={12} /> {incident.owner}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <RiskGaugeRing score={incident.riskScore} size={80} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-border">
          <select
            value={incident.status}
            onChange={(e) => onUpdate({ status: e.target.value as IncidentStatus })}
            className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary focus-ring"
          >
            {(['New', 'Investigating', 'Contained', 'Resolved', 'Closed'] as IncidentStatus[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="primary" icon={<BrainCircuit size={14} />} onClick={onGoToAI}>
            Open in AI Analyst
          </Button>
        </div>
      </Card>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const active = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-medium rounded-sm whitespace-nowrap transition-colors ${
                active ? 'bg-accent/12 text-accent' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <Icon size={14} /> {s.label}
            </button>
          )
        })}
      </div>

      {/* Section content */}
      <Card>
        {activeSection === 'summary' && (
          <div>
            <CardHeader title="Incident Summary" icon={<FileSearch size={16} />} />
            <p className="text-[13.5px] text-text-secondary leading-relaxed">{incident.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <MiniStat label="Created" value={formatTime(incident.createdAt)} />
              <MiniStat label="Updated" value={formatTime(incident.updatedAt)} />
              <MiniStat label="Related Alerts" value={String(incident.relatedAlertIds.length)} />
              <MiniStat label="AI Analyzed" value={incident.aiAnalyzed ? 'Yes' : 'Pending'} />
            </div>
          </div>
        )}

        {activeSection === 'assets' && (
          <div>
            <CardHeader title="Affected Assets" icon={<Server size={16} />} />
            <div className="space-y-2">
              {incident.affectedAssets.map((asset) => (
                <div key={asset} className="flex items-center gap-2.5 bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5">
                  <Server size={14} className="text-text-muted" />
                  <span className="font-data text-[13px] text-text-primary">{asset}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'indicators' && (
          <div>
            <CardHeader title="Indicators" icon={<Fingerprint size={16} />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {incident.indicators.map((ind, idx) => (
                <div key={idx} className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5">
                  <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">{ind.type}</div>
                  <div className="font-data text-[13px] text-text-primary">{ind.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'evidence' && (
          <div>
            <CardHeader title="Evidence" icon={<SearchIcon size={16} />} />
            <div className="space-y-2.5">
              {incident.evidence.map((ev, idx) => (
                <div key={idx} className="flex gap-3 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-3">
                  <div className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold font-data shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-text-primary">{ev.label}</div>
                    <div className="text-[12.5px] text-text-secondary mt-0.5">{ev.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'timeline' && (
          <div>
            <CardHeader title="Timeline" icon={<Clock size={16} />} />
            <div className="space-y-0">
              {incident.timeline.map((t, idx) => (
                <div key={idx} className="flex gap-3.5 relative pb-5 last:pb-0">
                  {idx < incident.timeline.length - 1 && (
                    <div className="absolute left-[7px] top-4 bottom-0 w-px bg-surface-border" />
                  )}
                  <div className="h-3.5 w-3.5 rounded-full bg-accent shrink-0 mt-1 ring-4 ring-accent/15 z-10" />
                  <div className="flex-1 -mt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-data text-[11.5px] text-text-muted">{formatTime(t.time)}</span>
                      <span className="text-[13px] font-semibold text-text-primary">{t.label}</span>
                      {t.actor && <Pill tone={t.actor === 'AI Analyst' ? 'accent' : 'default'}>{t.actor}</Pill>}
                    </div>
                    {t.detail && <p className="text-[12.5px] text-text-secondary mt-1">{t.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'mitre' && (
          <div>
            <CardHeader title="MITRE ATT&CK Mapping" icon={<Crosshair size={16} />} />
            <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-data text-lg font-bold text-accent">{incident.mitreId}</span>
                <Pill tone="accent">Primary Technique</Pill>
              </div>
              <div className="text-[14px] font-semibold text-text-primary mb-1">{incident.mitreName}</div>
              <p className="text-[12.5px] text-text-secondary leading-relaxed">
                This incident's observed behavior matches the {incident.mitreName} technique in the MITRE ATT&CK framework. View the full technique profile for tactic context, detection coverage, and recommended mitigations.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'ai' && (
          <div>
            <CardHeader title="AI Analysis" icon={<BrainCircuit size={16} />} />
            {ai ? (
              <div className="space-y-4">
                <div className="bg-accent/5 border border-accent/25 rounded-sm p-4">
                  <p className="text-[13px] text-text-secondary leading-relaxed">{ai.narrative}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Threat Type" value={ai.threatType} />
                  <MiniStat label="Confidence" value={`${ai.confidence}%`} />
                  <MiniStat label="Attack Pattern" value={ai.attackPattern} />
                  <MiniStat label="Risk Score" value={`${ai.risk}/100`} />
                </div>
                <div>
                  <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">Recommended Actions</div>
                  <ol className="space-y-1.5">
                    {ai.recommendedActions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] text-text-secondary">
                        <span className="font-data text-accent">{i + 1}.</span> {a}
                      </li>
                    ))}
                  </ol>
                </div>
                <Button variant="primary" icon={<BrainCircuit size={14} />} onClick={onGoToAI}>
                  Open Full Analysis in AI Analyst
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm mb-3">This incident has not been analyzed yet.</p>
                <Button variant="primary" icon={<BrainCircuit size={14} />} onClick={onGoToAI}>
                  Run AI Analysis
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'response' && (
          <div>
            <CardHeader title="Response Actions" icon={<Zap size={16} />} />
            {responseActions.length > 0 ? (
              <div className="space-y-2">
                {responseActions.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5">
                    <ActionIcon action={r.action} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-text-primary">{r.action}</div>
                      <div className="text-[11.5px] text-text-muted font-data truncate">{r.target}</div>
                    </div>
                    <StatusBadge status={r.status} />
                    {r.status === 'Pending' && (
                      <Button size="sm" variant="primary" onClick={() => executeAction(r.id)}>Execute</Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm text-center py-6">No response actions logged for this incident.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function ActionIcon({ action }: { action: string }) {
  const map: Record<string, any> = {
    'Block IP': ShieldBan,
    'Disable Account': KeyRound,
    'Force Password Reset': RefreshCcw,
  }
  const Icon = map[action] ?? Zap
  return (
    <div className="h-8 w-8 rounded-sm bg-surface-4 flex items-center justify-center text-text-secondary shrink-0">
      <Icon size={14} />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5">
      <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">{label}</div>
      <div className="text-[13px] font-semibold text-text-primary font-data">{value}</div>
    </div>
  )
}
