import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Shield, Bell, Users, Plug, Save, KeyRound, CheckCircle2, AlertTriangle, RefreshCw, Check } from 'lucide-react'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Pill } from '../components/ui/Badge'
import { useSoc } from '../context/SocContext'
import { getSmtpConfigStatus, saveSmtpConfig } from '../lib/apiClient'

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
  const { emailConfig, setEmailConfig, sendTestEmail, dispatchedEmails, setActiveEmailModal } = useSoc()
  const [emails, setEmails] = useState<string[]>([
    emailConfig.recipients[0] || '',
    emailConfig.recipients[1] || '',
    emailConfig.recipients[2] || '',
    emailConfig.recipients[3] || '',
  ])
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpFeedback, setSmtpFeedback] = useState('')
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; user?: string } | null>(null)

  useEffect(() => {
    getSmtpConfigStatus().then((st) => {
      if (st) setSmtpStatus(st)
    })
  }, [])

  const handleSaveSmtp = async () => {
    if (!smtpUser || !smtpPass) return
    setSmtpSaving(true)
    setSmtpFeedback('Verifying connection with Google SMTP...')
    try {
      const res = await saveSmtpConfig(smtpUser, smtpPass)
      if (res && res.success) {
        setSmtpFeedback('✅ Google SMTP connected! Verification email sent.')
        setSmtpStatus({ configured: true, user: smtpUser })
      } else {
        setSmtpFeedback(`❌ Error: ${res?.message || 'Verification failed. Check your App Password.'}`)
      }
    } catch {
      setSmtpFeedback('❌ Failed to connect to server.')
    } finally {
      setSmtpSaving(false)
    }
  }

  React.useEffect(() => {
    setEmails([
      emailConfig.recipients[0] || '2310069@ritindia.edu',
      emailConfig.recipients[1] || '2410055@ritindia.edu',
      emailConfig.recipients[2] || '2410015@ritindia.edu',
      emailConfig.recipients[3] || '2410066@ritindia.edu',
    ])
  }, [emailConfig.recipients])

  const handleEmailChange = (index: number, val: string) => {
    const updated = [...emails]
    updated[index] = val
    setEmails(updated)
  }

  const handleSave = () => {
    setEmailConfig({
      ...emailConfig,
      recipients: emails.filter((e) => e.trim().length > 0).slice(0, 4),
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* 4 Inboxes Emergency Email Alert Section */}
      <Card>
        <CardHeader
          title="Emergency Email Alert Dispatcher (Up to 4 Inboxes)"
          subtitle="Automatically dispatches critical SOC incident emails to 4 team members upon Brute Force attack detection"
        />

        <div className="space-y-3 pt-2">
          <div className="text-xs text-text-secondary leading-relaxed bg-surface-3/60 p-3 rounded border border-surface-borderLight">
            <strong className="text-text-primary">Zero-API Real Email Dispatch:</strong> Whenever a live Brute Force attack is detected by the Wazuh AI engine, an urgent security dispatch is sent to these 4 email addresses with direct one-click threat containment controls.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="space-y-1">
                <label className="text-xxs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                  <span>Recipient Inbox #{index + 1}</span>
                  {emails[index] && <span className="text-status-success font-data">Active</span>}
                </label>
                <input
                  type="email"
                  value={emails[index]}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`e.g. security-lead-${index + 1}@yourcompany.com`}
                  className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary font-data focus:outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleSave}>
                {savedSuccess ? 'Saved Successfully!' : 'Save Email Recipients'}
              </Button>
              <Button variant="secondary" size="sm" onClick={sendTestEmail}>
                Send Test Alert to 4 Inboxes
              </Button>
            </div>

            {dispatchedEmails.length > 0 && (
              <button
                onClick={() => setActiveEmailModal(dispatchedEmails[0])}
                className="text-xs text-accent hover:underline font-data"
              >
                View Last Dispatched Alert ({dispatchedEmails.length} total)
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Background Google Gmail SMTP Section */}
      <Card>
        <CardHeader
          title="Background Google SMTP (100% Guaranteed Direct Delivery)"
          subtitle="Direct SSL/TLS dispatch via smtp.gmail.com:465 directly into @ritindia.edu Google Workspace inboxes"
        />

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded bg-surface-3/60 border border-surface-borderLight">
            <div className="flex items-center gap-2.5">
              <KeyRound size={18} className="text-accent" />
              <div>
                <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <span>Google SMTP Status:</span>
                  {smtpStatus?.configured ? (
                    <span className="text-xxs px-2 py-0.5 rounded font-bold bg-status-success/20 text-status-success inline-flex items-center gap-1">
                      <CheckCircle2 size={11} /> Connected ({smtpStatus.user})
                    </span>
                  ) : (
                    <span className="text-xxs px-2 py-0.5 rounded font-bold bg-sev-medium/20 text-sev-medium inline-flex items-center gap-1">
                      <AlertTriangle size={11} /> Not Configured (Zero-API Relay Fallback Active)
                    </span>
                  )}
                </div>
                <p className="text-xxs text-text-muted mt-0.5">
                  Because @ritindia.edu uses Google Workspace, direct Gmail SMTP guarantees instant delivery to Primary Inbox without spam filtering.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-2/60 p-3 rounded border border-surface-borderLight text-xs space-y-2">
            <div className="font-semibold text-text-primary text-xs">
              ⚡ How to get a free Google App Password in 20 seconds:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-text-secondary text-xxs">
              <li>Open your Google Account: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-accent underline">myaccount.google.com/security</a></li>
              <li>Make sure <strong>2-Step Verification</strong> is ON.</li>
              <li>Search or click <strong>App passwords</strong> (<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-accent underline">myaccount.google.com/apppasswords</a>).</li>
              <li>Name it <code>AdaptiveSOC</code> and click Create. Google will give you a 16-character code (e.g. <code>abcd efgh ijkl mnop</code>).</li>
              <li>Paste below and click <strong>Save & Connect SMTP</strong>!</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xxs font-bold uppercase tracking-wider text-text-muted">
                Your Gmail Address:
              </label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xxs font-bold uppercase tracking-wider text-text-muted">
                16-Character Google App Password:
              </label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSmtp}
              disabled={smtpSaving || !smtpUser || !smtpPass}
              icon={smtpSaving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
            >
              {smtpSaving ? 'Verifying & Saving...' : 'Save & Connect Google SMTP'}
            </Button>
            {smtpFeedback && (
              <span className="text-xs font-medium text-accent">
                {smtpFeedback}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="General Notification Preferences" subtitle="Control how and when alerts reach the SOC team" />
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
    </div>
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
