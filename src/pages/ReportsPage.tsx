import React, { useState } from 'react'
import {
  FileBarChart, FileText, Download, FileSpreadsheet, Loader2, CheckCircle2,
  ShieldAlert, KeyRound, Crosshair, FolderOpen,
} from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'

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

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <FileBarChart size={20} className="text-accent" /> Reports
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">Generate and export SOC reporting artifacts for stakeholders and compliance</p>
      </div>

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
  )
}
