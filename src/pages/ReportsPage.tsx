import React, { useState } from 'react'
import {
  FileBarChart, FileText, Download, FileSpreadsheet, Loader2, CheckCircle2,
  ShieldAlert, KeyRound, Crosshair, FolderOpen, Zap, ShieldCheck, ArrowRight,
  Globe2, Server, Eye
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import type { AttackIncidentReport } from '../types'

interface ReportDef {
  id: string
  title: string
  description: string
  icon: any
  lastGenerated: string
}

const REPORTS: ReportDef[] = [
  {
    id: 'daily-summary',
    title: 'Daily SOC Summary',
    description: 'Overview of events, alerts, incidents, and response actions for the last 24 hours.',
    icon: FileBarChart,
    lastGenerated: '2026-09-30 06:00',
  },
  {
    id: 'incident-report',
    title: 'Incident Report',
    description: 'Detailed breakdown of open and resolved incidents including timelines and MITRE mapping.',
    icon: FolderOpen,
    lastGenerated: '2026-09-29 18:00',
  },
  {
    id: 'threat-detection',
    title: 'Threat Detection Report',
    description: 'Detection rule performance, trigger volume, and false-positive analysis.',
    icon: ShieldAlert,
    lastGenerated: '2026-09-29 12:00',
  },
  {
    id: 'auth-report',
    title: 'Authentication Report',
    description: 'Login success/failure trends, privileged account activity, and geo-anomalies.',
    icon: KeyRound,
    lastGenerated: '2026-09-28 09:00',
  },
  {
    id: 'mitre-coverage',
    title: 'MITRE Coverage Report',
    description: 'Detection coverage mapped against the MITRE ATT&CK framework by tactic.',
    icon: Crosshair,
    lastGenerated: '2026-09-27 15:00',
  },
]

export function ReportsPage() {
  const { incidentReports, viewReport, setSimulatorOpen } = useSoc()
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())

  const handleGenerate = (id: string) => {
    setGenerating(id)
    setTimeout(() => {
      setGenerating(null)
      setGenerated((prev) => new Set(prev).add(id))
    }, 1500)
  }

  const handleExport = (title: string, format: 'PDF' | 'CSV') => {
    const blob = new Blob(
      [`AdaptiveSOC — ${title}\nGenerated: ${new Date().toISOString()}\nFormat: ${format}\n\nThis is a simulated export for prototype demonstration purposes.`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}.${format === 'PDF' ? 'pdf' : 'csv'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportIncidentReport = (rep: AttackIncidentReport) => {
    const content = `
ADAPTIVESOC INCIDENT REPORT - ${rep.id}
Generated: ${rep.generatedAt}
Attack Type: ${rep.attackType.toUpperCase()}
Status: ${rep.status}
Source IP: ${rep.sourceIp} (${rep.country})
Target: ${rep.targetHost} / ${rep.targetUser}
Wazuh Match: ${rep.wazuhMatch ? 'YES' : 'NO'}
Wazuh Rule: ${rep.wazuhRuleId} (${rep.wazuhRuleDescription})
Threat Score: ${rep.threatScore}/100

Executive Summary:
${rep.executiveSummary}

AI Verdict:
${rep.aiVerdict}

Remediation Actions:
${rep.remediationActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${rep.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <FileBarChart size={20} className="text-accent" /> Security Reports & Incident Forensics
          </h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Post-incident analysis, live attack forensics, and scheduled compliance reports
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Zap size={14} />}
          onClick={() => setSimulatorOpen(true)}
        >
          Launch Attack Simulator
        </Button>
      </div>

      {/* Live Attack Incident Reports Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Live Attack & Incident Investigation Reports
            </h2>
            <span className="text-xxs px-2 py-0.5 rounded-full font-bold uppercase bg-accent/15 text-accent border border-accent/30 font-data">
              {incidentReports.length} Available
            </span>
          </div>
          {incidentReports.length > 0 && (
            <span className="text-xs text-text-muted">
              Auto-generated upon attack mitigation & baseline analysis
            </span>
          )}
        </div>

        {incidentReports.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {incidentReports.map((rep) => {
              const isMalicious = rep.wazuhMatch
              return (
                <Card key={rep.id}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-sm flex items-center justify-center shrink-0 border ${
                      isMalicious
                        ? 'bg-sev-critical/10 text-sev-critical border-sev-critical/25'
                        : 'bg-status-success/10 text-status-success border-status-success/25'
                    }`}>
                      {isMalicious ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-data text-xs text-text-muted">{rep.id}</span>
                        <span className={`text-xxs px-2 py-0.5 rounded-full font-bold uppercase ${
                          isMalicious ? 'bg-status-danger/20 text-status-danger' : 'bg-status-success/20 text-status-success'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-bold text-text-primary truncate mt-0.5">
                        {rep.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-[12.5px] text-text-secondary leading-relaxed mb-3 line-clamp-2">
                    {rep.executiveSummary}
                  </p>

                  <div className="bg-surface-3/60 p-2.5 rounded border border-surface-border text-xs font-data grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <span className="text-text-muted text-xxs block">Source IP:</span>
                      <span className="text-text-primary font-semibold">{rep.sourceIp}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-xxs block">Wazuh Rule:</span>
                      <span className="text-text-primary font-semibold">{rep.wazuhRuleId}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-xxs block">Target Host:</span>
                      <span className="text-text-primary font-semibold">{rep.targetHost}</span>
                    </div>
                    <div>
                      <span className="text-text-muted text-xxs block">Threat Score:</span>
                      <span className={`font-bold ${isMalicious ? 'text-sev-critical' : 'text-status-success'}`}>
                        {rep.threatScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Eye size={13} />}
                      onClick={() => viewReport(rep)}
                    >
                      View Full Report
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Download size={13} />}
                      onClick={() => exportIncidentReport(rep)}
                    >
                      Export Report
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="bg-surface-2 border border-surface-border border-dashed rounded-md p-6 text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-surface-3 flex items-center justify-center text-text-muted">
              <Zap size={20} />
            </div>
            <div className="text-sm font-semibold text-text-primary">
              No Live Attack Reports Generated Yet
            </div>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Use the Attack Simulator to simulate a Brute Force Attack (with Wazuh malicious IP) or Normal User Login. Once mitigated or executed, a comprehensive incident report will be generated automatically.
            </p>
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Zap size={14} />}
                onClick={() => setSimulatorOpen(true)}
              >
                Open Attack Simulator
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Standard Scheduled Reports Section */}
      <div className="space-y-3 pt-4 border-t border-surface-border">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Scheduled Compliance & Executive Reports
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {REPORTS.map((r) => {
            const Icon = r.icon
            const isGenerating = generating === r.id
            const isReady = generated.has(r.id)
            return (
              <Card key={r.id}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-text-primary">{r.title}</h3>
                    <p className="text-[12px] text-text-muted mt-0.5">Last generated: {r.lastGenerated}</p>
                  </div>
                  {isReady && <Pill tone="accent"><CheckCircle2 size={11} className="inline mr-1" />Ready</Pill>}
                </div>
                <p className="text-[12.5px] text-text-secondary leading-relaxed mb-4">{r.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={isGenerating ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                    onClick={() => handleGenerate(r.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={13} />}
                    onClick={() => handleExport(r.title, 'PDF')}
                    disabled={!isReady}
                  >
                    Export PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileSpreadsheet size={13} />}
                    onClick={() => handleExport(r.title, 'CSV')}
                    disabled={!isReady}
                  >
                    Export CSV
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
