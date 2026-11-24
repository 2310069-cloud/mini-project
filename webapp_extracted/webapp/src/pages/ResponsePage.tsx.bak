import React, { useMemo, useState } from 'react'
import {
  Zap, ShieldBan, Server, KeyRound, Skull, FileSearch, FolderPlus, BellRing, RefreshCcw, Plus,
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { SelectFilter } from '../components/ui/Filters'
import { formatTime } from '../lib/format'
import type { ResponseActionType } from '../types'

const ACTION_ICON: Record<ResponseActionType, any> = {
  'Block IP': ShieldBan,
  'Isolate Host': Server,
  'Disable Account': KeyRound,
  'Kill Process': Skull,
  'Collect Evidence': FileSearch,
  'Create Incident': FolderPlus,
  'Send Alert': BellRing,
  'Force Password Reset': RefreshCcw,
}

const MANUAL_ACTIONS: { action: ResponseActionType; target: string; desc: string }[] = [
  { action: 'Block IP', target: '185.220.101.42', desc: 'Add to perimeter firewall deny list' },
  { action: 'Isolate Host', target: 'WIN-APP02', desc: 'Move to network quarantine VLAN' },
  { action: 'Disable Account', target: 'svc_backup', desc: 'Suspend authentication for this account' },
  { action: 'Kill Process', target: 'powershell.exe (PID 6104)', desc: 'Terminate suspicious process' },
  { action: 'Collect Evidence', target: 'WIN-APP02', desc: 'Capture memory + disk forensic snapshot' },
  { action: 'Force Password Reset', target: 'administrator', desc: 'Require credential rotation on next logon' },
]

export function ResponsePage() {
  const { responseActions, executeAction, addResponseAction } = useSoc()
  const [status, setStatus] = useState('All')

  const statuses = useMemo(() => Array.from(new Set(responseActions.map((r) => r.status))), [responseActions])

  const filtered = useMemo(() => {
    return responseActions.filter((r) => (status === 'All' ? true : r.status === status))
  }, [responseActions, status])

  const triggerManualAction = (action: ResponseActionType, target: string) => {
    const id = `RSP-${Math.floor(1000 + Math.random() * 9000)}`
    addResponseAction({
      id,
      action,
      target,
      triggeredBy: 'S.Okafor (Manual)',
      timestamp: new Date().toISOString(),
      status: 'Pending',
      detail: `Manually triggered from Response Actions console.`,
    })
    setTimeout(() => executeAction(id), 300)
  }

  const counts = {
    completed: responseActions.filter((r) => r.status === 'Completed').length,
    pending: responseActions.filter((r) => r.status === 'Pending').length,
    executing: responseActions.filter((r) => r.status === 'Executing').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Zap size={20} className="text-accent" /> Response Actions
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Automated and manual incident response execution · {counts.completed} completed, {counts.pending} pending
        </p>
      </div>

      {/* Manual action triggers */}
      <Card>
        <CardHeader title="Manual Response Console" subtitle="Simulate an analyst-triggered containment action" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {MANUAL_ACTIONS.map((ma) => {
            const Icon = ACTION_ICON[ma.action]
            return (
              <button
                key={ma.action + ma.target}
                onClick={() => triggerManualAction(ma.action, ma.target)}
                className="text-left bg-surface-3 border border-surface-borderLight rounded-sm p-3 hover:border-accent/40 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-7 w-7 rounded-sm bg-surface-4 text-text-secondary group-hover:text-accent group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                    <Icon size={13} />
                  </div>
                  <span className="text-[13px] font-semibold text-text-primary">{ma.action}</span>
                </div>
                <div className="font-data text-[11.5px] text-text-secondary mb-1">{ma.target}</div>
                <p className="text-[11px] text-text-muted">{ma.desc}</p>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2.5">
        <SelectFilter label="Status" value={status} onChange={setStatus} options={statuses} />
      </div>

      {/* Action log */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-surface-border text-text-muted text-xxs uppercase tracking-wider">
                <th className="text-left font-semibold px-4 py-2.5">Action</th>
                <th className="text-left font-semibold px-2 py-2.5">Target</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden md:table-cell">Triggered By</th>
                <th className="text-left font-semibold px-2 py-2.5 hidden sm:table-cell">Timestamp</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-right font-semibold px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const Icon = ACTION_ICON[r.action] ?? Zap
                return (
                  <tr key={r.id} className="tr-hover border-b border-surface-border/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-sm bg-surface-4 text-text-secondary flex items-center justify-center shrink-0">
                          <Icon size={13} />
                        </div>
                        <span className="font-semibold text-text-primary whitespace-nowrap">{r.action}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 font-data text-text-secondary whitespace-nowrap">{r.target}</td>
                    <td className="px-2 py-2.5 text-text-secondary hidden md:table-cell whitespace-nowrap">{r.triggeredBy}</td>
                    <td className="px-2 py-2.5 font-data text-text-muted hidden sm:table-cell whitespace-nowrap">{formatTime(r.timestamp)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-right">
                      {r.status === 'Pending' && (
                        <Button size="sm" variant="primary" onClick={() => executeAction(r.id)}>Execute</Button>
                      )}
                      {r.status === 'Executing' && (
                        <span className="text-[11px] text-sev-low font-medium">Running...</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
