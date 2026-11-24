import React, { useMemo, useState } from 'react'
import {
  Radar,
  Crosshair,
  Hash,
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldBan,
  FolderOpen,
} from 'lucide-react'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { RiskBar, RiskScore } from '../components/ui/Risk'
import { formatDateTime, formatTime } from '../lib/format'
import type { DetectionItem } from '../types'
import { useSoc } from '../context/SocContext'

export function DetectionPage() {
  const { detections, backendConnected, navigateTo, currentParams } = useSoc()
  const [status, setStatus] = useState('All')
  const [sourceIp, setSourceIp] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DetectionItem | null>(
    detections.find((d) => String(d.detectionId) === currentParams.id || d.id === currentParams.id) ?? null
  )

  const statuses = useMemo(() => Array.from(new Set(detections.map((d) => d.status))), [detections])
  const sourceIps = useMemo(() => Array.from(new Set(detections.map((d) => d.sourceIp))), [detections])

  const filtered = useMemo(() => {
    return detections.filter((d) => {
      if (status !== 'All' && d.status !== status) return false
      if (sourceIp !== 'All' && d.sourceIp !== sourceIp) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !d.id.toLowerCase().includes(q) &&
          !String(d.detectionId).includes(q) &&
          !d.sourceIp.includes(q) &&
          !d.title.toLowerCase().includes(q) &&
          !d.description.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [detections, status, sourceIp, search])

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Radar size={20} className="text-accent" /> Threat Detection Engine
          </h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Confirmed security detections from FastAPI /detections endpoint · {detections.length} total detections
            {backendConnected && (
              <span className="ml-2 text-status-success font-medium">(FastAPI live sync)</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
        <SelectFilter label="Source IP" value={sourceIp} onChange={setSourceIp} options={sourceIps} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search detection ID, source IP, title..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((det) => (
          <Card
            key={det.id}
            className="hover:border-surface-borderLight transition-colors cursor-pointer"
          >
            <div onClick={() => setSelected(det)}>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-data text-[12px] font-bold text-text-primary bg-surface-3 border border-surface-borderLight rounded px-2 py-0.5">
                    {det.id}
                  </span>
                  <SeverityBadge severity={det.severity} size="sm" />
                </div>
                <span className="text-[11px] font-semibold font-data text-status-success bg-status-successBg px-2 py-0.5 rounded border border-status-success/30 flex items-center gap-1">
                  <CheckCircle2 size={12} /> {det.status}
                </span>
              </div>

              <h3 className="text-[14px] font-bold text-text-primary mb-1">{det.title}</h3>
              <p className="text-[12px] text-text-secondary leading-relaxed mb-3 line-clamp-2">
                {det.description}
              </p>

              <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-2.5 mb-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Target Host:</span>
                  <span className="font-data text-text-primary font-medium">{det.targetHost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Attacker Source IP:</span>
                  <span className="font-data text-text-primary font-bold">{det.sourceIp}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Associated Event ID:</span>
                  <span className="font-data text-text-secondary">#{det.eventId}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniInfo
                  icon={<Crosshair size={12} />}
                  label="MITRE"
                  value="T1110.001"
                />
                <MiniInfo
                  icon={<Clock size={12} />}
                  label="Detected At"
                  value={formatTime(det.timestamp)}
                />
                <MiniInfo
                  icon={<ShieldCheck size={12} />}
                  label="Verification"
                  value={det.verificationResult || 'STOPPED'}
                />
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 p-12 text-center text-text-muted text-sm border border-dashed border-surface-border rounded">
            No detection records match the current filters
          </div>
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Detection Details & Correlation">
        {selected && (
          <DetectionDetail
            detection={selected}
            onGoToEvent={() => {
              setSelected(null)
              navigateTo('events', { id: String(selected.eventId) })
            }}
            onGoToIncident={() => {
              if (selected.incidentId) {
                setSelected(null)
                navigateTo('incidents', { id: `INC-${String(selected.incidentId).padStart(3, '0')}` })
              }
            }}
            onGoToResponse={() => {
              setSelected(null)
              navigateTo('response')
            }}
          />
        )}
      </Drawer>
    </div>
  )
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-surface-3/60 rounded-sm px-2.5 py-2">
      <div className="flex items-center gap-1 text-text-muted mb-0.5">
        {icon}
        <span className="text-[9.5px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-[12px] font-data font-semibold text-text-primary truncate">{value}</div>
    </div>
  )
}

function DetectionDetail({
  detection,
  onGoToEvent,
  onGoToIncident,
  onGoToResponse,
}: {
  detection: DetectionItem
  onGoToEvent: () => void
  onGoToIncident: () => void
  onGoToResponse: () => void
}) {
  return (
    <div className="p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-data text-xs text-text-muted font-bold">{detection.id}</span>
          <SeverityBadge severity={detection.severity} />
          <span className="text-[11px] font-semibold font-data text-status-success bg-status-successBg px-2 py-0.5 rounded border border-status-success/30">
            {detection.status}
          </span>
        </div>
        <h2 className="text-lg font-bold text-text-primary">{detection.title}</h2>
        <p className="text-[12px] text-text-muted font-data mt-0.5">
          {formatDateTime(detection.timestamp)}
        </p>
      </div>

      <div className="bg-surface-3 border border-surface-borderLight rounded p-4">
        <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Detection Logic</div>
        <p className="text-[13px] text-text-secondary leading-relaxed">{detection.description}</p>
      </div>

      {/* Correlation Pipeline Card */}
      <div className="bg-surface-2 border border-surface-borderLight rounded p-4 space-y-3">
        <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
          <Activity size={14} className="text-accent" /> Backend Correlation Chain
        </div>

        <div className="space-y-2 text-[12.5px]">
          <div className="flex items-center justify-between p-2 rounded bg-surface-3 border border-surface-border">
            <div>
              <span className="text-text-muted text-[11px] block">Triggering Event:</span>
              <span className="font-data text-text-primary font-medium">Event #{detection.eventId}</span>
            </div>
            <button
              onClick={onGoToEvent}
              className="text-[11.5px] text-accent hover:text-accent-dim font-medium inline-flex items-center gap-1"
            >
              View Event <ArrowRight size={11} />
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-surface-3 border border-surface-border">
            <div>
              <span className="text-text-muted text-[11px] block">Calculated Risk:</span>
              <span className="font-data text-text-primary font-medium">
                Risk #{detection.riskId || detection.detectionId} (Score: {detection.riskScore}/100)
              </span>
            </div>
            <SeverityBadge severity={detection.severity} size="sm" />
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-surface-3 border border-surface-border">
            <div>
              <span className="text-text-muted text-[11px] block">Firewall Response:</span>
              <span className="font-data text-text-primary font-medium">
                {detection.responseId ? `Response #${detection.responseId} (BLOCK_IP)` : 'Automated Block Rule'}
              </span>
            </div>
            <button
              onClick={onGoToResponse}
              className="text-[11.5px] text-accent hover:text-accent-dim font-medium inline-flex items-center gap-1"
            >
              View Responses <ArrowRight size={11} />
            </button>
          </div>

          {detection.incidentId && (
            <div className="flex items-center justify-between p-2 rounded bg-surface-3 border border-surface-border">
              <div>
                <span className="text-text-muted text-[11px] block">Created Incident:</span>
                <span className="font-data text-text-primary font-medium">
                  Incident #{detection.incidentId}
                </span>
              </div>
              <button
                onClick={onGoToIncident}
                className="text-[11.5px] text-accent hover:text-accent-dim font-medium inline-flex items-center gap-1"
              >
                View Incident <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-text-muted block text-[10.5px]">Attacker Source IP:</span>
          <span className="font-data text-text-primary font-semibold">{detection.sourceIp}</span>
        </div>
        <div>
          <span className="text-text-muted block text-[10.5px]">Target Host:</span>
          <span className="font-data text-text-primary font-semibold">{detection.targetHost}</span>
        </div>
        <div>
          <span className="text-text-muted block text-[10.5px]">MITRE Technique:</span>
          <span className="font-data text-text-primary">T1110.001 (Password Guessing)</span>
        </div>
        <div>
          <span className="text-text-muted block text-[10.5px]">Firewall Verification:</span>
          <span
            className={`font-data font-semibold ${
              detection.verificationResult === 'STOPPED' ? 'text-status-success' : 'text-text-secondary'
            }`}
          >
            {detection.verificationResult || 'STOPPED'}
          </span>
        </div>
      </div>
    </div>
  )
}
