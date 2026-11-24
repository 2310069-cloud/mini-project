import React, { useMemo, useState } from 'react'
import { Server, Cpu, MemoryStick, Wifi, Clock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card, CardHeader } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { formatDateTime } from '../lib/format'
import type { Host } from '../types'
import { useSoc } from '../context/SocContext'

const STATUS_STYLES: Record<string, string> = {
  Critical: 'text-sev-critical bg-sev-criticalBg border-sev-critical/30',
  High: 'text-sev-high bg-sev-highBg border-sev-high/30',
  Monitoring: 'text-sev-medium bg-sev-mediumBg border-sev-medium/30',
  Healthy: 'text-status-success bg-status-successBg border-status-success/30',
}

export function HostsPage() {
  const { hosts, currentParams, backendConnected, totalDetections } = useSoc()
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Host | null>(
    hosts.find((h) => h.id === currentParams.id) ?? hosts[0] ?? null
  )

  const statuses = useMemo(() => Array.from(new Set(hosts.map((h) => h.status))), [hosts])

  const filtered = useMemo(() => {
    return hosts.filter((h) => {
      if (status !== 'All' && h.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!h.hostname.toLowerCase().includes(q) && !h.ip.includes(q) && !h.os.toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [hosts, status, search])

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Server size={20} className="text-accent" /> Host Monitoring
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Configured endpoint infrastructure in backend database · {hosts.length} monitored host active
          {backendConnected && (
            <span className="ml-2 text-status-success font-medium">(FastAPI live sync)</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search hostname, IP, OS..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h) => (
          <Card
            key={h.id}
            className="cursor-pointer hover:border-surface-borderLight transition-colors"
            padded={false}
          >
            <div onClick={() => setSelected(h)} className="w-full text-left p-4">
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <div className="font-data font-bold text-[14px] text-text-primary flex items-center gap-1.5">
                    {h.hostname}
                    <span className="text-[10px] text-text-muted font-normal">#{h.id}</span>
                  </div>
                  <div className="text-[11.5px] text-text-muted">{h.role}</div>
                </div>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border ${
                    STATUS_STYLES[h.status] || STATUS_STYLES.Healthy
                  }`}
                >
                  {h.status}
                </span>
              </div>

              <div className="font-data text-[12px] text-text-secondary mb-3">
                {h.ip} · {h.os}
              </div>

              <div className="bg-surface-3 p-2.5 rounded border border-surface-border text-xs mb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Agent Status:</span>
                  <span className="font-medium text-status-success flex items-center gap-1">
                    <CheckCircle2 size={12} /> {h.agentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Logged Detections:</span>
                  <span className="font-data font-semibold text-sev-high">{totalDetections} detections</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-border text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {formatDateTime(h.lastSeen)}
                </span>
                <span className="text-accent font-medium">View details →</span>
              </div>
            </div>
          </Card>
        ))}

        {/* Clear Not Configured State card for unconfigured agent slots */}
        <Card className="border-dashed border-surface-border bg-surface-2/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Server size={18} className="text-text-muted" />
              <h3 className="text-[13.5px] font-semibold text-text-secondary">Additional Host Agents</h3>
            </div>
            <div className="text-[11px] font-medium text-sev-medium bg-sev-mediumBg border border-sev-medium/30 px-2 py-0.5 rounded inline-block mb-2">
              Not configured
            </div>
            <p className="text-[12px] text-text-muted leading-relaxed">
              No additional endpoint agents are currently connected. The local SOC backend is dedicated to monitoring
              Host #1 (<span className="font-data text-text-secondary">SOC-Test-Server</span>).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-border text-[11px] text-text-muted">
            Telemetry is restricted to active database records.
          </div>
        </Card>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Host Details">
        {selected && <HostDetail host={selected} totalDetections={totalDetections} />}
      </Drawer>
    </div>
  )
}

function HostDetail({ host, totalDetections }: { host: Host; totalDetections: number }) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary font-data">{host.hostname}</h2>
          <p className="text-[12.5px] text-text-muted">
            Host ID: #{host.id} · IP: {host.ip}
          </p>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-sm border ${
            STATUS_STYLES[host.status] || STATUS_STYLES.Healthy
          }`}
        >
          {host.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="Operating System" value={host.os} />
        <DetailItem label="Role" value={host.role} />
        <DetailItem label="Agent Status" value={host.agentStatus} />
        <DetailItem label="Target IP Address" value={host.ip} mono />
        <DetailItem label="Confirmed Detections" value={`${totalDetections} BRUTE_FORCE attacks`} />
        <DetailItem label="Last Ingestion" value={formatDateTime(host.lastSeen)} mono />
      </div>

      <div className="bg-surface-3 p-3.5 rounded border border-surface-border text-xs text-text-secondary leading-relaxed">
        <span className="font-semibold text-text-primary block mb-1">Host Description:</span>
        Local test server configured in Adaptive SOC backend for brute-force attack detection and automatic Windows
        Firewall response rule enforcement.
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="bg-surface-3/50 rounded-sm p-3 border border-surface-borderLight">
      <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">{label}</div>
      <div className={`text-[13px] font-medium text-text-primary ${mono ? 'font-data' : ''}`}>{value}</div>
    </div>
  )
}
