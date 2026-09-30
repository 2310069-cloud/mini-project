import React, { useState } from 'react'
import { Crosshair, Server, ShieldAlert, Radar, Wand2, X } from 'lucide-react'
import { MITRE_TACTICS, techniquesByTactic, MITRE_TECHNIQUES } from '../data/mitre'
import { Card, CardHeader } from '../components/ui/Card'
import { Drawer } from '../components/ui/Drawer'
import { RiskScore, RiskBar } from '../components/ui/Risk'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import type { MitreTechnique } from '../types'

export function MitrePage() {
  const { currentParams, navigateTo } = useSoc()
  const [selected, setSelected] = useState<MitreTechnique | null>(
    MITRE_TECHNIQUES.find((t) => t.id === currentParams.id) ?? null
  )

  const totalDetections = MITRE_TECHNIQUES.reduce((sum, t) => sum + t.detections, 0)
  const detectedTactics = new Set(MITRE_TECHNIQUES.map((t) => t.tactic))

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <Crosshair size={20} className="text-accent" /> MITRE ATT&CK Coverage
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          {totalDetections} detections mapped across {detectedTactics.size} of {MITRE_TACTICS.length} tactics
        </p>
      </div>

      {/* Tactic matrix */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {MITRE_TACTICS.map((tactic) => {
            const techniques = techniquesByTactic(tactic)
            const hasDetections = techniques.length > 0
            return (
              <div key={tactic} className="w-[200px] shrink-0">
                <div
                  className={`rounded-sm border px-3 py-2 mb-2 text-center ${
                    hasDetections ? 'bg-accent/10 border-accent/30' : 'bg-surface-2 border-surface-border'
                  }`}
                >
                  <span className={`text-[11.5px] font-semibold ${hasDetections ? 'text-accent' : 'text-text-muted'}`}>
                    {tactic}
                  </span>
                </div>
                <div className="space-y-2">
                  {techniques.length === 0 && (
                    <div className="border border-dashed border-surface-border rounded-sm p-3 text-center text-text-muted text-[11px]">
                      No detections
                    </div>
                  )}
                  {techniques.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={`w-full text-left rounded-sm border p-2.5 transition-colors ${
                        t.risk >= 80
                          ? 'bg-sev-criticalBg border-sev-critical/40 hover:border-sev-critical/70'
                          : t.risk >= 60
                          ? 'bg-sev-highBg border-sev-high/40 hover:border-sev-high/70'
                          : 'bg-surface-2 border-surface-border hover:border-surface-borderLight'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-data text-[11.5px] font-bold text-text-primary">{t.id}</span>
                        <span className={`text-[10px] font-bold font-data ${t.risk >= 80 ? 'text-sev-critical' : t.risk >= 60 ? 'text-sev-high' : 'text-text-muted'}`}>
                          {t.risk}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-text-secondary leading-snug mb-1.5">{t.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-text-muted">
                        <span>{t.detections} detections</span>
                        <span>{t.confidence}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {selected && <TechniqueDetail technique={selected} onNavigate={navigateTo} />}
      </Drawer>
    </div>
  )
}

function TechniqueDetail({ technique, onNavigate }: { technique: MitreTechnique; onNavigate: (p: string, params?: any) => void }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Pill tone="accent">{technique.tactic}</Pill>
      </div>
      <h2 className="text-lg font-bold text-text-primary">
        <span className="font-data text-accent">{technique.id}</span> — {technique.name}
      </h2>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3 text-center">
          <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Detections</div>
          <div className="font-data font-bold text-lg text-text-primary">{technique.detections}</div>
        </div>
        <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3 text-center">
          <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Risk</div>
          <RiskScore score={technique.risk} />
        </div>
        <div className="bg-surface-3 border border-surface-borderLight rounded-sm p-3 text-center">
          <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Confidence</div>
          <div className="font-data font-bold text-lg text-accent">{technique.confidence}%</div>
        </div>
      </div>

      <Section title="Description">
        <p className="text-[13px] text-text-secondary leading-relaxed">{technique.description}</p>
      </Section>

      <Section title="Observed Evidence">
        <ul className="space-y-1.5">
          {technique.evidence.map((e, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-text-secondary">
              <span className="text-accent mt-0.5">•</span> {e}
            </li>
          ))}
        </ul>
      </Section>

      {technique.relatedAlertIds.length > 0 && (
        <Section title="Related Alerts" icon={<ShieldAlert size={13} />}>
          <div className="flex flex-wrap gap-2">
            {technique.relatedAlertIds.map((id) => (
              <button
                key={id}
                onClick={() => onNavigate('alerts', { id })}
                className="font-data text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-accent hover:border-accent/40"
              >
                {id}
              </button>
            ))}
          </div>
        </Section>
      )}

      {technique.affectedHosts.length > 0 && (
        <Section title="Affected Hosts" icon={<Server size={13} />}>
          <div className="flex flex-wrap gap-2">
            {technique.affectedHosts.map((h) => (
              <button
                key={h}
                onClick={() => onNavigate('hosts')}
                className="font-data text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-primary hover:border-accent/40"
              >
                {h}
              </button>
            ))}
          </div>
        </Section>
      )}

      {technique.detectionRuleIds.length > 0 && (
        <Section title="Detection Rules" icon={<Radar size={13} />}>
          <div className="flex flex-wrap gap-2">
            {technique.detectionRuleIds.map((r) => (
              <button
                key={r}
                onClick={() => onNavigate('detection')}
                className="font-data text-[12px] px-2.5 py-1 rounded-sm bg-surface-3 border border-surface-borderLight text-text-primary hover:border-accent/40"
              >
                {r}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommended Response" icon={<Wand2 size={13} />}>
        <ol className="space-y-1.5">
          {technique.recommendedResponse.map((r, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] text-text-secondary">
              <span className="font-data text-accent">{i + 1}.</span> {r}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-5 pt-5 border-t border-surface-border">
      <div className="flex items-center gap-1.5 text-xxs font-semibold uppercase tracking-widest text-text-muted mb-2.5">
        {icon} {title}
      </div>
      {children}
    </div>
  )
}
