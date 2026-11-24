import React, { useMemo } from 'react'
import { Activity, ShieldAlert, FolderOpen, Server, Gauge, Target } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { ThreatTimeline } from '../components/ThreatTimeline'
import { CriticalIncidentBanner } from '../components/CriticalIncidentBanner'
import { ArchitectureDiagram } from '../components/ArchitectureDiagram'
import { Card, CardHeader } from '../components/ui/Card'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { RiskBar } from '../components/ui/Risk'
import { useSoc } from '../context/SocContext'
import { ALERTS, SECURITY_EVENTS } from '../data/generator'
import { HOSTS, TOTAL_HOSTS_MONITORED, TOTAL_HOSTS_HEALTHY } from '../data/hosts'
import { formatNumber, formatTime } from '../lib/format'
import { ArrowRight } from 'lucide-react'

export function OverviewPage() {
  const { timeRange, setTimeRange, incidents, navigateTo } = useSoc()
  const criticalIncident = incidents.find((i) => i.id === 'INC-2026-0042')!

  const openAlerts = ALERTS.filter((a) => a.status === 'Open' || a.status === 'Investigating')
  const criticalIncidents = incidents.filter((i) => i.severity === 'CRITICAL')
  const unresolvedCritical = criticalIncidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed')

  const recentEvents = useMemo(() => SECURITY_EVENTS.slice(0, 6), [])
  const topAlerts = useMemo(
    () => [...ALERTS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5),
    []
  )

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Security Operations Center</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Real-time security monitoring and incident response
          </p>
        </div>
      </div>

      {/* Critical incident banner */}
      <CriticalIncidentBanner incident={criticalIncident} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          label="Total Events"
          value={formatNumber(1284392)}
          delta="+8.4%"
          deltaTone="neutral"
          icon={<Activity size={15} />}
        />
        <MetricCard
          label="Security Alerts"
          value="342"
          delta="+12"
          deltaLabel="today"
          deltaTone="bad"
          icon={<ShieldAlert size={15} />}
          accentClass="text-sev-high"
        />
        <MetricCard
          label="Critical Incidents"
          value={String(criticalIncidents.length + 5)}
          footnote={`${unresolvedCritical.length} unresolved`}
          icon={<FolderOpen size={15} />}
          accentClass="text-sev-critical"
        />
        <MetricCard
          label="Hosts Monitored"
          value={String(TOTAL_HOSTS_MONITORED)}
          footnote={`${TOTAL_HOSTS_HEALTHY} healthy`}
          icon={<Server size={15} />}
        />
        <MetricCard
          label="Threat Score"
          value="72"
          unit="/100"
          footnote="Elevated"
          icon={<Gauge size={15} />}
          accentClass="text-sev-high"
        />
        <MetricCard
          label="Detection Rate"
          value="96.8"
          unit="%"
          deltaTone="good"
          delta="+0.4%"
          icon={<Target size={15} />}
          accentClass="text-status-success"
        />
      </div>

      {/* Main grid: timeline + side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ThreatTimeline timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>

        <Card padded={false} className="flex flex-col">
          <div className="p-4 pb-0">
            <CardHeader title="Top Active Alerts" subtitle="Ranked by risk score" />
          </div>
          <div className="flex-1 divide-y divide-surface-border/70">
            {topAlerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigateTo('alerts', { id: a.id })}
                className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-data text-[11.5px] text-text-muted">{a.id}</span>
                  <SeverityBadge severity={a.severity} size="sm" />
                </div>
                <p className="text-[12.5px] text-text-primary font-medium truncate">{a.rule}</p>
                <div className="flex items-center justify-between mt-1.5 gap-2">
                  <span className="font-data text-[11px] text-text-muted truncate">{a.sourceIp}</span>
                  <RiskBar score={a.riskScore} showLabel />
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigateTo('alerts')}
            className="flex items-center justify-center gap-1.5 text-[12px] text-accent hover:text-accent-dim font-medium py-2.5 border-t border-surface-border"
          >
            View all alerts <ArrowRight size={12} />
          </button>
        </Card>
      </div>

      {/* Bottom grid: recent events + architecture */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card padded={false}>
            <div className="p-4 pb-3 flex items-center justify-between">
              <CardHeader title="Live Security Events" subtitle="Most recent telemetry across all sources" />
              <button
                onClick={() => navigateTo('events')}
                className="text-[12px] text-accent hover:text-accent-dim font-medium shrink-0 inline-flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-t border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                    <th className="text-left font-semibold px-4 py-2">Time</th>
                    <th className="text-left font-semibold px-2 py-2">Severity</th>
                    <th className="text-left font-semibold px-2 py-2">Event Type</th>
                    <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Host</th>
                    <th className="text-left font-semibold px-2 py-2 hidden lg:table-cell">Source IP</th>
                    <th className="text-left font-semibold px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => navigateTo('events', { id: e.id })}
                      className="tr-hover border-b border-surface-border/60 cursor-pointer"
                    >
                      <td className="px-4 py-2.5 font-data text-text-secondary whitespace-nowrap">{formatTime(e.timestamp)}</td>
                      <td className="px-2 py-2.5"><SeverityBadge severity={e.severity} size="sm" /></td>
                      <td className="px-2 py-2.5 text-text-primary font-medium whitespace-nowrap">{e.eventType}</td>
                      <td className="px-2 py-2.5 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">{e.host}</td>
                      <td className="px-2 py-2.5 font-data text-text-secondary hidden lg:table-cell whitespace-nowrap">{e.sourceIp}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <ArchitectureDiagram />
      </div>

      {/* Host snapshot */}
      <Card padded={false}>
        <div className="p-4 pb-3 flex items-center justify-between">
          <CardHeader title="Host Risk Snapshot" subtitle="Highest-risk monitored assets" />
          <button
            onClick={() => navigateTo('hosts')}
            className="text-[12px] text-accent hover:text-accent-dim font-medium shrink-0 inline-flex items-center gap-1"
          >
            View all hosts <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 pt-0">
          {[...HOSTS].sort((a, b) => b.risk - a.risk).slice(0, 4).map((h) => (
            <button
              key={h.id}
              onClick={() => navigateTo('hosts', { id: h.id })}
              className="text-left bg-surface-3 border border-surface-borderLight rounded-sm p-3 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-data text-[12.5px] font-semibold text-text-primary truncate">{h.hostname}</span>
                <span className={`text-[10px] font-bold font-data ${h.risk >= 80 ? 'text-sev-critical' : h.risk >= 60 ? 'text-sev-high' : 'text-sev-low'}`}>
                  {h.risk}
                </span>
              </div>
              <p className="text-[11px] text-text-muted truncate mb-2">{h.os}</p>
              <RiskBar score={h.risk} />
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
