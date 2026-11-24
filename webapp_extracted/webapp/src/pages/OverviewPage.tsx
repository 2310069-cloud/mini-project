import React, { useMemo } from 'react'
import {
  Activity,
  ShieldAlert,
  FolderOpen,
  Server,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { ThreatTimeline } from '../components/ThreatTimeline'
import { CriticalIncidentBanner } from '../components/CriticalIncidentBanner'
import { ArchitectureDiagram } from '../components/ArchitectureDiagram'
import { Card, CardHeader } from '../components/ui/Card'
import { SeverityBadge, StatusBadge } from '../components/ui/Badge'
import { RiskBar } from '../components/ui/Risk'
import { useSoc } from '../context/SocContext'
import { formatTime } from '../lib/format'

export function OverviewPage() {
  const {
    timeRange,
    setTimeRange,
    incidents,
    securityEvents,
    detections,
    hosts,
    navigateTo,
    backendConnected,
    totalEvents,
    totalDetections,
    totalIncidents,
    totalResponses,
    successfulFirewallActions,
    verifiedPreventions,
    totalVerifications,
    monitoredHostsCount,
  } = useSoc()

  // Primary active incident to highlight in banner
  const activeIncident = useMemo(() => {
    return incidents[0] || null
  }, [incidents])

  // Top active detections from real backend data
  const topDetections = useMemo(() => {
    return detections.slice(0, 5)
  }, [detections])

  // Recent events from real backend data
  const recentEvents = useMemo(() => {
    return securityEvents.slice(0, 6)
  }, [securityEvents])

  // Monitored host from real backend database
  const activeHost = useMemo(() => {
    return hosts[0] || null
  }, [hosts])

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Security Operations Center</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Real-time security monitoring and automated incident response
            {backendConnected ? (
              <span className="ml-2 text-status-success font-medium inline-flex items-center gap-1">
                · FastAPI backend live sync (127.0.0.1:8000)
              </span>
            ) : (
              <span className="ml-2 text-sev-medium font-medium">
                · Connecting to FastAPI backend...
              </span>
            )}
          </p>
        </div>
      </div>

      {/* High-severity incident banner */}
      {activeIncident && <CriticalIncidentBanner incident={activeIncident} />}

      {/* KPI Row - Calculated strictly from real backend records */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          label="Total Events"
          value={String(totalEvents)}
          footnote="Authentication events (/events)"
          icon={<Activity size={15} />}
        />
        <MetricCard
          label="Threat Detections"
          value={String(totalDetections)}
          footnote="Confirmed BRUTE_FORCE attacks"
          icon={<ShieldAlert size={15} />}
          accentClass="text-sev-high"
        />
        <MetricCard
          label="Security Incidents"
          value={String(totalIncidents)}
          footnote="High severity (Open)"
          icon={<FolderOpen size={15} />}
          accentClass="text-sev-high"
        />
        <MetricCard
          label="Firewall Actions"
          value={`${successfulFirewallActions} / ${totalResponses}`}
          footnote="100% Block Rules Executed"
          icon={<Zap size={15} />}
          accentClass="text-accent"
        />
        <MetricCard
          label="Verified Prevention"
          value={`${verifiedPreventions} / ${totalVerifications}`}
          footnote="Rule enforcement verified (STOPPED)"
          icon={<ShieldCheck size={15} />}
          accentClass="text-status-success"
        />
        <MetricCard
          label="Monitored Hosts"
          value={String(monitoredHostsCount)}
          footnote={activeHost ? `${activeHost.hostname} (Active)` : 'Local test host'}
          icon={<Server size={15} />}
        />
      </div>

      {/* Main grid: timeline + side panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ThreatTimeline timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        </div>

        <Card padded={false} className="flex flex-col">
          <div className="p-4 pb-0">
            <CardHeader
              title="Recent Threat Detections"
              subtitle="Confirmed attacks from backend engine"
            />
          </div>
          <div className="flex-1 divide-y divide-surface-border/70">
            {topDetections.map((d) => (
              <button
                key={d.id}
                onClick={() => navigateTo('detection', { id: String(d.detectionId) })}
                className="w-full text-left px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-data text-[11.5px] text-text-muted">{d.id}</span>
                  <SeverityBadge severity={d.severity} size="sm" />
                </div>
                <p className="text-[12.5px] text-text-primary font-medium truncate">{d.title}</p>
                <div className="flex items-center justify-between mt-1.5 gap-2">
                  <span className="font-data text-[11px] text-text-muted truncate">
                    Src: {d.sourceIp}
                  </span>
                  <div className="flex items-center gap-2">
                    {d.verificationResult === 'STOPPED' && (
                      <span className="text-[10px] text-status-success font-medium bg-status-successBg px-1.5 py-0.5 rounded border border-status-success/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> STOPPED
                      </span>
                    )}
                    <RiskBar score={d.riskScore} showLabel />
                  </div>
                </div>
              </button>
            ))}
            {topDetections.length === 0 && (
              <div className="p-6 text-center text-text-muted text-xs">
                No detections recorded
              </div>
            )}
          </div>
          <button
            onClick={() => navigateTo('detection')}
            className="flex items-center justify-center gap-1.5 text-[12px] text-accent hover:text-accent-dim font-medium py-2.5 border-t border-surface-border"
          >
            View all detections ({detections.length}) <ArrowRight size={12} />
          </button>
        </Card>
      </div>

      {/* Bottom grid: recent events + architecture */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card padded={false}>
            <div className="p-4 pb-3 flex items-center justify-between">
              <CardHeader
                title="Live Security Events"
                subtitle={`Showing latest of ${totalEvents} actual ingested events`}
              />
              <button
                onClick={() => navigateTo('events')}
                className="text-[12px] text-accent hover:text-accent-dim font-medium shrink-0 inline-flex items-center gap-1"
              >
                View all ({totalEvents}) <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-t border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                    <th className="text-left font-semibold px-4 py-2">Timestamp</th>
                    <th className="text-left font-semibold px-2 py-2">Severity</th>
                    <th className="text-left font-semibold px-2 py-2">Event Type</th>
                    <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Host</th>
                    <th className="text-left font-semibold px-2 py-2">Source IP</th>
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
                      <td className="px-4 py-2.5 font-data text-text-secondary whitespace-nowrap">
                        {formatTime(e.timestamp)}
                      </td>
                      <td className="px-2 py-2.5">
                        <SeverityBadge severity={e.severity} size="sm" />
                      </td>
                      <td className="px-2 py-2.5 text-text-primary font-medium whitespace-nowrap">
                        {e.eventType}
                      </td>
                      <td className="px-2 py-2.5 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">
                        {e.host}
                      </td>
                      <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">
                        {e.sourceIp}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                  {recentEvents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-text-muted text-xs">
                        No security events received yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <ArchitectureDiagram />
      </div>

      {/* Real Host Status Snapshot */}
      <Card padded={false}>
        <div className="p-4 pb-3 flex items-center justify-between">
          <CardHeader
            title="Monitored Infrastructure"
            subtitle="Endpoints configured in Adaptive SOC backend"
          />
          <button
            onClick={() => navigateTo('hosts')}
            className="text-[12px] text-accent hover:text-accent-dim font-medium shrink-0 inline-flex items-center gap-1"
          >
            Host details <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-0">
          {activeHost ? (
            <button
              onClick={() => navigateTo('hosts', { id: activeHost.id })}
              className="text-left bg-surface-3 border border-surface-borderLight rounded-sm p-3.5 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-data text-[13px] font-semibold text-text-primary truncate">
                  {activeHost.hostname}
                </span>
                <span className="text-[10px] font-bold font-data text-status-success bg-status-successBg px-1.5 py-0.5 rounded border border-status-success/30">
                  {activeHost.status}
                </span>
              </div>
              <p className="text-[11.5px] text-text-secondary font-data mb-2">
                {activeHost.ip} · {activeHost.os}
              </p>
              <div className="text-[11px] text-text-muted flex items-center justify-between">
                <span>Role: {activeHost.role}</span>
                <span className="text-sev-high font-semibold">{totalDetections} detections logged</span>
              </div>
            </button>
          ) : (
            <div className="p-4 bg-surface-3 rounded text-text-muted text-xs">
              Loading host configuration...
            </div>
          )}

          {/* Not configured indicators for unconfigured agent slots */}
          <div className="bg-surface-2/60 border border-dashed border-surface-border rounded-sm p-3.5 flex flex-col justify-center text-text-muted">
            <div className="text-[12px] font-medium text-text-secondary flex items-center gap-1.5">
              <Server size={14} className="text-text-muted" /> Additional Host Agents
            </div>
            <p className="text-[11px] text-text-muted mt-1">
              Status: <span className="text-text-secondary font-medium">Not configured</span>
            </p>
            <p className="text-[10.5px] text-text-muted/70 mt-0.5">
              Currently monitoring Host #1 (SOC-Test-Server). To attach additional agents, configure agent endpoints in system settings.
            </p>
          </div>

          <div className="bg-surface-2/60 border border-dashed border-surface-border rounded-sm p-3.5 flex flex-col justify-center text-text-muted hidden lg:flex">
            <div className="text-[12px] font-medium text-text-secondary flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-status-success" /> Containment Automation
            </div>
            <p className="text-[11px] text-text-secondary mt-1">
              Windows Firewall Rule: <span className="text-status-success font-medium">Active (netsh)</span>
            </p>
            <p className="text-[10.5px] text-text-muted/70 mt-0.5">
              {successfulFirewallActions} block rules executed · {verifiedPreventions} verified stopped
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
