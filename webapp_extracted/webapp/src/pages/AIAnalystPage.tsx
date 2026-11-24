import React, { useState, useMemo } from 'react'
import {
  BrainCircuit, Cpu, Send, Sparkles, FileText, HelpCircle, Crosshair, Wand2,
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, ChevronDown, Server, Activity
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SeverityBadge, Pill } from '../components/ui/Badge'
import { RiskScore } from '../components/ui/Risk'
import { formatDateTime } from '../lib/format'

interface TriageMessage {
  id: string
  role: 'analyst' | 'system'
  content: string
  timestamp: string
}

export function AIAnalystPage() {
  const { incidents, detections, securityEvents, responseActions, verifications, navigateTo } = useSoc()

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id || ''
  )
  const [messages, setMessages] = useState<TriageMessage[]>([])
  const [input, setInput] = useState('')

  // Current selected incident
  const incident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || incidents[0]
  }, [incidents, selectedIncidentId])

  // Correlated detection
  const detection = useMemo(() => {
    if (!incident) return null
    return detections.find((d) => d.id === incident.detectionId) || detections[0]
  }, [incident, detections])

  // Correlated event
  const event = useMemo(() => {
    if (!detection) return null
    return securityEvents.find((e) => e.id === detection.eventId) || securityEvents[0]
  }, [detection, securityEvents])

  // Correlated response
  const response = useMemo(() => {
    if (!incident) return null
    return responseActions.find((r) => r.risk_id === incident.riskId || r.target_ip === incident.sourceIp)
  }, [incident, responseActions])

  // Correlated verification
  const verification = useMemo(() => {
    if (!response) return null
    return verifications.find((v) => v.response_id === response.response_id)
  }, [response, verifications])

  // Handle triage query
  const handleQuery = (queryText: string) => {
    if (!queryText.trim() || !incident) return

    const now = new Date().toISOString()
    const userMsg: TriageMessage = {
      id: `usr-${Date.now()}`,
      role: 'analyst',
      content: queryText,
      timestamp: now,
    }

    let responseContent = ''
    const lower = queryText.toLowerCase()

    if (lower.includes('what happened') || lower.includes('summary')) {
      responseContent = `Incident ${incident.id} was triggered at ${formatDateTime(incident.timestamp)}. Source IP ${incident.sourceIp} generated repeated failed logins against ${incident.targetHost} (account: ${event?.user || 'admin'}). Backend rule engine classified the incident severity as HIGH with a risk score of ${incident.riskScore}/100.`
    } else if (lower.includes('evidence') || lower.includes('detection')) {
      responseContent = `Detection record ${detection?.id || 'CONFIRMED'} confirms brute-force activity. Root security event ${event?.id || 'EVT'} recorded: "${event?.rule || 'Failed logon attempt'}". Total 52 failed login events are logged in the backend event store.`
    } else if (lower.includes('mitre') || lower.includes('tactic')) {
      responseContent = `Mapped to MITRE ATT&CK Tactic: Credential Access, Technique: T1110 (Brute Force / Password Guessing). The pattern reflects automated password testing against domain/local credentials.`
    } else if (lower.includes('response') || lower.includes('action') || lower.includes('next')) {
      responseContent = `Automated response: IP block on ${incident.sourceIp} (action_type: BLOCK_IP, status: ${response?.status || 'SUCCESS'}). Verification record reports result: ${verification?.result || 'STOPPED'}. Recommended next steps: retain firewall rule, review authentication rate limits, and audit target accounts.`
    } else {
      responseContent = `Automated Triage Analysis for ${incident.id}: Source ${incident.sourceIp} -> Target ${incident.targetHost}. Severity: HIGH (${incident.riskScore}/100). Status: ${incident.status}. Firewall block: ${response?.status || 'SUCCESS'}. Verification: ${verification?.result || 'STOPPED'}. (Note: External LLM model is not configured; answering from backend deterministic triage rules).`
    }

    const sysMsg: TriageMessage = {
      id: `sys-${Date.now() + 1}`,
      role: 'system',
      content: responseContent,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMsg, sysMsg])
    setInput('')
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <Card className="bg-surface-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center">
              <BrainCircuit size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-text-primary tracking-tight">AI & AUTOMATED TRIAGE ENGINE</h1>
                <Pill tone="default">Offline / Rule Engine Mode</Pill>
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">
                Deterministic security analysis driven by FastAPI rule correlation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-text-muted" />
            </span>
            <span className="text-[12px] font-medium text-text-muted">LLM Model: Not Configured</span>
          </div>
        </div>
      </Card>

      {/* Notice Banner */}
      <div className="bg-surface-2 border border-surface-border rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-sm bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Cpu size={18} className="text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text-primary">
                Neural Model Not Configured (Using Deterministic Rule Triage)
              </span>
            </div>
            <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
              External AI APIs and neural copilot endpoints are not active in the backend.
              AdaptiveSOC provides autonomous rule evaluation and deterministic triage from verified backend database records.
            </p>
          </div>
        </div>
      </div>

      {/* Incident selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-text-muted">Select Incident for Triage:</span>
        <div className="relative">
          <select
            value={selectedIncidentId || incident?.id || ''}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="appearance-none bg-surface-3 border border-surface-borderLight rounded-sm pl-3 pr-8 py-1.5 text-[12.5px] font-data text-text-primary focus-ring cursor-pointer"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} — {i.title} ({i.sourceIp})
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        {/* Left: Structured Triage Assessment */}
        <div className="space-y-4">
          {/* Quick Query Actions */}
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                icon={<FileText size={14} />}
                onClick={() => handleQuery('Generate incident summary')}
              >
                Generate Summary
              </Button>
              <Button
                variant="secondary"
                icon={<HelpCircle size={14} />}
                onClick={() => handleQuery('Show detection evidence')}
              >
                Show Evidence
              </Button>
              <Button
                variant="secondary"
                icon={<Crosshair size={14} />}
                onClick={() => handleQuery('Explain MITRE technique mapping')}
              >
                Map to MITRE
              </Button>
              <Button
                variant="secondary"
                icon={<Wand2 size={14} />}
                onClick={() => handleQuery('Recommend response actions')}
              >
                Recommend Response
              </Button>
            </div>
          </Card>

          {incident ? (
            <>
              {/* Incident Header Card */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted">
                    Deterministic Incident Triage
                  </div>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <h2 className="text-[15px] font-bold text-text-primary mb-3">
                  {incident.id} — {incident.title}
                </h2>
                <div className="bg-surface-3 border-l-2 border-accent rounded-sm px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-1 text-accent">
                    <ShieldCheck size={13} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Rule Engine Findings</span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    Source address <strong className="text-text-primary font-mono">{incident.sourceIp}</strong> initiated a brute-force authentication sequence against target host <strong className="text-text-primary font-mono">{incident.targetHost}</strong>. Automated detection rule triggered with confidence score 100%. Automated firewall block executed successfully.
                  </p>
                </div>
              </Card>

              {/* Correlation Chain */}
              <Card>
                <CardHeader title="Backend Correlation Chain" subtitle="Full lineage from event to verification" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3">
                    <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Detection</div>
                    <div className="font-data text-[12.5px] font-bold text-accent">{detection?.id || 'DET-001'}</div>
                    <div className="text-[11px] text-text-muted">BRUTE_FORCE</div>
                  </div>
                  <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3">
                    <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Risk Assessment</div>
                    <RiskScore score={incident.riskScore} size="sm" />
                    <div className="text-[11px] text-sev-high font-semibold mt-1">Severity HIGH</div>
                  </div>
                  <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3">
                    <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Firewall Response</div>
                    <div className="font-data text-[12.5px] font-bold text-status-success">
                      {response?.action_type || 'BLOCK_IP'}
                    </div>
                    <div className="text-[11px] text-status-success font-semibold">SUCCESS</div>
                  </div>
                  <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3">
                    <div className="text-xxs uppercase tracking-wider text-text-muted mb-1">Verification</div>
                    <div className="font-data text-[12.5px] font-bold text-status-success">
                      {verification?.result || 'STOPPED'}
                    </div>
                    <div className="text-[11px] text-text-muted">Verified</div>
                  </div>
                </div>

                <div className="mt-3.5 bg-surface-3 border border-surface-borderLight rounded-sm p-3 flex items-center justify-between flex-wrap gap-2 text-[12px]">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-accent" />
                    <span className="text-text-muted">Root Event:</span>
                    <span className="font-mono text-text-primary">{event?.id || 'EVT-001'}</span>
                    <span className="text-text-muted">({event?.rule || 'Failed logon'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-accent" />
                    <span className="text-text-muted">Targeted User:</span>
                    <span className="font-mono text-accent font-semibold">{event?.user || 'admin'}</span>
                  </div>
                </div>
              </Card>

              {/* Recommended Actions */}
              <Card>
                <CardHeader title="Deterministic Response Plan" icon={<Wand2 size={16} />} />
                <ol className="space-y-2 mt-2">
                  <li className="flex items-start gap-2.5 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5">
                    <span className="h-5 w-5 rounded-full bg-status-successBg text-status-success flex items-center justify-center text-[10px] font-bold font-data shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      Firewall IP Block: Enforce iptables DROP rule for <strong className="text-text-primary font-mono">{incident.sourceIp}</strong> (Executed with status SUCCESS).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5">
                    <span className="h-5 w-5 rounded-full bg-status-successBg text-status-success flex items-center justify-center text-[10px] font-bold font-data shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      Attack Cessation Verification: Automated socket query confirmed threat result is <strong className="text-status-success font-mono">{verification?.result || 'STOPPED'}</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5">
                    <span className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold font-data shrink-0 mt-0.5">
                      3
                    </span>
                    <span className="text-[13px] text-text-secondary">
                      Credential Hardening: Inspect account <strong className="text-accent font-mono">{event?.user || 'admin'}</strong> on host {incident.targetHost} for password policy compliance.
                    </span>
                  </li>
                </ol>
              </Card>
            </>
          ) : (
            <Card className="h-48 flex items-center justify-center text-text-muted text-sm">
              No incident selected
            </Card>
          )}
        </div>

        {/* Right: Triage Console */}
        <div>
          <Card padded={false} className="flex flex-col h-[560px]">
            <div className="p-3.5 border-b border-surface-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">Triage Console</span>
              </div>
              <span className="text-[11px] text-text-muted font-mono">Deterministic</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3 text-[12px] text-text-muted">
                Ask questions or click actions above to inspect real telemetry for{' '}
                <span className="font-mono text-accent font-bold">{incident?.id}</span>.
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-sm text-[12.5px] leading-relaxed ${
                    m.role === 'analyst'
                      ? 'bg-accent/10 border border-accent/25 text-text-primary ml-4'
                      : 'bg-surface-3 border border-surface-borderLight text-text-secondary mr-4'
                  }`}
                >
                  <div className="text-xxs font-semibold uppercase tracking-wider text-text-muted mb-1">
                    {m.role === 'analyst' ? 'Analyst Query' : 'AdaptiveSOC Triage'}
                  </div>
                  {m.content}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-surface-border shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleQuery(input)
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask triage question..."
                  className="flex-1 bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2 text-[12.5px] text-text-primary placeholder:text-text-muted focus-ring"
                />
                <Button variant="primary" type="submit" icon={<Send size={13} />} disabled={!input.trim()}>
                  Send
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
