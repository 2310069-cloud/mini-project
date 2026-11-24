import React, { useMemo, useState } from 'react'
import { Activity, Info, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { formatDateTime, formatTime } from '../lib/format'
import type { SecurityEvent } from '../types'
import { useSoc } from '../context/SocContext'

export function EventsPage() {
  const { currentParams, securityEvents, backendConnected, navigateTo } = useSoc()
  const [eventType, setEventType] = useState('All')
  const [sourceIp, setSourceIp] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SecurityEvent | null>(
    securityEvents.find((e) => e.id === currentParams.id) ?? null
  )
  const [page, setPage] = useState(0)
  const pageSize = 50

  const eventTypes = useMemo(
    () => Array.from(new Set(securityEvents.map((e) => e.eventType))),
    [securityEvents]
  )
  const sourceIps = useMemo(
    () => Array.from(new Set(securityEvents.map((e) => e.sourceIp).filter((ip) => ip && ip !== 'N/A'))),
    [securityEvents]
  )

  const filtered = useMemo(() => {
    return securityEvents.filter((e) => {
      if (eventType !== 'All' && e.eventType !== eventType) return false
      if (sourceIp !== 'All' && e.sourceIp !== sourceIp) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.id.includes(q) &&
          !e.sourceIp.includes(q) &&
          !e.host.toLowerCase().includes(q) &&
          !e.user.toLowerCase().includes(q) &&
          !e.eventType.toLowerCase().includes(q) &&
          !(e.description || '').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [securityEvents, eventType, sourceIp, search])

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Activity size={20} className="text-accent" /> Security Events
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Real security event stream from FastAPI /events endpoint · {filtered.length} matching events
          {backendConnected && (
            <span className="ml-2 text-status-success font-medium">(FastAPI live sync)</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter
          label="Event Type"
          value={eventType}
          onChange={(v) => {
            setEventType(v)
            setPage(0)
          }}
          options={eventTypes}
        />
        <SelectFilter
          label="Source IP"
          value={sourceIp}
          onChange={(v) => {
            setSourceIp(v)
            setPage(0)
          }}
          options={sourceIps}
        />
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
          placeholder="Search event ID, source IP, user, message..."
        />
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                <th className="text-left font-semibold px-4 py-2.5">ID</th>
                <th className="text-left font-semibold px-2 py-2.5">Timestamp</th>
                <th className="text-left font-semibold px-2 py-2.5">Event Type</th>
                <th className="text-left font-semibold px-2 py-2.5">Source IP</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">Account</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">Host</th>
                <th className="text-left font-semibold px-2 py-2.5">Message</th>
                <th className="text-left font-semibold px-4 py-2.5">Detection</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`tr-hover border-b border-surface-border/60 cursor-pointer ${
                    e.detectionId ? 'bg-sev-high/5' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-data text-text-muted whitespace-nowrap">#{e.id}</td>
                  <td className="px-2 py-2 font-data text-text-secondary whitespace-nowrap">
                    {formatTime(e.timestamp)}
                  </td>
                  <td className="px-2 py-2 text-text-primary font-medium whitespace-nowrap">
                    <span className="font-data bg-surface-3 border border-surface-borderLight px-1.5 py-0.5 rounded text-[11.5px]">
                      {e.eventType}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-data text-text-primary whitespace-nowrap">{e.sourceIp}</td>
                  <td className="px-2 py-2 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">
                    {e.user}
                  </td>
                  <td className="px-2 py-2 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">
                    {e.host}
                  </td>
                  <td className="px-2 py-2 text-text-secondary max-w-xs truncate text-[12px]">
                    {e.description || e.eventType}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {e.detectionId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sev-high bg-sev-highBg px-2 py-0.5 rounded border border-sev-high/30">
                        <ShieldAlert size={11} /> DET-{String(e.detectionId).padStart(3, '0')}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[11px]">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-muted text-xs">
                    No security events match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-surface-border">
          <span className="text-[11.5px] text-text-muted">
            Showing {filtered.length > 0 ? page * pageSize + 1 : 0}-
            {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length} events
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-secondary disabled:opacity-30 hover:text-text-primary"
            >
              Previous
            </button>
            <span className="text-[11.5px] text-text-muted font-data px-1">
              {page + 1} / {totalPages}
            </span>
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

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Security Event Detail">
        {selected && (
          <EventDetail
            event={selected}
            onGoToDetection={(detId) => {
              setSelected(null)
              navigateTo('detection', { id: String(detId) })
            }}
          />
        )}
      </Drawer>
    </div>
  )
}

function EventDetail({
  event,
  onGoToDetection,
}: {
  event: SecurityEvent
  onGoToDetection: (detId: number) => void
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-data text-xs text-text-muted font-semibold">Event #{event.id}</span>
        <span className="font-data bg-surface-3 px-2 py-0.5 rounded text-xs text-text-primary border border-surface-borderLight">
          {event.eventType}
        </span>
      </div>
      <h2 className="text-lg font-bold text-text-primary mt-2">{event.eventType}</h2>
      <p className="text-[12.5px] text-text-muted font-data mt-1">{formatDateTime(event.timestamp)}</p>

      {event.description && (
        <div className="mt-4 bg-surface-3 border border-surface-borderLight rounded-sm p-3.5 flex gap-2.5">
          <Info size={15} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[13px] text-text-secondary leading-relaxed">{event.description}</p>
        </div>
      )}

      {event.detectionId && (
        <div className="mt-4 p-3.5 bg-sev-highBg border border-sev-high/40 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-sev-high text-[13px] font-semibold">
            <ShieldAlert size={16} />
            <span>Triggered Brute-Force Detection #DET-{String(event.detectionId).padStart(3, '0')}</span>
          </div>
          <button
            onClick={() => onGoToDetection(event.detectionId!)}
            className="text-[12px] bg-sev-high hover:bg-sev-high/85 text-white font-semibold px-2.5 py-1 rounded inline-flex items-center gap-1"
          >
            View Detection <ArrowRight size={12} />
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="Event ID (Primary Key)" value={event.id} mono />
        <Field label="Source IP" value={event.sourceIp} mono />
        <Field label="Target Host" value={event.host} mono />
        <Field label="Target Account" value={event.user} mono />
        <Field label="Event Code" value={event.eventId || 'AUTH_FAIL'} mono />
        <Field label="Destination" value={event.destination} mono />
      </div>

      <div className="mt-6 pt-4 border-t border-surface-border">
        <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">
          Structured Telemetry Record
        </div>
        <pre className="bg-surface-0 border border-surface-border rounded-sm p-3 text-[11px] font-data text-text-secondary overflow-x-auto whitespace-pre-wrap">
{`{
  "event_id": ${event.id},
  "event_time": "${event.timestamp}",
  "event_type": "${event.eventType}",
  "event_code": "${event.eventId || 'AUTH_FAIL'}",
  "source_ip": "${event.sourceIp}",
  "message": "${event.description || ''}",
  "host": "${event.host}",
  "account": "${event.user}"
}`}
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
