import React, { useState } from 'react'
import {
  FileBarChart, FileText, Download, FileSpreadsheet, Loader2, CheckCircle2,
  ShieldAlert, KeyRound, Crosshair, FolderOpen,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import { formatDateTime } from '../lib/format'

interface ReportDef {
  id: string
  title: string
  description: string
  icon: any
  type: 'events' | 'detections' | 'incidents' | 'responses' | 'verifications'
}

const REPORTS: ReportDef[] = [
  {
    id: 'events-summary',
    title: 'Security Events Log Export',
    description: 'Raw security events with timestamps, event types, source IPs, and target hosts.',
    icon: FileBarChart,
    type: 'events',
  },
  {
    id: 'incident-report',
    title: 'Incident Analysis Export',
    description: 'High-severity incidents, attack timelines, assigned analysts, and resolution status.',
    icon: FolderOpen,
    type: 'incidents',
  },
  {
    id: 'threat-detection',
    title: 'Brute-Force Detections Export',
    description: 'Confirmed detections with rule conditions, risk scores, and correlated event IDs.',
    icon: ShieldAlert,
    type: 'detections',
  },
  {
    id: 'response-actions',
    title: 'Firewall Response Actions Export',
    description: 'Automated and manual firewall block actions (BLOCK_IP) with execution status.',
    icon: FileSpreadsheet,
    type: 'responses',
  },
  {
    id: 'verifications-report',
    title: 'Attack Prevention Verifications Export',
    description: 'Verification checks (STOPPED / UNKNOWN) confirming firewall containment outcome.',
    icon: CheckCircle2,
    type: 'verifications',
  },
]

export function ReportsPage() {
  const { securityEvents, detections, incidents, responseActions, verifications } = useSoc()
  const [generating, setGenerating] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  const handleExport = (report: ReportDef) => {
    setGenerating(report.id)
    setDownloadSuccess(null)

    setTimeout(() => {
      let csvContent = ''
      let filename = `AdaptiveSOC_${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`

      if (report.type === 'events') {
        csvContent = 'Event ID,Timestamp,Event Type,Source IP,Target Host,User,Rule\n' +
          securityEvents.map((e) => `"${e.id}","${e.timestamp}","${e.eventType}","${e.sourceIp}","${e.host}","${e.user}","${e.rule}"`).join('\n')
      } else if (report.type === 'detections') {
        csvContent = 'Detection ID,Event ID,Timestamp,Type,Title,Source IP,Severity,Risk Score\n' +
          detections.map((d) => `"${d.id}","${d.eventId}","${d.timestamp}","${d.detectionType}","${d.title}","${d.sourceIp}","${d.severity}","${d.riskScore}"`).join('\n')
      } else if (report.type === 'incidents') {
        csvContent = 'Incident ID,Detection ID,Timestamp,Title,Severity,Status,Source IP,Target Host\n' +
          incidents.map((i) => `"${i.id}","${i.detectionId || ''}","${i.createdAt}","${i.title}","${i.severity}","${i.status}","${i.sourceIp}","${i.targetHost}"`).join('\n')
      } else if (report.type === 'responses') {
        csvContent = 'Response ID,Timestamp,Action Type,Target IP,Status,Triggered By,Details\n' +
          responseActions.map((r) => `"${r.id}","${r.timestamp}","${r.action}","${r.target}","${r.status}","${r.triggeredBy}","${r.detail || ''}"`).join('\n')
      } else if (report.type === 'verifications') {
        csvContent = 'Verification ID,Response ID,Timestamp,Result,Attempts Before,Attempts After,Verified By,Notes\n' +
          verifications.map((v) => `"${v.verificationId}","${v.responseId}","${v.timestamp}","${v.result}","${v.attemptsBefore}","${v.attemptsAfter}","${v.verifiedBy}","${v.notes || ''}"`).join('\n')
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setGenerating(null)
      setDownloadSuccess(report.id)
    }, 400)
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <FileBarChart size={20} className="text-accent" /> Reports & Artifact Exports
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Generate verified CSV audit exports directly from live FastAPI backend tables
        </p>
      </div>

      {/* Notice Banner */}
      <div className="bg-surface-2 border border-surface-border rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-text-primary">Scheduled PDF Cron Daemon: Not Configured</span>
            <Pill tone="default">On-Demand Active</Pill>
          </div>
          <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
            Automated email digest crons are inactive. On-demand CSV exports below pull directly from the active MySQL database via FastAPI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon
          const isGenerating = generating === r.id
          const wasDownloaded = downloadSuccess === r.id

          return (
            <Card key={r.id}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
                  <Icon size={19} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-text-primary">{r.title}</h3>
                    <Pill tone="accent">Real API Data</Pill>
                  </div>
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">{r.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-border mt-3 text-[11.5px] text-text-muted">
                <div>
                  Source: <span className="font-mono text-text-secondary">/{r.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {wasDownloaded && (
                    <span className="text-status-success font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={12} /> Downloaded
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    onClick={() => handleExport(r)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Export CSV'}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
