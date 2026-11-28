import React, { useMemo, useState } from 'react'
import { ShieldAlert, UserPlus, EyeOff, ShieldBan, CheckCircle2, Search as SearchIcon } from 'lucide-react'
import { ALERTS as INITIAL_ALERTS } from '../data/generator'
import { SEVERITY_ORDER } from '../lib/severity'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { Button } from '../components/ui/Button'
import { RiskScore, RiskBar } from '../components/ui/Risk'
import { formatTime } from '../lib/format'
import type { Alert, AlertStatus } from '../types'
import { useSoc } from '../context/SocContext'

export function AlertsPage() {
  const { currentParams, navigateTo, alerts, updateAlert } = useSoc()
  const [severity, setSeverity] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Alert | null>(
    alerts.find((a) => a.id === currentParams.id) ?? null
  )

  const statuses: AlertStatus[] = ['Open', 'Investigating', 'Contained', 'Suppressed', 'Closed']

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severity !== 'All' && a.severity !== severity) return false
      if (status !== 'All' && a.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.id.toLowerCase().includes(q) && !a.rule.toLowerCase().includes(q) && !a.sourceIp.includes(q) && !a.target.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a, b) => b.riskScore - a.riskScore)
  }, [alerts, severity, status, search])

  const updateAlertStatus = (id: string, newStatus: AlertStatus) => {
    updateAlert(id, { status: newStatus })
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev))
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <ShieldAlert size={20} className="text-sev-high" /> Alert Management
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Correlated detections requiring triage · {filtered.length} alerts matching filters
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter label="Severity" value={severity} onChange={setSeverity} options={SEVERITY_ORDER} />
        <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search alert ID, rule, IP..." />
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                <th className="text-left font-semibold px-4 py-2.5">Alert ID</th>
                <th className="text-left font-semibold px-2 py-2.5">Severity</th>
                <th className="text-left font-semibold px-2 py-2.5">Detection Rule</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">Source IP</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden lg:table-cell">Target</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden xl:table-cell">First / Last Seen</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden sm:table-cell">Occurrences</th>
                <th className="text-left font-semibold px-2 py-2.5">Risk</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="tr-hover border-b border-surface-border/60 cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-data font-semibold text-text-primary whitespace-nowrap">{a.id}</td>
                  <td className="px-2 py-2.5"><SeverityBadge severity={a.severity} size="sm" /></td>
                  <td className="px-2 py-2.5 text-text-primary whitespace-nowrap">{a.rule}</td>
                  <td className="px-2 py-2.5 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">{a.sourceIp}</td>
                  <td className="px-2 py-2.5 font-data text-text-secondary hidden lg:table-cell whitespace-nowrap">{a.target}</td>
                  <td className="px-2 py-2.5 font-data text-text-muted hidden xl:table-cell whitespace-nowrap">
                    {formatTime(a.firstSeen)} → {formatTime(a.lastSeen)}
                  </td>
                  <td className="px-2 py-2.5 font-data text-text-secondary hidden sm:table-cell tabular">{a.occurrences}</td>
                  <td className="px-2 py-2.5 w-[110px]"><RiskBar score={a.riskScore} showLabel /></td>
                  <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-text-muted text-sm flex flex-col items-center gap-2">
            <SearchIcon size={22} className="text-text-muted/50" />
            No alerts match current filters
          </div>
        )}
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <AlertDetail
            alert={selected}
            onUpdateStatus={updateAlertStatus}
            onInvestigate={() => {
              navigateTo('incidents', { id: 'INC-2026-0042' })
              setSelected(null)
            }}
          />
        )}
      </Drawer>
    </div>
  )
}

function AlertDetail({
  alert, onUpdateStatus, onInvestigate,
}: { alert: Alert; onUpdateStatus: (id: string, s: AlertStatus) => void; onInvestigate: () => void }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <SeverityBadge severity={alert.severity} />
        <StatusBadge status={alert.status} />
      </div>
      <h2 className="text-lg font-bold text-text-primary">{alert.rule}</h2>
      <p className="text-[12.5px] text-text-muted font-data mt-1">{alert.id} · Rule {alert.ruleId}</p>

      <p className="text-[13.5px] text-text-secondary leading-relaxed mt-4">{alert.description}</p>

      <div className="mt-5 flex items-center gap-4 bg-surface-3 border border-surface-borderLight rounded-sm p-4">
        <RiskScore score={alert.riskScore} size="lg" />
        <div className="flex-1">
          <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Risk Assessment</div>
          <RiskBar score={alert.riskScore} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="Source IP" value={alert.sourceIp} mono />
        <Field label="Target" value={alert.target} mono />
        <Field label="First Seen" value={formatTime(alert.firstSeen)} mono />
        <Field label="Last Seen" value={formatTime(alert.lastSeen)} mono />
        <Field label="Occurrences" value={String(alert.occurrences)} mono />
        <Field label="MITRE Technique" value={alert.mitreId ?? '—'} mono />
        <Field label="Host" value={alert.host ?? '—'} mono />
        <Field label="User" value={alert.user ?? '—'} mono />
        <Field label="Assignee" value={alert.assignee ?? 'Unassigned'} />
      </div>

      <div className="mt-6 pt-5 border-t border-surface-border">
        <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-3">Actions</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<ShieldAlert size={14} />} onClick={onInvestigate}>
            Investigate
          </Button>
          <Button variant="secondary" icon={<UserPlus size={14} />} onClick={() => onUpdateStatus(alert.id, 'Investigating')}>
            Assign to Me
          </Button>
          <Button variant="secondary" icon={<EyeOff size={14} />} onClick={() => onUpdateStatus(alert.id, 'Suppressed')}>
            Suppress
          </Button>
          <Button variant="secondary" icon={<ShieldBan size={14} />} onClick={() => onUpdateStatus(alert.id, 'Contained')}>
            Contain
          </Button>
          <Button variant="outline" icon={<CheckCircle2 size={14} />} onClick={() => onUpdateStatus(alert.id, 'Closed')}>
            Close
          </Button>
        </div>
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
