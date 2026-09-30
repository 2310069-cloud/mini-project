import React, { useMemo } from 'react'
import { Network, ArrowDownToLine, ArrowUpFromLine, Link2, ShieldBan, Radar } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { NETWORK_CONNECTIONS, SUSPICIOUS_IPS } from '../data/generator'
import { buildNetworkChart } from '../data/timeseries'
import { Card, CardHeader } from '../components/ui/Card'
import { MetricCard } from '../components/MetricCard'
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector'
import { RiskBar } from '../components/ui/Risk'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import { formatTime, formatCompact } from '../lib/format'

const REPUTATION_STYLE: Record<string, string> = {
  Malicious: 'text-sev-critical bg-sev-criticalBg border-sev-critical/30',
  Suspicious: 'text-sev-high bg-sev-highBg border-sev-high/30',
  Unknown: 'text-text-muted bg-white/5 border-surface-border',
  Clean: 'text-status-success bg-status-successBg border-status-success/30',
}

export function NetworkPage() {
  const { timeRange, setTimeRange } = useSoc()
  const chartData = useMemo(() => buildNetworkChart(timeRange), [timeRange])

  const totalConnections = NETWORK_CONNECTIONS.length
  const blockedConnections = NETWORK_CONNECTIONS.filter((c) => c.blocked).length
  const totalInbound = NETWORK_CONNECTIONS.reduce((s, c) => s + c.bytesIn, 0)
  const totalOutbound = NETWORK_CONNECTIONS.reduce((s, c) => s + c.bytesOut, 0)
  const portScans = 52

  const recentConns = NETWORK_CONNECTIONS.slice(0, 25)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Network size={20} className="text-accent" /> Network Monitoring
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">Perimeter and internal traffic analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <MetricCard label="Inbound Traffic" value={formatCompact(totalInbound)} unit="B" icon={<ArrowDownToLine size={15} />} />
        <MetricCard label="Outbound Traffic" value={formatCompact(totalOutbound)} unit="B" icon={<ArrowUpFromLine size={15} />} />
        <MetricCard label="Connections" value={totalConnections.toLocaleString()} icon={<Link2 size={15} />} />
        <MetricCard label="Blocked" value={blockedConnections.toLocaleString()} icon={<ShieldBan size={15} />} accentClass="text-sev-critical" />
        <MetricCard label="Port Scans" value={String(portScans)} icon={<Radar size={15} />} accentClass="text-sev-medium" />
      </div>

      <Card>
        <CardHeader
          title="Network Activity"
          subtitle="Inbound / outbound throughput and blocked connections"
          action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
        />
        <div className="h-[260px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="netIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4c9aff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4c9aff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="netOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b96a5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b96a5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#1c222b" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#232932' }} tickLine={false} minTickGap={40} />
              <YAxis tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: '#161b23', border: '1px solid #2b323d', borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: '#9aa4b2' }}
              />
              <Area type="monotone" dataKey="inbound" name="Inbound (Mbps)" stroke="#4c9aff" strokeWidth={1.75} fill="url(#netIn)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="outbound" name="Outbound (Mbps)" stroke="#8b96a5" strokeWidth={1.75} fill="url(#netOut)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#e5484d" strokeWidth={1.75} fill="none" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Suspicious IPs */}
        <Card padded={false}>
          <div className="p-4 pb-3">
            <CardHeader title="Suspicious Source IPs" subtitle="Reputation-flagged external addresses" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2">IP</th>
                  <th className="text-left font-semibold px-2 py-2">Country</th>
                  <th className="text-left font-semibold px-2 py-2">Reputation</th>
                  <th className="text-left font-semibold px-2 py-2 hidden sm:table-cell">Conns</th>
                  <th className="text-left font-semibold px-2 py-2 hidden sm:table-cell">Blocked</th>
                  <th className="text-left font-semibold px-4 py-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {SUSPICIOUS_IPS.map((ip) => (
                  <tr key={ip.ip} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2.5 font-data text-text-primary font-medium whitespace-nowrap">{ip.ip}</td>
                    <td className="px-2 py-2.5 text-text-secondary whitespace-nowrap">{ip.country}</td>
                    <td className="px-2 py-2.5">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-sm border ${REPUTATION_STYLE[ip.reputation]}`}>
                        {ip.reputation}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-secondary hidden sm:table-cell tabular">{ip.connections}</td>
                    <td className="px-2 py-2.5 font-data text-text-secondary hidden sm:table-cell tabular">{ip.blocked}</td>
                    <td className="px-4 py-2.5 w-[100px]"><RiskBar score={ip.risk} showLabel /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent connections */}
        <Card padded={false}>
          <div className="p-4 pb-3">
            <CardHeader title="Recent Connections" subtitle="Live flow records" />
          </div>
          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2">Time</th>
                  <th className="text-left font-semibold px-2 py-2">Source</th>
                  <th className="text-left font-semibold px-2 py-2">Dest:Port</th>
                  <th className="text-left font-semibold px-4 py-2">State</th>
                </tr>
              </thead>
              <tbody>
                {recentConns.map((c) => (
                  <tr key={c.id} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2 font-data text-text-secondary whitespace-nowrap">{formatTime(c.timestamp)}</td>
                    <td className="px-2 py-2 font-data text-text-primary whitespace-nowrap">{c.sourceIp}</td>
                    <td className="px-2 py-2 font-data text-text-secondary whitespace-nowrap">{c.destIp}:{c.destPort}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-sm ${c.blocked ? 'bg-sev-criticalBg text-sev-critical' : 'bg-status-successBg text-status-success'}`}>
                        {c.blocked ? 'Blocked' : 'Allowed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
