import React, { useMemo } from 'react'
import {
  Network, ShieldBan, ShieldCheck, AlertTriangle, Server,
  Radio, Activity, ArrowRight, EyeOff, CheckCircle2
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { MetricCard } from '../components/MetricCard'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import { formatDateTime } from '../lib/format'

export function NetworkPage() {
  const { securityEvents, responseActions, verifications, hosts, navigateTo } = useSoc()

  // Aggregate observed network telemetry from real security events
  const ipAnalytics = useMemo(() => {
    const ipMap = new Map<string, {
      ip: string
      eventCount: number
      firstSeen: string
      lastSeen: string
      targetHosts: Set<string>
      hasBlock: boolean
      verificationResult?: string
    }>()

    // Map responses by target IP
    const blockedIps = new Set(
      responseActions
        .filter((r) => r.action_type === 'BLOCK_IP' && r.status === 'SUCCESS')
        .map((r) => r.target_ip)
    )

    // Map verifications
    const verifiedIpMap = new Map<string, string>()
    for (const v of verifications) {
      const resp = responseActions.find((r) => r.response_id === v.response_id)
      if (resp && resp.target_ip) {
        verifiedIpMap.set(resp.target_ip, v.result)
      }
    }

    for (const ev of securityEvents) {
      const ip = ev.sourceIp
      if (!ip) continue
      const existing = ipMap.get(ip)
      if (!existing) {
        ipMap.set(ip, {
          ip,
          eventCount: 1,
          firstSeen: ev.timestamp,
          lastSeen: ev.timestamp,
          targetHosts: new Set([ev.host]),
          hasBlock: blockedIps.has(ip),
          verificationResult: verifiedIpMap.get(ip),
        })
      } else {
        existing.eventCount++
        existing.targetHosts.add(ev.host)
        if (new Date(ev.timestamp) > new Date(existing.lastSeen)) {
          existing.lastSeen = ev.timestamp
        }
        if (new Date(ev.timestamp) < new Date(existing.firstSeen)) {
          existing.firstSeen = ev.timestamp
        }
      }
    }

    return Array.from(ipMap.values()).sort((a, b) => b.eventCount - a.eventCount)
  }, [securityEvents, responseActions, verifications])

  const totalObservedIps = ipAnalytics.length
  const blockedIpsCount = ipAnalytics.filter((i) => i.hasBlock).length
  const verifiedStoppedCount = verifications.filter((v) => v.result === 'STOPPED').length

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Network size={20} className="text-accent" /> Network Monitoring
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Perimeter traffic analytics and observed source IP telemetry from FastAPI backend
        </p>
      </div>

      {/* Sensor Configuration Notice Banner */}
      <div className="bg-surface-2 border border-surface-border rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-sm bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Radio size={18} className="text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text-primary">NetFlow / sFlow Packet Sensors: Not Configured</span>
              <Pill tone="default">Sensor Offline</Pill>
            </div>
            <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
              Raw packet sniffing (Zeek/Suricata) and NetFlow collectors are not attached to this environment.
              All active network metrics below are derived directly from verified authentication events, host socket connections, and automated firewall response records.
            </p>
          </div>
        </div>
        <div className="text-[11.5px] font-mono text-text-muted whitespace-nowrap bg-surface-3 px-2.5 py-1 rounded border border-surface-borderLight">
          Source: /events + /responses
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          label="Observed Attacker IPs"
          value={String(totalObservedIps)}
          icon={<Network size={15} />}
          subtext="Distinct sources in /events"
        />
        <MetricCard
          label="Active Firewall Blocks"
          value={String(blockedIpsCount)}
          icon={<ShieldBan size={15} />}
          accentClass="text-sev-critical"
          subtext="action_type: BLOCK_IP"
        />
        <MetricCard
          label="Verified Preventions"
          value={String(verifiedStoppedCount)}
          icon={<ShieldCheck size={15} />}
          accentClass="text-status-success"
          subtext="verifications.result: STOPPED"
        />
        <MetricCard
          label="Monitored Server Hosts"
          value={String(hosts.length)}
          icon={<Server size={15} />}
          subtext={hosts[0]?.name ? `${hosts[0].name} (${hosts[0].ip})` : '1 active server'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Attacker IPs Breakdown */}
        <div className="xl:col-span-2">
          <Card padded={false}>
            <div className="p-4 pb-3">
              <CardHeader
                title="Observed Source IPs Telemetry"
                subtitle="Real external addresses parsed from security event logs"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                    <th className="text-left font-semibold px-4 py-2">Source IP</th>
                    <th className="text-left font-semibold px-2 py-2">Events</th>
                    <th className="text-left font-semibold px-2 py-2">Target Host</th>
                    <th className="text-left font-semibold px-2 py-2">Firewall Action</th>
                    <th className="text-left font-semibold px-2 py-2">Verification</th>
                    <th className="text-left font-semibold px-4 py-2">Latest Observed</th>
                  </tr>
                </thead>
                <tbody>
                  {ipAnalytics.map((entry) => (
                    <tr key={entry.ip} className="tr-hover border-b border-surface-border/60">
                      <td className="px-4 py-2.5 font-data text-accent font-semibold whitespace-nowrap">
                        {entry.ip}
                      </td>
                      <td className="px-2 py-2.5 font-data text-text-primary">
                        <span className="bg-surface-3 px-2 py-0.5 rounded text-[11px] font-bold">
                          {entry.eventCount}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">
                        {Array.from(entry.targetHosts).join(', ') || 'SOC-Test-Server'}
                      </td>
                      <td className="px-2 py-2.5">
                        {entry.hasBlock ? (
                          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border bg-sev-criticalBg border-sev-critical/30 text-sev-critical">
                            BLOCK_IP (SUCCESS)
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border bg-surface-3 border-surface-border text-text-muted">
                            MONITORED
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        {entry.verificationResult === 'STOPPED' ? (
                          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border bg-status-successBg border-status-success/30 text-status-success flex items-center gap-1 w-fit">
                            <CheckCircle2 size={11} /> STOPPED
                          </span>
                        ) : entry.verificationResult === 'UNKNOWN' ? (
                          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border bg-warning/10 border-warning/30 text-warning">
                            UNKNOWN
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-mono text-text-muted">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-data text-text-secondary text-[11px] whitespace-nowrap">
                        {formatDateTime(entry.lastSeen)}
                      </td>
                    </tr>
                  ))}
                  {ipAnalytics.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-text-muted">
                        No network source telemetry available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sensor & Pipeline Diagnostics */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Telemetry Pipeline Status"
              subtitle="Diagnostic state of network ingest modules"
            />
            <div className="space-y-3 mt-1">
              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-text-primary">Endpoint Event Ingest</span>
                  <span className="text-[11px] font-bold text-status-success flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success inline-block" /> Active
                  </span>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Endpoint socket and failed auth events stream into FastAPI via <code className="text-accent">/events</code>.
                </p>
              </div>

              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-text-primary">Firewall Response Agent</span>
                  <span className="text-[11px] font-bold text-status-success flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success inline-block" /> Active
                  </span>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Firewall iptables block rules managed via <code className="text-accent">/responses</code>.
                </p>
              </div>

              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-text-primary">NetFlow / IPFIX Collector</span>
                  <span className="text-[11px] font-bold text-text-muted">Not Configured</span>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Requires passive switch mirror port or router exporter on UDP port 2055.
                </p>
              </div>

              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-bold text-text-primary">PCAP Deep Inspection</span>
                  <span className="text-[11px] font-bold text-text-muted">Not Configured</span>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Suricata / Zeek packet dissector daemon is not active.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Firewall Policy Target"
              subtitle="Protected host destination"
            />
            <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight">
              <div className="text-[13px] font-bold font-data text-text-primary">
                {hosts[0]?.name || 'SOC-Test-Server'}
              </div>
              <div className="text-[12px] font-data text-accent mt-0.5">
                {hosts[0]?.ip || '192.168.1.100'}
              </div>
              <div className="mt-2 text-[11.5px] text-text-muted">
                Target server running authentication services monitored by AdaptiveSOC rule engine.
              </div>
              <button
                onClick={() => navigateTo('responses')}
                className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline"
              >
                View Response Actions & Verifications <ArrowRight size={13} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
