import React, { useEffect, useRef, useState } from 'react'
import {
  BrainCircuit, Cpu, Send, Sparkles, FileText, HelpCircle, Crosshair, Wand2,
  ShieldCheck, Database, Workflow, Loader2, ChevronDown,
} from 'lucide-react'
import { useSoc } from '../context/SocContext'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SeverityBadge, Pill } from '../components/ui/Badge'
import { RiskScore } from '../components/ui/Risk'
import { AI_ANALYSES, SUGGESTED_QUESTIONS, answerAnalystQuestion, initialChatForIncident } from '../data/aiAnalyst'
import type { ChatMessage } from '../types'
import { formatTime } from '../lib/format'

export function AIAnalystPage() {
  const { incidents, currentParams, updateIncident } = useSoc()
  const [selectedId, setSelectedId] = useState(currentParams.id ?? 'INC-2026-0042')
  const [analyzing, setAnalyzing] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatForIncident(selectedId))
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const incident = incidents.find((i) => i.id === selectedId)
  const analysis = AI_ANALYSES[selectedId]

  useEffect(() => {
    setMessages(initialChatForIncident(selectedId))
  }, [selectedId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const runAnalysis = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      if (incident) updateIncident(incident.id, { aiAnalyzed: true })
      pushAiMessage(`Analysis complete for ${selectedId}. Threat classified as ${analysis?.attackPattern} (${analysis?.mitreId}) with ${analysis?.confidence}% confidence. Risk score: ${analysis?.risk}/100. See structured findings above.`)
    }, 1600)
  }

  const pushAiMessage = (content: string) => {
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'ai', content, timestamp: new Date().toISOString(), structured: true },
      ])
    }, 900)
  }

  const askQuestion = (q: string) => {
    setMessages((prev) => [...prev, { id: `an-${Date.now()}`, role: 'analyst', content: q, timestamp: new Date().toISOString() }])
    const answer = answerAnalystQuestion(q, selectedId)
    pushAiMessage(answer)
    setInput('')
  }

  const quickAction = (label: string) => {
    if (label === 'Analyze Incident') {
      askQuestion('What happened?')
      runAnalysis()
      return
    }
    if (label === 'Generate Summary') return askQuestion('What happened?')
    if (label === 'Explain Detection') return askQuestion('Show evidence')
    if (label === 'Map to MITRE') return askQuestion('Explain the MITRE technique')
    if (label === 'Recommend Response') return askQuestion('What should I investigate next?')
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-surface-2 to-surface-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center">
              <BrainCircuit size={20} className="text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-text-primary tracking-tight">AI SECURITY ANALYST</h1>
                <Pill tone="accent">Offline / Local Intelligence</Pill>
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">Model: AdaptiveSOC Local Intelligence Engine v2.4</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success" />
            </span>
            <span className="text-[12.5px] font-medium text-status-success">Status: Online</span>
          </div>
        </div>
      </Card>

      {/* Incident selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-text-muted">Incident context:</span>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none bg-surface-3 border border-surface-borderLight rounded-sm pl-3 pr-8 py-1.5 text-[12.5px] font-data text-text-primary focus-ring cursor-pointer"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>{i.id} — {i.title.slice(0, 40)}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* Left: structured analysis */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} onClick={() => quickAction('Analyze Incident')} disabled={analyzing}>
                {analyzing ? 'Analyzing...' : 'Analyze Incident'}
              </Button>
              <Button variant="secondary" icon={<FileText size={14} />} onClick={() => quickAction('Generate Summary')}>Generate Summary</Button>
              <Button variant="secondary" icon={<HelpCircle size={14} />} onClick={() => quickAction('Explain Detection')}>Explain Detection</Button>
              <Button variant="secondary" icon={<Crosshair size={14} />} onClick={() => quickAction('Map to MITRE')}>Map to MITRE</Button>
              <Button variant="secondary" icon={<Wand2 size={14} />} onClick={() => quickAction('Recommend Response')}>Recommend Response</Button>
            </div>
          </Card>

          {analysis ? (
            <>
              {/* Incident + narrative */}
              <Card>
                <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-1.5">Incident</div>
                <h2 className="text-[14.5px] font-bold text-text-primary mb-3">{incident?.title}</h2>
                <div className="bg-surface-3 border-l-2 border-accent rounded-sm px-4 py-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5 text-accent">
                    <Sparkles size={13} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">AI-Generated Analysis</span>
                  </div>
                  <p className="text-[13.5px] text-text-secondary leading-relaxed">{analysis.narrative}</p>
                </div>
              </Card>

              {/* Threat assessment */}
              <Card>
                <CardHeader title="Threat Assessment" icon={<ShieldCheck size={16} />} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AssessField label="Threat Type" value={analysis.threatType} />
                  <AssessField label="Attack Pattern" value={analysis.attackPattern} />
                  <AssessField label="Confidence" value={`${analysis.confidence}%`} highlight />
                  <div className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5">
                    <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Risk</div>
                    <RiskScore score={analysis.risk} size="sm" />
                  </div>
                </div>
                <div className="mt-3 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5 flex items-center gap-2.5">
                  <Crosshair size={14} className="text-accent shrink-0" />
                  <span className="font-data text-[13px] font-semibold text-accent">{analysis.mitreId}</span>
                  <span className="text-[12.5px] text-text-secondary">— {analysis.mitreName}</span>
                </div>
              </Card>

              {/* Asset + source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">Affected Asset</div>
                  <div className="font-data text-[15px] font-bold text-text-primary">{analysis.affectedAsset}</div>
                  <div className="font-data text-[12.5px] text-text-muted mt-0.5">{analysis.affectedAssetIp}</div>
                </Card>
                <Card>
                  <div className="text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2">Source</div>
                  <div className="font-data text-[15px] font-bold text-sev-critical">{analysis.source}</div>
                  <div className="text-[12.5px] text-text-muted mt-0.5">Unresolved threat origin</div>
                </Card>
              </div>

              {/* Recommended actions */}
              <Card>
                <CardHeader title="Recommended Actions" icon={<Wand2 size={16} />} />
                <ol className="space-y-2">
                  {analysis.recommendedActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2.5 bg-surface-3 border border-surface-borderLight rounded-sm px-3.5 py-2.5">
                      <span className="h-5 w-5 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold font-data shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-text-secondary">{a}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </>
          ) : (
            <Card className="h-48 flex items-center justify-center text-text-muted text-sm">
              No structured analysis available for this incident yet.
            </Card>
          )}

          {/* AI architecture explainer */}
          <AIArchitectureCard />
        </div>

        {/* Right: chat */}
        <div className="xl:sticky xl:top-[72px] xl:h-[calc(100vh-100px)]">
          <Card padded={false} className="flex flex-col h-[560px] xl:h-full">
            <div className="p-3.5 border-b border-surface-border flex items-center gap-2 shrink-0">
              <Cpu size={15} className="text-accent" />
              <span className="text-[13px] font-semibold text-text-primary">Analyst Console</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              {thinking && (
                <div className="flex items-center gap-2 text-text-muted text-[12px] pl-1">
                  <Loader2 size={13} className="animate-spin" /> Analyzing incident context...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-surface-border shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-surface-3 border border-surface-borderLight text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (input.trim()) askQuestion(input.trim())
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the analyst engine..."
                  className="flex-1 bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2 text-[12.5px] text-text-primary placeholder:text-text-muted focus-ring"
                />
                <button
                  type="submit"
                  className="h-[34px] w-[34px] rounded-sm bg-accent hover:bg-accent-dim text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAnalyst = message.role === 'analyst'
  return (
    <div className={`flex ${isAnalyst ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-sm px-3.5 py-2.5 ${
          isAnalyst
            ? 'bg-accent/15 border border-accent/30 text-text-primary'
            : 'bg-surface-3 border border-surface-borderLight text-text-secondary'
        }`}
      >
        {!isAnalyst && (
          <div className="flex items-center gap-1.5 mb-1 text-accent">
            <BrainCircuit size={11} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">AI Analyst</span>
          </div>
        )}
        <p className="text-[12.5px] leading-relaxed whitespace-pre-line">{message.content}</p>
        <div className="text-[10px] text-text-muted mt-1.5">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  )
}

function AssessField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5">
      <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">{label}</div>
      <div className={`text-[13px] font-semibold font-data ${highlight ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

function AIArchitectureCard() {
  return (
    <Card>
      <CardHeader title="Offline AI Security Analyst — Architecture" icon={<Workflow size={16} />} subtitle="No external API calls. All inference runs against local SIEM context." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ArchCol
          title="Inputs"
          icon={<Database size={14} />}
          items={['Security Events', 'Alerts', 'Detection Rules', 'MITRE ATT&CK Knowledge Base', 'Incident Context']}
        />
        <ArchCol
          title="Processing"
          icon={<Cpu size={14} />}
          items={['Log Analysis', 'Pattern Analysis', 'Threat Classification', 'MITRE Mapping', 'Risk Analysis', 'Incident Summarization']}
        />
        <ArchCol
          title="Outputs"
          icon={<Sparkles size={14} />}
          items={['Threat Explanation', 'Risk Assessment', 'Incident Summary', 'Recommended Response']}
        />
      </div>
    </Card>
  )
}

function ArchCol({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3.5">
      <div className="flex items-center gap-1.5 text-text-secondary mb-2.5">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-widest">{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it} className="text-[12px] text-text-secondary flex items-start gap-1.5">
            <span className="text-accent mt-1">•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
