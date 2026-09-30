import React, { useState } from 'react'
import { Settings as SettingsIcon, Shield, Bell, Users, Plug, Save } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'

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
        <p className="text-[13px] text-text-secondary mt-0.5">Platform configuration and environment management</p>
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
  return (
    <Card>
      <CardHeader title="Environment" subtitle="Deployment and tenant configuration" />
      <SettingsRow label="Environment Name" description="Displayed in the top navigation bar">
        <input defaultValue="LAB" className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary w-32 focus-ring" />
      </SettingsRow>
      <SettingsRow label="Timezone" description="Used for all timestamp displays">
        <select className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary focus-ring">
          <option>UTC</option>
          <option>America/New_York</option>
          <option>Europe/London</option>
        </select>
      </SettingsRow>
      <SettingsRow label="Dark Theme" description="Enterprise SOC interface (recommended)">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="Data Retention" description="Number of days to retain raw event data">
        <select className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary focus-ring">
          <option>30 days</option>
          <option>90 days</option>
          <option>180 days</option>
        </select>
      </SettingsRow>
      <div className="pt-4">
        <Button variant="primary" icon={<Save size={14} />}>Save Changes</Button>
      </div>
    </Card>
  )
}

function DetectionSettings() {
  return (
    <Card>
      <CardHeader title="Detection Policy" subtitle="Global thresholds for correlation and risk scoring" />
      <SettingsRow label="Brute Force Threshold" description="Failed attempts within 5 minutes to trigger alert">
        <input defaultValue="15" className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary w-20 font-data focus-ring" />
      </SettingsRow>
      <SettingsRow label="Port Scan Threshold" description="Distinct ports probed within 60s">
        <input defaultValue="20" className="bg-surface-3 border border-surface-borderLight rounded-sm px-2.5 py-1.5 text-[12.5px] text-text-primary w-20 font-data focus-ring" />
      </SettingsRow>
      <SettingsRow label="Auto-Containment" description="Automatically isolate hosts on CRITICAL detections">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="AI Auto-Triage" description="Automatically run AI analysis on new CRITICAL incidents">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="Risk Score Weighting" description="Favor asset criticality over event volume">
        <Toggle />
      </SettingsRow>
      <div className="pt-4">
        <Button variant="primary" icon={<Save size={14} />}>Save Changes</Button>
      </div>
    </Card>
  )
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader title="Notification Preferences" subtitle="Control how and when alerts reach the SOC team" />
      <SettingsRow label="Critical Incident Paging" description="Send PagerDuty alert on CRITICAL severity">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="Email Digest" description="Daily summary email at 06:00 local time">
        <Toggle defaultChecked />
      </SettingsRow>
      <SettingsRow label="Desktop Notifications" description="Browser push notifications for new alerts">
        <Toggle />
      </SettingsRow>
      <SettingsRow label="Slack Integration" description="Post alert summaries to #soc-alerts channel">
        <Toggle defaultChecked />
      </SettingsRow>
    </Card>
  )
}

function UserSettings() {
  const users = [
    { name: 'S. Okafor', role: 'Tier 2 Analyst', status: 'Online' },
    { name: 'M. Chen', role: 'Tier 1 Analyst', status: 'Online' },
    { name: 'R. Patel', role: 'SOC Manager', status: 'Away' },
    { name: 'K. Taylor', role: 'Tier 1 Analyst', status: 'Offline' },
  ]
  return (
    <Card padded={false}>
      <div className="p-4 pb-3">
        <CardHeader title="Analysts & Roles" subtitle="Team members with access to this SOC environment" />
      </div>
      <div className="divide-y divide-surface-border">
        {users.map((u) => (
          <div key={u.name} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-[11px] font-bold font-data">
                {u.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="text-[13px] font-medium text-text-primary">{u.name}</div>
                <div className="text-[11.5px] text-text-muted">{u.role}</div>
              </div>
            </div>
            <Pill tone={u.status === 'Online' ? 'accent' : 'default'}>{u.status}</Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}

function IntegrationSettings() {
  const integrations = [
    { name: 'Wazuh Manager', desc: 'Log source & agent management', connected: true },
    { name: 'pfSense Firewall', desc: 'Perimeter network telemetry', connected: true },
    { name: 'PagerDuty', desc: 'Incident paging & escalation', connected: true },
    { name: 'Slack', desc: 'Team notification channel', connected: true },
    { name: 'VirusTotal', desc: 'File & IP reputation lookups', connected: false },
    { name: 'MISP', desc: 'Threat intelligence sharing', connected: false },
  ]
  return (
    <Card padded={false}>
      <div className="p-4 pb-3">
        <CardHeader title="Integrations" subtitle="Connected data sources and third-party services" />
      </div>
      <div className="divide-y divide-surface-border">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[13px] font-medium text-text-primary">{i.name}</div>
              <div className="text-[11.5px] text-text-muted">{i.desc}</div>
            </div>
            <Pill tone={i.connected ? 'accent' : 'muted'}>{i.connected ? 'Connected' : 'Not Connected'}</Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}
