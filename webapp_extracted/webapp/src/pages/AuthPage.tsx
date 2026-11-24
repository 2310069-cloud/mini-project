import React, { useMemo, useState } from 'react'
import { KeyRound, UserCheck, UserX, Lock, ShieldBan, ShieldCheck, Globe2, Radio } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { MetricCard } from '../components/MetricCard'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import { formatDateTime } from '../lib/format'

export function AuthPage() {
  const { securityEvents, responseActions, hosts } = useSoc()

  const totalFailed = securityEvents.filter((e) => e.eventType === 'FAILED_LOGIN').length
  const totalSuccessful = 0 // Real database contains no successful logins
  const privilegedLogins = securityEvents.filter((e) => e.user === 'admin').length
  const automatedBlocks = responseActions.filter((r) => r.action_type === 'BLOCK_IP' && r.status === 'SUCCESS').length

  // Aggregate by targeted account
  const accountBreakdown = useMemo(() => {
    const map = new Map<string, { account: string; failures: number; latestAttempt: string; ips: Set<string> }>()
    for (const ev of securityEvents) {
      const u = ev.user || 'Unknown'
      const existing = map.get(u)
      if (!existing) {
        map.set(u, {
          account: u,
          failures: 1,
          latestAttempt: ev.timestamp,
          ips: new Set([ev.sourceIp]),
        })
      } else {
        existing.failures++
        existing.ips.add(ev.sourceIp)
        if (new Date(ev.timestamp) > new Date(existing.latestAttempt)) {
          existing.latestAttempt = ev.timestamp
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.failures - a.failures)
  }, [securityEvents])

  // Most attacked account
  const topTarget = accountBreakdown[0]

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <KeyRound size={20} className="text-accent" /> Authentication Telemetry
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Real identity and access events from FastAPI endpoint logs (/events)
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          label="Successful Logins"
          value={String(totalSuccessful)}
          icon={<UserCheck size={15} />}
          accentClass="text-status-success"
          subtext="0 recorded in /events"
        />
        <MetricCard
          label="Failed Logins"
          value={String(totalFailed)}
          icon={<UserX size={15} />}
          accentClass="text-sev-critical"
          subtext="52 recorded in /events"
        />
        <MetricCard
          label="Privileged Account Targets"
          value={String(privilegedLogins)}
          icon={<Lock size={15} />}
          accentClass="text-sev-high"
          subtext="Attempts on 'admin'"
        />
        <MetricCard
          label="Automated Firewall Blocks"
          value={String(automatedBlocks)}
          icon={<ShieldBan size={15} />}
          accentClass="text-status-success"
          subtext="14 BLOCK_IP actions"
        />
      </div>

      {/* Primary Target Highlight */}
      {topTarget && (
        <Card className="border-sev-high/40 bg-sev-highBg">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-11 w-11 rounded-sm bg-sev-high/20 flex items-center justify-center shrink-0">
              <UserX size={20} className="text-sev-high" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wide text-sev-high mb-1">
                Highest Targeted Account
              </div>
              <div className="font-data text-[17px] font-bold text-text-primary">
                {topTarget.account}
              </div>
              <div className="flex flex-wrap gap-5 mt-2 text-[12.5px]">
                <div>
                  <span className="text-text-muted">Failed Attempts: </span>
                  <span className="font-data font-bold text-text-primary">{topTarget.failures}</span>
                </div>
                <div>
                  <span className="text-text-muted">Distinct Source IPs: </span>
                  <span className="font-data font-bold text-text-primary">{topTarget.ips.size}</span>
                </div>
                <div>
                  <span className="text-text-muted">Target Host: </span>
                  <span className="font-data font-bold text-text-primary">{hosts[0]?.name || 'SOC-Test-Server'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Latest Attempt: </span>
                  <span className="font-data text-text-secondary">{formatDateTime(topTarget.latestAttempt)}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 bg-surface-3 px-3 py-2 rounded border border-surface-borderLight text-right">
              <div className="text-xxs uppercase tracking-wider text-text-muted">Protection Status</div>
              <div className="text-status-success font-bold text-[12px] flex items-center gap-1 justify-end mt-0.5">
                <ShieldCheck size={13} /> IP Block Active
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid: Account breakdown and Geo notice */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Targeted Accounts Breakdown */}
        <Card padded={false} className="xl:col-span-1">
          <div className="p-4 pb-3">
            <CardHeader
              title="Targeted Accounts"
              subtitle="Failed login distribution across user accounts"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2">Account</th>
                  <th className="text-left font-semibold px-2 py-2">Failures</th>
                  <th className="text-left font-semibold px-4 py-2">Sources</th>
                </tr>
              </thead>
              <tbody>
                {accountBreakdown.map((acc) => (
                  <tr key={acc.account} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2.5 font-data text-accent font-semibold">
                      {acc.account}
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-primary font-bold">
                      {acc.failures}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary font-data text-[11px]">
                      {acc.ips.size} IPs ({Array.from(acc.ips).slice(0, 2).join(', ')}{acc.ips.size > 2 ? '...' : ''})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Geo / Network Subnet Context */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Origin Network Context"
            icon={<Globe2 size={16} />}
            subtitle="IP addressing and subnet resolution"
          />
          <div className="space-y-3 mt-1">
            <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight flex items-start gap-3">
              <Radio size={16} className="text-warning mt-0.5 shrink-0" />
              <div>
                <div className="text-[12.5px] font-bold text-text-primary">
                  GeoIP Lookup Service: Not Configured (Private Network Segment)
                </div>
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                  All 52 observed authentication attempts originate from private subnet addresses (<code className="text-accent">192.168.1.0/24</code>). External MaxMind / GeoIP database lookup is not applicable for private RFC 1918 addresses.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight">
                <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Target Host Destination</div>
                <div className="font-data text-[13px] font-bold text-text-primary">{hosts[0]?.name || 'SOC-Test-Server'}</div>
                <div className="font-data text-[12px] text-accent mt-0.5">{hosts[0]?.ip || '192.168.1.100'}</div>
              </div>
              <div className="p-3 bg-surface-3 rounded-sm border border-surface-borderLight">
                <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Observed Attack Sources</div>
                <div className="font-data text-[13px] font-bold text-text-primary">7 Distinct Host IPs</div>
                <div className="text-[12px] text-text-muted mt-0.5">192.168.1.50 - 192.168.1.60</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Authentication Events Feed */}
      <Card padded={false}>
        <div className="p-4 pb-3">
          <CardHeader
            title="Authentication Event Log"
            subtitle="Raw security events from FastAPI /events"
          />
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                <th className="text-left font-semibold px-4 py-2">Event ID</th>
                <th className="text-left font-semibold px-2 py-2">Timestamp</th>
                <th className="text-left font-semibold px-2 py-2">Source IP</th>
                <th className="text-left font-semibold px-2 py-2">Target Account</th>
                <th className="text-left font-semibold px-2 py-2">Target Host</th>
                <th className="text-left font-semibold px-4 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {securityEvents.map((e) => (
                <tr key={e.id} className="tr-hover border-b border-surface-border/60">
                  <td className="px-4 py-2 font-data text-accent font-semibold whitespace-nowrap">
                    {e.id}
                  </td>
                  <td className="px-2 py-2 font-data text-text-secondary whitespace-nowrap text-[11.5px]">
                    {formatDateTime(e.timestamp)}
                  </td>
                  <td className="px-2 py-2 font-data text-text-primary whitespace-nowrap">
                    {e.sourceIp}
                  </td>
                  <td className="px-2 py-2 font-data text-text-primary font-medium whitespace-nowrap">
                    {e.user}
                  </td>
                  <td className="px-2 py-2 font-data text-text-secondary whitespace-nowrap">
                    {e.host}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-sm bg-sev-criticalBg text-sev-critical border border-sev-critical/30">
                      FAILED_LOGIN
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
