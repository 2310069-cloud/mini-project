import React, { useMemo, useState } from 'react'
import { Activity, Info } from 'lucide-react'
import { SECURITY_EVENTS } from '../data/generator'
import { SEVERITY_ORDER } from '../lib/severity'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { formatDateTime, formatTime } from '../lib/format'
import type { SecurityEvent } from '../types'
import { useSoc } from '../context/SocContext'

export function EventsPage() {
  const { currentParams } = useSoc()
  const [severity, setSeverity] = useState('All')
  const [status, setStatus] = useState('All')
  const [source, setSource] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SecurityEvent | null>(
    SECURITY_EVENTS.find((e) => e.id === currentParams.id) ?? null
  )
  const [page, setPage] = useState(0)
  const pageSize = 50

  const sources = useMemo(() => Array.from(new Set(SECURITY_EVENTS.map((e) => e.source))), [])
  const statuses = useMemo(() => Array.from(new Set(SECURITY_EVENTS.map((e) => e.status))), [])

  const filtered = useMemo(() => {
    return SECURITY_EVENTS.filter((e) => {
      if (severity !== 'All' && e.severity !== severity) return false
      if (status !== 'All' && e.status !== status) return false
      if (source !== 'All' && e.source !== source) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.sourceIp.includes(q) && !e.host.toLowerCase().includes(q) &&
          !e.user.toLowerCase().includes(q) && !e.eventType.toLowerCase().includes(q) &&
          !e.rule.toLowerCase().includes(q) && !e.destination.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [severity, status, source, search])

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Activity size={20} className="text-accent" /> Security Events
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Live event stream from all ingested log sources · {filtered.length.toLocaleString()} matching events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter label="Severity" value={severity} onChange={(v) => { setSeverity(v); setPage(0) }} options={SEVERITY_ORDER} />
        <SelectFilter label="Status" value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={statuses} />
        <SelectFilter label="Source" value={source} onChange={(v) => { setSource(v); setPage(0) }} options={sources} />
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search IP, host, user, rule..." />
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                <th className="text-left font-semibold px-4 py-2.5">Timestamp</th>
                <th className="text-left font-semibold px-2 py-2.5">Severity</th>
                <th className="text-left font-semibold px-2 py-2.5">Source</th>
                <th className="text-left font-semibold px-2 py-2.5">Event Type</th>
                <th className="text-left font-semibold px-2 py-2.5">Source IP</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden lg:table-cell">Destination</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">User</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">Host</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden xl:table-cell">Rule</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`tr-hover border-b border-surface-border/60 cursor-pointer border-l-sev ${
                    e.severity === 'CRITICAL' ? 'border-l-sev-critical' :
                    e.severity === 'HIGH' ? 'border-l-sev-high' :
                    e.severity === 'MEDIUM' ? 'border-l-sev-medium' :
                    e.severity === 'LOW' ? 'border-l-sev-low' : 'border-l-transparent'
                  }`}
                >
                  <td className="px-4 py-2 font-data text-text-secondary whitespace-nowrap">{formatTime(e.timestamp)}</td>
                  <td className="px-2 py-2"><SeverityBadge severity={e.severity} size="sm" /></td>
                  <td className="px-2 py-2 text-text-secondary whitespace-nowrap">{e.source}</td>
                  <td className="px-2 py-2 text-text-primary font-medium whitespace-nowrap">{e.eventType}</td>
                  <td className="px-2 py-2 font-data text-text-secondary whitespace-nowrap">{e.sourceIp}</td>
                  <td className="px-2 py-2 font-data text-text-secondary hidden lg:table-cell whitespace-nowrap">{e.destination}</td>
                  <td className="px-2 py-2 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">{e.user}</td>
                  <td className="px-2 py-2 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">{e.host}</td>
                  <td className="px-2 py-2 font-data text-text-muted hidden xl:table-cell whitespace-nowrap">{e.rule}</td>
                  <td className="px-4 py-2"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-border">
          <span className="text-[11.5px] text-text-muted">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-secondary disabled:opacity-30 hover:text-text-primary"
            >
              Previous
            </button>
            <span className="text-[11.5px] text-text-muted font-data px-1">{page + 1} / {totalPages}</span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-secondary disabled:opacity-30 hover:text-text-primary"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Event Detail">
        {selected && <EventDetail event={selected} />}
      </Drawer>
    </div>
  )
}

function EventDetail({ event }: { event: SecurityEvent }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <SeverityBadge severity={event.severity} />
        <StatusBadge status={event.status} />
      </div>
      <h2 className="text-lg font-bold text-text-primary mt-2">{event.eventType}</h2>
      <p className="text-[12.5px] text-text-muted font-data mt-1">{formatDateTime(event.timestamp)}</p>

      {event.description && (
        <div className="mt-4 bg-surface-3 border border-surface-borderLight rounded-sm p-3.5 flex gap-2.5">
          <Info size={15} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[13px] text-text-secondary leading-relaxed">{event.description}</p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="Source" value={event.source} />
        <Field label="Detection Rule" value={event.rule} mono />
        <Field label="Source IP" value={event.sourceIp} mono />
        <Field label="Destination" value={event.destination} mono />
        <Field label="User" value={event.user} mono />
        <Field label="Host" value={event.host} mono />
        {event.eventId && <Field label="Event ID" value={event.eventId} mono />}
        <Field label="Status" value={event.status} />
      </div>

      <div className="mt-6 pt-4 border-t border-surface-border">
        <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">Raw Log Fragment</div>
        <pre className="bg-surface-0 border border-surface-border rounded-sm p-3 text-[11px] font-data text-text-secondary overflow-x-auto whitespace-pre-wrap">
{`[${event.timestamp}] host=${event.host} src=${event.sourceIp} dst=${event.destination}
user=${event.user} rule=${event.rule} severity=${event.severity}
event_type="${event.eventType}"${event.eventId ? ` event_id=${event.eventId}` : ''}
message="${event.description ?? event.eventType}"`}
        </pre>
      </div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-1">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? 'font-data' : ''}`}>{value}</div>
    </div>
  )
}
