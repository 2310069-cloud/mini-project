import React, { useMemo, useState } from 'react'
import {
  Zap,
  ShieldBan,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search as SearchIcon,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { Card, CardHeader } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { MetricCard } from '../components/MetricCard'
import { formatDateTime, formatTime } from '../lib/format'

export function ResponsePage() {
  const {
    responseActions,
    verifications,
    executeBlockIp,
    backendConnected,
    successfulFirewallActions,
    verifiedPreventions,
    totalVerifications,
    totalResponses,
  } = useSoc()

  const [activeTab, setActiveTab] = useState<'responses' | 'verifications'>('responses')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  // Real Firewall Block Form state
  const [targetIp, setTargetIp] = useState('192.168.1.50')
  const [riskId, setRiskId] = useState('1')
  const [executing, setExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<{
    status: string
    response_id: number
    risk_id: number
    target_ip: string
    firewall_result: string
    verification_result: string
  } | null>(null)
  const [blockError, setBlockError] = useState<string | null>(null)

  const responseStatuses = useMemo(
    () => Array.from(new Set(responseActions.map((r) => r.status))),
    [responseActions]
  )
  const verificationResults = useMemo(
    () => Array.from(new Set(verifications.map((v) => v.result))),
    [verifications]
  )

  const filteredResponses = useMemo(() => {
    return responseActions.filter((r) => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.id.includes(q) &&
          !r.target.includes(q) &&
          !(r.detail || '').toLowerCase().includes(q) &&
          !(r.triggeredBy || '').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [responseActions, statusFilter, search])

  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      if (statusFilter !== 'All' && v.result !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !String(v.verificationId).includes(q) &&
          !String(v.responseId).includes(q) &&
          !(v.targetIp || '').includes(q) &&
          !(v.notes || '').toLowerCase().includes(q) &&
          !v.result.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [verifications, statusFilter, search])

  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setBlockError(null)
    setLastResult(null)

    const rId = parseInt(riskId.trim(), 10)
    if (isNaN(rId) || rId <= 0) {
      setBlockError('Please specify a valid numeric Risk ID.')
      return
    }
    if (!targetIp.trim()) {
      setBlockError('Please specify a valid Target IP address.')
      return
    }

    setExecuting(true)
    try {
      const result = await executeBlockIp(rId, targetIp.trim())
      setLastResult(result)
    } catch (err: any) {
      setBlockError(err?.message || 'Windows Firewall response execution failed.')
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Zap size={20} className="text-accent" /> Windows Firewall & Containment Console
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Real response enforcement & firewall verification records from FastAPI backend
          {backendConnected && (
            <span className="ml-2 text-status-success font-medium">(FastAPI live sync)</span>
          )}
        </p>
      </div>

      {/* KPI Metrics: Clearly distinguishing Successful Firewall Actions from Verified Attack Prevention */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <MetricCard
          label="Total Responses Logged"
          value={String(totalResponses)}
          footnote="FastAPI /responses records"
          icon={<Zap size={15} />}
        />
        <MetricCard
          label="Successful Firewall Actions"
          value={`${successfulFirewallActions} / ${totalResponses}`}
          footnote="Firewall command status: SUCCESS"
          icon={<ShieldBan size={15} />}
          accentClass="text-accent"
        />
        <MetricCard
          label="Verified Attack Prevention"
          value={`${verifiedPreventions} / ${totalVerifications}`}
          footnote="Firewall rule verified (STOPPED)"
          icon={<ShieldCheck size={15} />}
          accentClass="text-status-success"
        />
        <MetricCard
          label="Unverified / Inconclusive"
          value={String(totalVerifications - verifiedPreventions)}
          footnote="Netsh status: UNKNOWN"
          icon={<HelpCircle size={15} />}
          accentClass="text-sev-medium"
        />
      </div>

      {/* Windows Firewall Manual Block Trigger Form */}
      <Card>
        <CardHeader
          title="Manual Windows Firewall Containment Execution"
          subtitle="Executes genuine netsh advfirewall rule through FastAPI POST /responses/block-ip"
        />

        <form onSubmit={handleManualBlock} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Target IP to Block
              </label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="e.g. 185.220.101.42"
                required
                className="w-full bg-surface-3 border border-surface-borderLight rounded px-3 py-2 text-[13px] text-text-primary font-data focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                Associated Risk ID
              </label>
              <input
                type="number"
                min="1"
                value={riskId}
                onChange={(e) => setRiskId(e.target.value)}
                placeholder="1"
                required
                className="w-full bg-surface-3 border border-surface-borderLight rounded px-3 py-2 text-[13px] text-text-primary font-data focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={executing}
                className="w-full bg-sev-critical hover:bg-sev-critical/90 text-white font-semibold text-[13px] py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShieldBan size={16} />
                {executing ? 'Executing Firewall Block...' : 'Execute Windows Firewall Block'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>Observed Attacker IPs:</span>
            {['192.168.1.50', '192.168.1.53', '192.168.1.56', '192.168.1.60'].map((ip) => (
              <button
                key={ip}
                type="button"
                onClick={() => {
                  setTargetIp(ip)
                  setRiskId('1')
                }}
                className="px-2 py-0.5 rounded bg-surface-4 text-text-secondary hover:text-text-primary font-data text-[11px]"
              >
                {ip}
              </button>
            ))}
          </div>
        </form>

        {blockError && (
          <div className="mt-4 p-3 rounded bg-sev-criticalBg border border-sev-critical/30 flex items-start gap-2.5 text-sev-critical text-[12.5px]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{blockError}</span>
          </div>
        )}

        {lastResult && (
          <div className="mt-4 p-3.5 rounded bg-surface-3 border border-surface-borderLight space-y-2">
            <div className="flex items-center gap-2 text-status-success font-semibold text-[13px]">
              <CheckCircle2 size={16} />
              <span>Response Recorded in Database (ID: #{lastResult.response_id})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-text-muted block text-[10.5px]">Target IP:</span>
                <span className="font-data text-text-primary font-semibold">{lastResult.target_ip}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10.5px]">Risk ID:</span>
                <span className="font-data text-text-primary">#{lastResult.risk_id}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10.5px]">Firewall Action Status:</span>
                <span
                  className={`font-data font-semibold ${
                    lastResult.firewall_result === 'SUCCESS' ? 'text-status-success' : 'text-sev-medium'
                  }`}
                >
                  {lastResult.firewall_result}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10.5px]">Verification Result:</span>
                <span className="font-data text-text-primary font-semibold">
                  {lastResult.verification_result}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs: Responses vs Verifications */}
      <div className="flex items-center justify-between border-b border-surface-border pb-2 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('responses')
              setStatusFilter('All')
            }}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              activeTab === 'responses'
                ? 'bg-accent/15 text-accent border border-accent/40'
                : 'text-text-secondary hover:text-text-primary bg-surface-2'
            }`}
          >
            Response Actions ({responseActions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('verifications')
              setStatusFilter('All')
            }}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              activeTab === 'verifications'
                ? 'bg-accent/15 text-accent border border-accent/40'
                : 'text-text-secondary hover:text-text-primary bg-surface-2'
            }`}
          >
            Verification Records ({verifications.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <SelectFilter
            label="Filter Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={activeTab === 'responses' ? responseStatuses : verificationResults}
          />
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === 'responses'
                ? 'Search target IP, details...'
                : 'Search verification notes, IP...'
            }
          />
        </div>
      </div>

      {/* Tab 1: Response Actions Table */}
      {activeTab === 'responses' && (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2.5">Resp ID</th>
                  <th className="text-left font-semibold px-2 py-2.5">Risk ID</th>
                  <th className="text-left font-semibold px-2 py-2.5">Target IP</th>
                  <th className="text-left font-semibold px-2 py-2.5">Action Taken</th>
                  <th className="text-left font-semibold px-2 py-2.5">Timestamp</th>
                  <th className="text-left font-semibold px-2 py-2.5">Execution Status</th>
                  <th className="text-left font-semibold px-4 py-2.5">Verified Attack Prevention</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((r) => (
                  <tr key={r.id} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2.5 font-data text-text-muted whitespace-nowrap">#{r.id}</td>
                    <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">
                      {r.riskId ? `#${r.riskId}` : '—'}
                    </td>
                    <td className="px-2 py-2.5 font-data font-semibold text-text-primary whitespace-nowrap">
                      {r.target}
                    </td>
                    <td className="px-2 py-2.5 text-text-primary whitespace-nowrap font-medium">
                      <span className="bg-surface-3 border border-surface-borderLight px-2 py-0.5 rounded text-[11.5px]">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-muted whitespace-nowrap">
                      {formatDateTime(r.timestamp)}
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {r.verificationResult === 'STOPPED' ? (
                        <span className="inline-flex items-center gap-1 font-data text-[11px] font-semibold text-status-success bg-status-successBg px-2 py-0.5 rounded border border-status-success/30">
                          <CheckCircle2 size={12} /> STOPPED (Verified)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-data text-[11px] text-text-muted bg-surface-3 px-2 py-0.5 rounded border border-surface-border">
                          {r.verificationResult || 'UNKNOWN'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResponses.length === 0 && (
            <div className="p-8 text-center text-text-muted text-xs">
              No response actions match filter
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Verification Records Table */}
      {activeTab === 'verifications' && (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                  <th className="text-left font-semibold px-4 py-2.5">Verification ID</th>
                  <th className="text-left font-semibold px-2 py-2.5">Response ID</th>
                  <th className="text-left font-semibold px-2 py-2.5">Target IP</th>
                  <th className="text-left font-semibold px-2 py-2.5">Verification Time</th>
                  <th className="text-left font-semibold px-2 py-2.5">Attempts Before / After</th>
                  <th className="text-left font-semibold px-2 py-2.5">Prevention Result</th>
                  <th className="text-left font-semibold px-4 py-2.5">Verification Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((v) => (
                  <tr key={v.id} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2.5 font-data text-text-muted whitespace-nowrap">
                      #{v.verificationId}
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">
                      #{v.responseId}
                    </td>
                    <td className="px-2 py-2.5 font-data font-semibold text-text-primary whitespace-nowrap">
                      {v.targetIp || '192.168.1.x'}
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-muted whitespace-nowrap">
                      {formatDateTime(v.timestamp)}
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">
                      {v.attemptsBefore} → {v.attemptsAfter}
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      {v.result === 'STOPPED' ? (
                        <span className="inline-flex items-center gap-1 font-data text-[11px] font-semibold text-status-success bg-status-successBg px-2 py-0.5 rounded border border-status-success/30">
                          <CheckCircle2 size={12} /> STOPPED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-data text-[11px] text-sev-medium bg-sev-mediumBg px-2 py-0.5 rounded border border-sev-medium/30">
                          UNKNOWN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary text-[12px] max-w-sm truncate">
                      {v.notes || 'Firewall verification completed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVerifications.length === 0 && (
            <div className="p-8 text-center text-text-muted text-xs">
              No verification records match filter
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
