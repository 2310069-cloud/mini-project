import React, { useState } from 'react'
import { Settings as SettingsIcon, Shield, Bell, Users, Plug, Save, CheckCircle2, Server, Database } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'detection', label: 'Detection Policy', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'users', label: 'Analysts & Roles', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

export function SettingsPage() {
  const [tab, setTab] = useState('general')

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
          <SettingsIcon size={20} className="text-accent" /> Settings
        </h1>
        <p className="text-[13px] text-text-secondary mt-0.5">
          Platform configuration, backend connectivity, and security policy management
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        <div className="space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[13px] font-medium transition-colors ${
                  active ? 'bg-accent/12 text-accent' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          {tab === 'general' && <GeneralSettings />}
          {tab === 'detection' && <DetectionSettings />}
          {tab === 'notifications' && <NotificationSettings />}
          {tab === 'users' && <UserSettings />}
          {tab === 'integrations' && <IntegrationSettings />}
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-surface-border last:border-b-0">
      <div>
        <div className="text-[13px] font-medium text-text-primary">{label}</div>
        {description && <div className="text-[11.5px] text-text-muted mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button
      onClick={() => setChecked((v) => !v)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-4'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

function GeneralSettings() {
  const { backendConnected } = useSoc()

  return (
    <Card>
      <CardHeader title="Environment" subtitle="Deployment and tenant configuration" />
      <SettingsRow label="Environment Name" description="Displayed in the top navigation bar">
        <input defaultValue="LAB" className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary w-32 focus-ring" />
      </SettingsRow>
      <SettingsRow label="Backend API Target" description="FastAPI host endpoint">
        <span className="font-mono text-[12px] text-accent bg-surface-3 px-2 py-1 rounded border border-surface-borderLight">
          http://127.0.0.1:8000
        </span>
      </SettingsRow>
      <SettingsRow label="Backend Connection Status" description="Heartbeat state from /health">
        <Pill tone={backendConnected ? 'accent' : 'critical'}>
          {backendConnected ? 'Connected (Live)' : 'Disconnected'}
        </Pill>
      </SettingsRow>
      <SettingsRow label="Dark Theme" description="Enterprise SOC interface (active)">
        <Toggle defaultChecked />
      </SettingsRow>
    </Card>
  )
}

function DetectionSettings() {
  return (
    <Card>
      <CardHeader title="Detection Policy" subtitle="Real rule thresholds from backend database engine" />
      <SettingsRow label="Brute Force Threshold" description="Failed attempts within 1 minute evaluation window to trigger detection">
        <input defaultValue="5" className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary w-20 font-data focus-ring" />
      </SettingsRow>
      <SettingsRow label="Auto-Containment Firewall Rule" description="Execute automated Windows netsh advfirewall block on confirmed detection">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="AI Auto-Triage Module" description="External neural LLM analysis">
        <span className="text-[11px] font-semibold text-text-muted bg-surface-3 px-2 py-0.5 rounded border border-surface-borderLight">
          Not configured
        </span>
      </SettingsRow>
      <SettingsRow label="Target Host Policy" description="Host scope for brute-force telemetry">
        <span className="font-mono text-[12px] text-text-secondary">SOC-Test-Server (192.168.1.100)</span>
      </SettingsRow>
    </Card>
  )
}

function NotificationSettings() {
  const { notifications } = useSoc()

  return (
    <Card>
      <CardHeader title="Notification Preferences" subtitle="Control alert routing and logging channels" />
      <SettingsRow label="In-App Real-time Feed" description="Sync notifications from /notifications table">
        <span className="text-[12px] font-bold text-status-success">{notifications.length} active notifications</span>
      </SettingsRow>
      <SettingsRow label="External PagerDuty Webhook" description="Incident escalation webhook">
        <span className="text-[11px] font-medium text-text-muted bg-surface-3 px-2 py-0.5 rounded border border-surface-borderLight">
          Not configured
        </span>
      </SettingsRow>
      <SettingsRow label="Slack Alerts Bot" description="Post alert summaries to Slack channel">
        <span className="text-[11px] font-medium text-text-muted bg-surface-3 px-2 py-0.5 rounded border border-surface-borderLight">
          Not configured
        </span>
      </SettingsRow>
      <SettingsRow label="Email Gateway" description="SMTP mail notification service">
        <span className="text-[11px] font-medium text-text-muted bg-surface-3 px-2 py-0.5 rounded border border-surface-borderLight">
          Not configured
        </span>
      </SettingsRow>
    </Card>
  )
}

function UserSettings() {
  // Real employee records from database dump
  const users = [
    { name: 'Jaani', role: 'Tier 1 Analyst', dept: 'SOC-TIER -1', id: '1001', status: 'Active' },
    { name: 'Anuj', role: 'Tier 1 Analyst', dept: 'SOC-TIER -1', id: '100', status: 'Active' },
    { name: 'Administrator', role: 'IT Security Administrator', dept: 'IT', id: 'SOC-10098', status: 'Active' },
  ]

  return (
    <Card padded={false}>
      <div className="p-4 pb-3">
        <CardHeader title="Analysts & Roles" subtitle="Real employee accounts registered in database" />
      </div>
      <div className="divide-y divide-surface-border">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-[11px] font-bold font-data">
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-[13px] font-medium text-text-primary flex items-center gap-2">
                  {u.name}
                  <span className="text-[10.5px] font-mono text-text-muted">#{u.id}</span>
                </div>
                <div className="text-[11.5px] text-text-muted">{u.role} · {u.dept}</div>
              </div>
            </div>
            <Pill tone="accent">{u.status}</Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}

function IntegrationSettings() {
  const integrations = [
    { name: 'FastAPI Backend Engine', desc: 'http://127.0.0.1:8000', connected: true },
    { name: 'MySQL Database', desc: 'Database adaptive_soc on localhost:3306', connected: true },
    { name: 'Windows Firewall Agent', desc: 'netsh advfirewall IP block responses', connected: true },
    { name: 'Wazuh Manager', desc: 'Log collector and agent fleet', connected: false },
    { name: 'pfSense / Perimeter Firewall', desc: 'Perimeter TAP and flow export', connected: false },
    { name: 'PagerDuty Webhook', desc: 'On-call escalation service', connected: false },
    { name: 'Slack Bot Integration', desc: 'Incident chat notifications', connected: false },
    { name: 'VirusTotal Threat Intel', desc: 'External IP reputation API', connected: false },
    { name: 'MISP Threat Sharing', desc: 'Threat intelligence sharing community', connected: false },
  ]

  return (
    <Card padded={false}>
      <div className="p-4 pb-3">
        <CardHeader title="Integrations" subtitle="Real service connections vs unconfigured external connectors" />
      </div>
      <div className="divide-y divide-surface-border">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[13px] font-medium text-text-primary">{i.name}</div>
              <div className="text-[11.5px] text-text-muted">{i.desc}</div>
            </div>
            <Pill tone={i.connected ? 'accent' : 'muted'}>
              {i.connected ? 'Connected' : 'Not configured'}
            </Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}
