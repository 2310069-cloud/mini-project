import React, { useEffect, useMemo, useState } from 'react'
import { Search, ArrowRight, Activity, ShieldAlert, FolderOpen, Server, Crosshair, X } from 'lucide-react'
import { SECURITY_EVENTS, ALERTS, INCIDENTS } from '../data/generator'
import { HOSTS } from '../data/hosts'
import { MITRE_TECHNIQUES } from '../data/mitre'
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
  const { navigateTo } = useSoc()

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

    for (const e of SECURITY_EVENTS) {
      if (
        e.sourceIp.includes(q) || e.host.toLowerCase().includes(q) || e.user.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) || e.rule.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Security Events', icon: <Activity size={14} />, id: e.id,
          title: e.eventType, subtitle: `${e.host} • ${e.sourceIp} • ${e.rule}`,
          page: 'events', severity: e.severity,
        })
      }
      if (out.filter((r) => r.category === 'Security Events').length >= 4) break
    }

    for (const a of ALERTS) {
      if (
        a.id.toLowerCase().includes(q) || a.sourceIp.includes(q) || a.rule.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q) || (a.user ?? '').toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Alerts', icon: <ShieldAlert size={14} />, id: a.id,
          title: `${a.id} — ${a.rule}`, subtitle: `${a.sourceIp} → ${a.target}`,
          page: 'alerts', severity: a.severity,
        })
      }
    }

    for (const i of INCIDENTS) {
      if (
        i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) ||
        i.sourceIp.includes(q) || i.targetHost.toLowerCase().includes(q) || i.mitreId.toLowerCase().includes(q)
      ) {
        out.push({
          category: 'Incidents', icon: <FolderOpen size={14} />, id: i.id,
          title: `${i.id} — ${i.title}`, subtitle: `${i.targetHost} • ${i.mitreId} • Risk ${i.riskScore}`,
          page: 'incidents', severity: i.severity,
        })
      }
    }

    for (const h of HOSTS) {
      if (h.hostname.toLowerCase().includes(q) || h.ip.includes(q) || h.os.toLowerCase().includes(q)) {
        out.push({
          category: 'Hosts', icon: <Server size={14} />, id: h.id,
          title: h.hostname, subtitle: `${h.ip} • ${h.os} • Risk ${h.risk}`,
          page: 'hosts',
        })
      }
    }

    for (const t of MITRE_TECHNIQUES) {
      if (t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.tactic.toLowerCase().includes(q)) {
        out.push({
          category: 'MITRE ATT&CK', icon: <Crosshair size={14} />, id: t.id,
          title: `${t.id} — ${t.name}`, subtitle: `${t.tactic} • ${t.detections} detections`,
          page: 'mitre',
        })
      }
    }

    return out.slice(0, 30)
  }, [query])

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
            placeholder="Search IP address, hostname, user, alert ID, MITRE technique..."
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
                Try searching
              </div>
              <div className="flex flex-wrap gap-2">
                {['185.220.101.42', 'WIN-DC01', 'administrator', 'T1110', 'AUTH-BRUTE-001'].map((s) => (
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
