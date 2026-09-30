import React, { useMemo, useState } from 'react'
import { Radar, Crosshair, Hash, Activity, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import { DETECTION_RULES } from '../data/rules'
import { SEVERITY_ORDER } from '../lib/severity'
import { SeverityBadge } from '../components/ui/Badge'
import { SelectFilter, SearchInput } from '../components/ui/Filters'
import { Card, CardHeader } from '../components/ui/Card'
import { formatTime } from '../lib/format'
import type { DetectionRule } from '../types'

export function DetectionPage() {
  const [rules, setRules] = useState<DetectionRule[]>(DETECTION_RULES)
  const [severity, setSeverity] = useState('All')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const categories = useMemo(() => Array.from(new Set(rules.map((r) => r.category))), [rules])

  const filtered = useMemo(() => {
    return rules.filter((r) => {
      if (severity !== 'All' && r.severity !== severity) return false
      if (category !== 'All' && r.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.id.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q) && !r.mitreId.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rules, severity, category, search])

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === 'Enabled' ? 'Disabled' : 'Enabled' } : r)))
  }

  const enabledCount = rules.filter((r) => r.status === 'Enabled').length

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Radar size={20} className="text-accent" /> Threat Detection Engine
          </h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            {enabledCount} of {rules.length} detection rules active
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <SelectFilter label="Severity" value={severity} onChange={setSeverity} options={SEVERITY_ORDER} />
        <SelectFilter label="Category" value={category} onChange={setCategory} options={categories} />
        <SearchInput value={search} onChange={setSearch} placeholder="Search rule ID, name, MITRE..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((rule) => (
          <Card key={rule.id}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-data text-[11.5px] text-text-muted bg-surface-3 border border-surface-borderLight rounded-sm px-2 py-0.5">
                  {rule.id}
                </span>
                <SeverityBadge severity={rule.severity} size="sm" />
              </div>
              <button
                onClick={() => toggleRule(rule.id)}
                className={`flex items-center gap-1.5 text-[11.5px] font-medium ${rule.status === 'Enabled' ? 'text-status-success' : 'text-text-muted'}`}
              >
                {rule.status === 'Enabled' ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                {rule.status}
              </button>
            </div>

            <h3 className="text-[14px] font-bold text-text-primary mb-1.5">{rule.name}</h3>
            <p className="text-[12.5px] text-text-secondary leading-relaxed mb-3">{rule.description}</p>

            <div className="bg-surface-3 border border-surface-borderLight rounded-sm px-3 py-2.5 mb-3">
              <div className="text-xxs uppercase tracking-widest text-text-muted mb-1">Trigger Condition</div>
              <p className="text-[12px] font-data text-text-secondary leading-relaxed">{rule.triggerCondition}</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <MiniInfo icon={<Crosshair size={12} />} label="MITRE" value={rule.mitreId} />
              <MiniInfo icon={<Hash size={12} />} label="Matched" value={String(rule.eventsMatched)} />
              <MiniInfo icon={<Clock size={12} />} label="Last Triggered" value={formatTime(rule.lastTriggered)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MiniInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface-3/60 rounded-sm px-2.5 py-2">
      <div className="flex items-center gap-1 text-text-muted mb-1">
        {icon}
        <span className="text-[9.5px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-[12px] font-data font-semibold text-text-primary truncate">{value}</div>
    </div>
  )
}
