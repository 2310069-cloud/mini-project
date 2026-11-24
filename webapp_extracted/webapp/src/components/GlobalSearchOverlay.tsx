import React, { useEffect, useMemo, useState } from 'react'
import { Search, ArrowRight, Activity, ShieldAlert, FolderOpen, Server, Crosshair, ShieldCheck, X } from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { SeverityBadge } from './ui/Badge'

interface SearchResult {
  category: string
  icon: React.ReactNode
  id: string
  title: string
  subtitle: string
  page: string
  severity?: any
}

export function GlobalSearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const { securityEvents, detections, incidents, hosts, responseActions, navigateTo } = useSoc()

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const out: SearchResult[] = []

    // Security events
    for (const e of securityEvents) {
      if (
        e.id.toLowerCase().includes(q) ||
        e.sourceIp.includes(q) ||
        e.host.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.rule.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Security Events',
          icon: <Activity size={14} />,
          id: e.id,
          title: `${e.id} — ${e.eventType}`,
          subtitle: `${e.host} • ${e.sourceIp} • ${e.user}`,
          page: 'events',
          severity: e.severity,
        })
      }
      if (out.filter((r) => r.category === 'Security Events').length >= 4) break
    }

    // Threat Detections
    for (const d of detections) {
      if (
        d.id.toLowerCase().includes(q) ||
        d.detection_type.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.sourceIp.includes(q) ||
        d.targetHost.toLowerCase().includes(q) ||
        d.eventId.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Threat Detections',
          icon: <ShieldAlert size={14} />,
          id: d.id,
          title: `${d.id} — ${d.title}`,
          subtitle: `${d.detection_type} • ${d.sourceIp} → ${d.targetHost}`,
          page: 'detection',
          severity: d.severity,
        })
      }
      if (out.filter((r) => r.category === 'Threat Detections').length >= 4) break
    }

    // Incidents
    for (const i of incidents) {
      if (
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.sourceIp.includes(q) ||
        i.targetHost.toLowerCase().includes(q) ||
        i.mitreId.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Incidents',
          icon: <FolderOpen size={14} />,
          id: i.id,
          title: `${i.id} — ${i.title}`,
          subtitle: `${i.targetHost} • ${i.mitreId} • Risk ${i.riskScore}`,
          page: 'incidents',
          severity: i.severity,
        })
      }
      if (out.filter((r) => r.category === 'Incidents').length >= 4) break
    }

    // Response Actions
    for (const r of responseActions) {
      if (
        r.response_id.toLowerCase().includes(q) ||
        r.action_type.toLowerCase().includes(q) ||
        r.target_ip.includes(q) ||
        r.status.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Response Actions',
          icon: <ShieldCheck size={14} />,
          id: r.response_id,
          title: `${r.response_id} — ${r.action_type}`,
          subtitle: `Target: ${r.target_ip} • Status: ${r.status}`,
          page: 'responses',
        })
      }
      if (out.filter((r) => r.category === 'Response Actions').length >= 4) break
    }

    // Hosts
    for (const h of hosts) {
      if (h.name.toLowerCase().includes(q) || h.ip.includes(q) || (h.os || '').toLowerCase().includes(q)) {
        out.push({
          category: 'Hosts',
          icon: <Server size={14} />,
          id: h.id,
          title: h.name,
          subtitle: `${h.ip} • ${h.role} • Risk ${h.riskScore}`,
          page: 'hosts',
        })
      }
    }

    // MITRE
    if ('t1110'.includes(q) || 'brute force'.includes(q) || 'credential access'.includes(q)) {
      out.push({
        category: 'MITRE ATT&CK',
        icon: <Crosshair size={14} />,
        id: 'T1110',
        title: 'T1110 — Brute Force (Password Guessing)',
        subtitle: `Credential Access • ${detections.length} detections confirmed`,
        page: 'mitre',
      })
    }

    return out.slice(0, 30)
  }, [query, securityEvents, detections, incidents, responseActions, hosts])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    for (const r of results) {
      if (!map.has(r.category)) map.set(r.category, [])
      map.get(r.category)!.push(r)
    }
    return map
  }, [results])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface-2 border border-surface-borderLight rounded-md shadow-panel overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <Search size={17} className="text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search IP, host, user, incident ID, detection ID, or response..."
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
          />
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {!query.trim() && (
            <div className="p-6">
              <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2.5">
                Quick Search Examples
              </div>
              <div className="flex flex-wrap gap-2">
                {['192.168.1.50', 'SOC-Test-Server', 'admin', 'T1110', 'BRUTE_FORCE', 'BLOCK_IP'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="font-data text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-secondary hover:text-text-primary hover:border-accent/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No results for "<span className="font-data">{query}</span>"
            </div>
          )}

          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category} className="border-b border-surface-border/60 last:border-b-0">
              <div className="px-4 pt-3 pb-1.5 text-xxs font-semibold uppercase tracking-widest text-text-muted">
                {category}
              </div>
              {items.map((r) => (
                <button
                  key={r.category + r.id}
                  onClick={() => {
                    navigateTo(r.page, { id: r.id })
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] text-left group"
                >
                  <span className="text-text-muted shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-text-primary font-medium truncate">{r.title}</div>
                    <div className="text-[11.5px] text-text-muted font-data truncate">{r.subtitle}</div>
                  </div>
                  {r.severity && <SeverityBadge severity={r.severity} size="sm" />}
                  <ArrowRight size={13} className="text-text-muted opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
