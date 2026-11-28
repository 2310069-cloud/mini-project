import React, { useState, useEffect, useRef } from 'react'
import {
  Flame, KeyRound, ShieldAlert, CheckCircle2, Play, Terminal, ShieldCheck,
  Zap, AlertTriangle, RefreshCw, Server, Globe2, X, FileText, ArrowRight,
  Database, Cpu, Lock, Mail
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { WAZUH_THREAT_INTEL_DATABASE } from '../data/wazuhThreatIntel'
import type { AttackType } from '../types'
import { Button } from './ui/Button'

interface AttackSimulatorModalProps {
  onClose: () => void
}

export function AttackSimulatorModal({ onClose }: AttackSimulatorModalProps) {
  const {
    activeAttack,
    triggerLiveAttack,
    solveCurrentAttack,
    incidentReports,
    viewReport,
    emailConfig,
    dispatchedEmails,
    setActiveEmailModal,
    navigateTo,
  } = useSoc()

  const [selectedAttackType, setSelectedAttackType] = useState<AttackType>('brute-force')
  const [selectedVulnerableIp, setSelectedVulnerableIp] = useState<string>('185.220.101.42')
  const [selectedCleanIp, setSelectedCleanIp] = useState<string>('10.0.10.14')
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll terminal on new logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [activeAttack?.logs])

  const vulnerableIps = WAZUH_THREAT_INTEL_DATABASE.filter((item) => item.reputation !== 'Clean')
  const cleanIps = WAZUH_THREAT_INTEL_DATABASE.filter((item) => item.reputation === 'Clean')

  const handleLaunch = () => {
    const ip = selectedAttackType === 'brute-force' ? selectedVulnerableIp : selectedCleanIp
    triggerLiveAttack(selectedAttackType, ip)
  }

  const isRunning = activeAttack?.status === 'running'
  const isMitigating = activeAttack?.status === 'mitigating'
  const isDetected = activeAttack?.status === 'detected'
  const isSolved = activeAttack?.status === 'solved'

  const selectedIntel = WAZUH_THREAT_INTEL_DATABASE.find(
    (item) => item.ip === (selectedAttackType === 'brute-force' ? selectedVulnerableIp : selectedCleanIp)
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface-1 border border-surface-borderLight rounded-lg w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between bg-surface-2/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  SOC Attack Simulation & Live Detection Lab
                </h2>
                <span className="text-xxs px-2 py-0.5 rounded font-bold uppercase bg-status-danger/15 text-status-danger border border-status-danger/30 animate-pulse">
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Simulate attacks live, stream logs into the SOC engine, match Wazuh vulnerable IPs, and generate post-incident reports.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-sm hover:bg-surface-3 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Attack Type Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedAttackType('brute-force')}
              disabled={isRunning || isMitigating}
              className={`p-3.5 rounded-md border text-left transition-all ${
                selectedAttackType === 'brute-force'
                  ? 'bg-sev-critical/10 border-sev-critical/60 shadow-md shadow-sev-critical/5'
                  : 'bg-surface-2/60 border-surface-border hover:bg-surface-2'
              } ${isRunning || isMitigating ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-sev-critical">
                  <Flame size={15} /> Attack 1: Brute Force Attack
                </span>
                <span className="text-xxs px-1.5 py-0.5 rounded font-bold uppercase bg-sev-critical/20 text-sev-critical">
                  High Severity
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Rapid credential guessing against Domain Controller (<span className="font-data font-semibold text-text-primary">WIN-DC01</span>) targeting <span className="font-data font-semibold text-text-primary">administrator</span> using Wazuh blacklisted IP.
              </p>
            </button>

            <button
              onClick={() => setSelectedAttackType('normal-login')}
              disabled={isRunning || isMitigating}
              className={`p-3.5 rounded-md border text-left transition-all ${
                selectedAttackType === 'normal-login'
                  ? 'bg-status-success/10 border-status-success/60 shadow-md shadow-status-success/5'
                  : 'bg-surface-2/60 border-surface-border hover:bg-surface-2'
              } ${isRunning || isMitigating ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-status-success">
                  <CheckCircle2 size={15} /> Scenario 2: Normal Login (Baseline)
                </span>
                <span className="text-xxs px-1.5 py-0.5 rounded font-bold uppercase bg-status-success/20 text-status-success">
                  Clean / Baseline
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Authorized user login (<span className="font-data font-semibold text-text-primary">m.chen</span>) from clean internal IP (<span className="font-data font-semibold text-text-primary">10.0.10.14</span>). Validates that the SOC does not generate false positives.
              </p>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="bg-surface-2/70 border border-surface-border rounded-md p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <span>Attack Parameters & Wazuh Threat Intel Mapping</span>
              <span className="text-xxs text-accent font-data">AI CORRELATION ENGINE ACTIVE</span>
            </div>

            {selectedAttackType === 'brute-force' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Select Vulnerable / Malicious IP (from Wazuh Threat Intel Database):
                  </label>
                  <select
                    value={selectedVulnerableIp}
                    onChange={(e) => setSelectedVulnerableIp(e.target.value)}
                    disabled={isRunning || isMitigating}
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary font-data focus:outline-none focus:border-accent"
                  >
                    {vulnerableIps.map((entry) => (
                      <option key={entry.ip} value={entry.ip}>
                        {entry.ip} — {entry.country} (Wazuh Rule: {entry.wazuhRuleId}, Risk: {entry.threatScore}/100)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-surface-3/80 p-2.5 rounded border border-surface-border text-xs space-y-1 font-data">
                  <div className="text-xxs text-text-muted uppercase">Matched Threat Intelligence:</div>
                  <div className="text-text-primary font-semibold flex items-center gap-1.5">
                    <Globe2 size={13} className="text-sev-critical" />
                    {selectedIntel?.classification}
                  </div>
                  <div className="text-text-secondary text-xxs">
                    Rule {selectedIntel?.wazuhRuleId} · {selectedIntel?.asn} · Threat Actor: {selectedIntel?.threatActor}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Select Clean Authorized IP (Internal Whitelist):
                  </label>
                  <select
                    value={selectedCleanIp}
                    onChange={(e) => setSelectedCleanIp(e.target.value)}
                    disabled={isRunning || isMitigating}
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary font-data focus:outline-none focus:border-accent"
                  >
                    {cleanIps.map((entry) => (
                      <option key={entry.ip} value={entry.ip}>
                        {entry.ip} — {entry.classification} (Clean Whitelist)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-surface-3/80 p-2.5 rounded border border-surface-border text-xs space-y-1 font-data">
                  <div className="text-xxs text-text-muted uppercase">Baseline Reputation:</div>
                  <div className="text-status-success font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Verified Clean (Score: 0/100)
                  </div>
                  <div className="text-text-secondary text-xxs">
                    Authorized internal identity · Whitelisted domain asset
                  </div>
                </div>
              </div>
            )}

            {/* 4 Inboxes Emergency Email Alert Status */}
            <div className="bg-surface-3/50 p-2.5 rounded border border-surface-border text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-accent shrink-0" />
                <span className="text-text-secondary">
                  Emergency Alerts: <strong className="text-text-primary">4 Inboxes Active</strong> ({emailConfig.recipients.slice(0, 2).join(', ')}...)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {dispatchedEmails.length > 0 && (
                  <button
                    onClick={() => setActiveEmailModal(dispatchedEmails[0])}
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Dispatched Email ({dispatchedEmails.length})
                  </button>
                )}
                <button
                  onClick={() => { onClose(); navigateTo('settings') }}
                  className="text-xxs text-text-muted hover:text-text-primary underline"
                >
                  Configure Inboxes
                </button>
              </div>
            </div>

            {/* Launch / Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
              <div className="flex items-center gap-2 text-xs">
                {isRunning && (
                  <span className="flex items-center gap-2 text-accent font-semibold">
                    <RefreshCw size={13} className="animate-spin" />
                    Streaming Live Telemetry ({activeAttack.currentAttempt} / {activeAttack.totalAttempts} attempts)...
                  </span>
                )}
                {isDetected && (
                  <span className="flex items-center gap-2 text-sev-critical font-bold animate-pulse">
                    <AlertTriangle size={15} />
                    ATTACK CONFIRMED BY WAZUH AI! Awaiting Containment.
                  </span>
                )}
                {isMitigating && (
                  <span className="flex items-center gap-2 text-status-warning font-semibold">
                    <RefreshCw size={13} className="animate-spin" />
                    Executing Wazuh Active Response (Firewall Drop & Lockout)...
                  </span>
                )}
                {isSolved && (
                  <span className="flex items-center gap-2 text-status-success font-semibold">
                    <CheckCircle2 size={15} />
                    Attack Contained & Incident Report Generated!
                  </span>
                )}
                {!isRunning && !isDetected && !isMitigating && !isSolved && (
                  <span className="text-text-muted">
                    Ready to initiate live telemetry streaming.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                  onClick={handleLaunch}
                  disabled={isRunning || isMitigating}
                >
                  {isRunning ? 'Simulating...' : selectedAttackType === 'brute-force' ? 'Launch Brute Force' : 'Simulate Normal Login'}
                </Button>

                {isDetected && selectedAttackType === 'brute-force' && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Lock size={13} />}
                    onClick={solveCurrentAttack}
                    className="animate-bounce"
                  >
                    Contain & Solve Attack (Active Response)
                  </Button>
                )}

                {isSolved && activeAttack?.reportId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileText size={13} />}
                    onClick={() => {
                      const rep = incidentReports.find((r) => r.id === activeAttack.reportId)
                      if (rep) viewReport(rep)
                    }}
                  >
                    View Generated Report
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Streaming Terminal */}
          <div className="bg-surface-0 border border-surface-border rounded-md overflow-hidden">
            <div className="px-3.5 py-2 bg-surface-3/80 border-b border-surface-border flex items-center justify-between text-xs font-data">
              <div className="flex items-center gap-2 text-text-secondary">
                <Terminal size={14} className="text-accent" />
                <span className="font-semibold text-text-primary">Live SIEM / Wazuh Ingestion Stream</span>
              </div>
              <div className="flex items-center gap-3 text-xxs text-text-muted">
                <span>BUFFER: {activeAttack?.logs.length || 0} EVENTS</span>
                <span className="flex items-center gap-1 text-status-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-ping" /> ACTIVE
                </span>
              </div>
            </div>

            <div
              ref={terminalRef}
              className="p-3 font-data text-xs space-y-1.5 max-h-[240px] min-h-[160px] overflow-y-auto bg-black/40 text-text-secondary"
            >
              {activeAttack && activeAttack.logs.length > 0 ? (
                activeAttack.logs.map((log) => (
                  <div key={log.id} className="leading-relaxed hover:bg-white/[0.03] px-1 rounded flex items-start gap-2">
                    <span className="text-text-muted text-xxs shrink-0 select-none">
                      [{log.timestamp.split('T')[1]?.slice(0, 8)}]
                    </span>
                    <span
                      className={`text-xxs px-1.5 py-0.2 rounded font-bold shrink-0 uppercase ${
                        log.level === 'CRITICAL'
                          ? 'bg-sev-critical/20 text-sev-critical'
                          : log.level === 'HIGH'
                          ? 'bg-sev-high/20 text-sev-high'
                          : 'bg-status-success/20 text-status-success'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-text-primary break-all">
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted py-8 text-center">
                  Live log ingestion idle. Choose an attack scenario above and click Launch to start live telemetry stream.
                </div>
              )}
            </div>
          </div>

          {/* Wazuh AI Correlation Box (Real-time Verdict) */}
          {activeAttack && (
            <div className={`p-4 rounded-md border text-xs space-y-2 ${
              activeAttack.matchedIntel?.reputation === 'Clean'
                ? 'bg-status-success/10 border-status-success/30 text-text-primary'
                : 'bg-sev-critical/10 border-sev-critical/30 text-text-primary'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <Cpu size={15} className="text-accent" />
                  <span>Wazuh AI Threat Correlation Engine:</span>
                </div>
                <span className={`text-xxs px-2 py-0.5 rounded-full font-bold uppercase ${
                  activeAttack.matchedIntel?.reputation === 'Clean'
                    ? 'bg-status-success/20 text-status-success'
                    : 'bg-sev-critical/20 text-sev-critical'
                }`}>
                  {activeAttack.matchedIntel?.reputation === 'Clean' ? 'CLEAN BASELINE' : 'MALICIOUS IP MATCH'}
                </span>
              </div>

              <div className="text-xs leading-relaxed font-data">
                {activeAttack.matchedIntel?.reputation === 'Clean' ? (
                  <span>
                    IP <strong className="text-status-success">{activeAttack.sourceIp}</strong> matched corporate whitelist. Threat score: 0/100. Behavioral model categorizes this as expected authorized authentication.
                  </span>
                ) : (
                  <span>
                    IP <strong className="text-sev-critical">{activeAttack.sourceIp}</strong> correlated with Wazuh Threat Rule <strong className="text-text-primary">{activeAttack.matchedIntel?.wazuhRuleId}</strong>. Country: {activeAttack.matchedIntel?.country} ({activeAttack.matchedIntel?.asn}). Risk: {activeAttack.matchedIntel?.threatScore}/100.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Previously Generated Reports Quick Access */}
          {incidentReports.length > 0 && (
            <div className="pt-2 border-t border-surface-border">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Available Incident Reports ({incidentReports.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {incidentReports.slice(0, 4).map((report) => (
                  <div
                    key={report.id}
                    onClick={() => viewReport(report)}
                    className="p-2.5 rounded bg-surface-2 border border-surface-border hover:border-accent/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-text-primary truncate">{report.title}</div>
                      <div className="text-xxs text-text-muted font-data mt-0.5">
                        {report.id} · {report.sourceIp} · {report.generatedAt.split('T')[0]}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-2/60 flex items-center justify-between shrink-0">
          <span className="text-xs text-text-muted">
            AdaptiveSOC Real-Time Threat Ingestion Pipeline
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  )
}
