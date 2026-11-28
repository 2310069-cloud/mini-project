import React, { useMemo, useState } from 'react'
import { KeyRound, UserCheck, UserX, Lock, Globe2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AUTH_EVENTS } from '../data/generator'
import { buildAuthChart } from '../data/timeseries'
import { Card, CardHeader } from '../components/ui/Card'
import { MetricCard } from '../components/MetricCard'
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector'
import { RiskScore, RiskBar } from '../components/ui/Risk'
import { useSoc } from '../context/SocContext'
import { formatTime } from '../lib/format'

export function AuthPage() {
  const { timeRange, setTimeRange, authEvents, activeAttack } = useSoc()
  const chartData = useMemo(() => buildAuthChart(timeRange, activeAttack), [timeRange, activeAttack])

  const successCount = authEvents.filter((e) => e.result === 'Success').length
  const failureCount = authEvents.filter((e) => e.result === 'Failure').length
  const privilegedLogins = authEvents.filter((e) => e.privileged && e.result === 'Success').length
  const lockouts = 3 // demo constant

  const recentEvents = authEvents.slice(0, 30)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <KeyRound size={20} className="text-accent" /> Authentication Monitoring
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">Identity and access telemetry across all domain-joined systems</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard label="Successful Logins" value={successCount.toLocaleString()} icon={<UserCheck size={15} />} accentClass="text-status-success" />
        <MetricCard label="Failed Logins" value={failureCount.toLocaleString()} icon={<UserX size={15} />} accentClass="text-sev-critical" />
        <MetricCard label="Account Lockouts" value={String(lockouts)} icon={<Lock size={15} />} accentClass="text-sev-medium" />
        <MetricCard label="Privileged Logins" value={String(privilegedLogins)} icon={<KeyRound size={15} />} />
      </div>

      <Card>
        <CardHeader
          title="Successful vs. Failed Authentication Attempts"
          subtitle="Volume over time across all monitored hosts"
          action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
        />
        <div className="h-[260px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#1c222b" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#232932' }} tickLine={false} minTickGap={40} />
              <YAxis tick={{ fill: '#5f6b7a', fontSize: 10.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: '#161b23', border: '1px solid #2b323d', borderRadius: 4, fontSize: 12 }}
                labelStyle={{ color: '#9aa4b2' }}
              />
              <Bar dataKey="success" name="Successful" fill="#3fb950" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="failure" name="Failed" fill="#e5484d" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Suspicious account highlight */}
      <Card className="border-sev-critical/30 bg-sev-criticalBg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-11 w-11 rounded-sm bg-sev-critical/20 flex items-center justify-center shrink-0">
            <UserX size={20} className="text-sev-critical" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-sev-critical mb-1">Suspicious Account Activity</div>
            <div className="font-data text-[16px] font-bold text-text-primary">administrator</div>
            <div className="flex flex-wrap gap-4 mt-2 text-[12.5px]">
              <Detail label="Failed Attempts" value="187" />
              <Detail label="Source IP" value="185.220.101.42" />
              <Detail label="Last Successful Login" value="09:52:21" />
            </div>
          </div>
          <div className="shrink-0">
            <RiskScore score={92} size="lg" />
          </div>
        </div>
      </Card>

      {/* Geo anomalies + table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-1">
          <CardHeader title="Geographical Anomalies" icon={<Globe2 size={16} />} subtitle="Logins from unexpected locations" />
          <div className="space-y-2.5">
            <GeoRow country="Russia" ip="185.220.101.42" count={187} risk={96} />
            <GeoRow country="Ukraine" ip="194.26.29.156" count={1} risk={38} />
            <GeoRow country="Romania" ip="45.155.205.132" count={3} risk={54} />
          </div>
        </Card>

        <Card padded={false} className="xl:col-span-2">
          <div className="p-4 pb-3">
            <CardHeader title="Recent Authentication Events" subtitle="Live feed of logon activity" />
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-surface-2">
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2">Time</th>
                  <th className="text-left font-semibold px-2 py-2">User</th>
                  <th className="text-left font-semibold px-2 py-2 hidden sm:table-cell">Source IP</th>
                  <th className="text-left font-semibold px-2 py-2 hidden md:table-cell">Host</th>
                  <th className="text-left font-semibold px-2 py-2 hidden lg:table-cell">Method</th>
                  <th className="text-left font-semibold px-4 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((e) => (
                  <tr key={e.id} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2 font-data text-text-secondary whitespace-nowrap">{formatTime(e.timestamp)}</td>
                    <td className="px-2 py-2 font-data text-text-primary whitespace-nowrap">{e.user}{e.privileged && <span className="text-sev-medium ml-1">★</span>}</td>
                    <td className="px-2 py-2 font-data text-text-secondary hidden sm:table-cell whitespace-nowrap">{e.sourceIp}</td>
                    <td className="px-2 py-2 font-data text-text-secondary hidden md:table-cell whitespace-nowrap">{e.host}</td>
                    <td className="px-2 py-2 text-text-secondary hidden lg:table-cell whitespace-nowrap">{e.method}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${e.result === 'Success' ? 'bg-status-successBg text-status-success' : 'bg-sev-criticalBg text-sev-critical'}`}>
                        {e.result}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted">{label}: </span>
      <span className="font-data font-semibold text-text-primary">{value}</span>
    </div>
  )
}

function GeoRow({ country, ip, count, risk }: { country: string; ip: string; count: number; risk: number }) {
  return (
    <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-semibold text-text-primary">{country}</span>
        <span className={`font-data text-[11px] font-bold ${risk >= 80 ? 'text-sev-critical' : risk >= 50 ? 'text-sev-medium' : 'text-sev-low'}`}>{risk}</span>
      </div>
      <div className="font-data text-[11.5px] text-text-muted mb-2">{ip} · {count} attempt{count !== 1 ? 's' : ''}</div>
      <RiskBar score={risk} />
    </div>
  )
}
