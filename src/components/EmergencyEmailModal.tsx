import React, { useState, useEffect } from 'react'
import {
  Mail, ShieldAlert, CheckCircle2, ExternalLink, X, Send, Lock,
  Globe2, Server, AlertTriangle, Copy, Check, Settings, KeyRound, RefreshCw
} from 'lucide-react'
import type { DispatchedEmail } from '../types'
import { Button } from './ui/Button'
import { useSoc } from '../context/SocContext'
import { openGmailWebClient, openNativeMailClient, openOutlookWebClient } from '../lib/emailDispatcher'
import { saveSmtpConfig, getSmtpConfigStatus } from '../lib/apiClient'

interface EmergencyEmailModalProps {
  email: DispatchedEmail
  onClose: () => void
}

export function EmergencyEmailModal({ email, onClose }: EmergencyEmailModalProps) {
  const { solveCurrentAttack, activeAttack } = useSoc()
  const [copied, setCopied] = useState(false)
  const [showSmtpSettings, setShowSmtpSettings] = useState(false)
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; user?: string } | null>(null)
  const [smtpFeedback, setSmtpFeedback] = useState<string | null>(null)

  useEffect(() => {
    getSmtpConfigStatus().then((res) => {
      if (res) setSmtpStatus(res)
    })
  }, [])

  const handleCopyBody = () => {
    navigator.clipboard.writeText(email.bodyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSolveFromEmail = () => {
    solveCurrentAttack()
    onClose()
  }

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!smtpUser || !smtpPass) return
    setSmtpSaving(true)
    setSmtpFeedback('Testing connection to smtp.gmail.com:465...')
    try {
      const res = await saveSmtpConfig(smtpUser, smtpPass)
      if (res && res.success) {
        setSmtpFeedback('✅ Google SMTP connected! Verification email sent.')
        setSmtpStatus({ configured: true, user: smtpUser })
        setTimeout(() => setShowSmtpSettings(false), 2500)
      } else {
        setSmtpFeedback(`❌ Error: ${res?.message || 'Authentication failed. Check your App Password.'}`)
      }
    } catch {
      setSmtpFeedback('❌ Failed to connect to server.')
    } finally {
      setSmtpSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface-1 border border-surface-borderLight rounded-lg w-full max-w-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Email Client Header */}
        <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-2/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-sev-critical/20 text-sev-critical flex items-center justify-center border border-sev-critical/40">
              <Mail size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">
                  AdaptiveSOC Automated Email Dispatcher
                </span>
                <span className="text-xxs px-1.5 py-0.2 rounded font-bold uppercase bg-status-success/20 text-status-success flex items-center gap-1">
                  <CheckCircle2 size={10} /> 4 Inboxes Connected
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Sent to on-call security response distribution list
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSmtpSettings(!showSmtpSettings)}
              className="text-xs text-text-secondary hover:text-text-primary px-2.5 py-1 rounded bg-surface-3 border border-surface-borderLight hover:bg-surface-4 transition-colors flex items-center gap-1"
            >
              <Settings size={12} />
              <span>{smtpStatus?.configured ? 'SMTP Configured' : 'Configure SMTP'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-3 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Recipients Bar */}
        <div className="px-5 py-2.5 border-b border-surface-border bg-surface-0/60 text-xs font-data space-y-1.5 shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-text-muted shrink-0 text-xxs uppercase tracking-wider mt-0.5">To (4 Inboxes):</span>
            <div className="flex flex-wrap gap-1.5">
              {email.recipients.map((rec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-3 text-text-primary text-xxs border border-surface-borderLight"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
                  {rec}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xxs text-text-muted pt-1">
            <span>Subject: <strong className="text-text-primary font-sans">{email.subject}</strong></span>
            <span>{new Date(email.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Optional SMTP Settings Drawer */}
        {showSmtpSettings && (
          <div className="p-4 bg-surface-2 border-b border-surface-border text-xs space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-text-primary flex items-center gap-1.5">
                <KeyRound size={14} className="text-accent" />
                Configure Background Google Gmail SMTP (100% Direct Delivery)
              </div>
              <span className="text-xxs text-text-muted">Direct to @ritindia.edu Google Workspace</span>
            </div>
            <p className="text-text-muted text-xxs">
              Enter your Gmail and 16-character Google App Password (free from Google Account → Security → 2-Step Verification → App Passwords). The SOC server will deliver all attack alerts directly into the 4 inboxes without any external API or relay.
            </p>
            <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <div>
                <label className="block text-xxs text-text-secondary mb-1">Your Gmail Address:</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <label className="block text-xxs text-text-secondary mb-1">16-char Google App Password:</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                  className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={smtpSaving}
                  icon={smtpSaving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                  className="w-full"
                >
                  {smtpSaving ? 'Verifying...' : 'Save & Verify SMTP'}
                </Button>
              </div>
            </form>
            {smtpFeedback && (
              <div className="text-xxs font-semibold p-2 rounded bg-surface-3 text-accent">
                {smtpFeedback}
              </div>
            )}
          </div>
        )}

        {/* 1-Click Guaranteed Delivery Callout */}
        <div className="mx-5 my-3 p-3 rounded bg-accent/10 border border-accent/30 text-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <Mail size={16} className="text-accent shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-text-primary">
                Instant 1-Click Send via Gmail (Guaranteed 100% Delivery to @ritindia.edu):
              </div>
              <p className="text-xxs text-text-secondary mt-0.5">
                Kyunki college inboxes Google Workspace use karte hain, aap 1-click me apne Gmail se sabhi 4 inboxes par formatted alert directly send kar sakte hain:
              </p>
            </div>
          </div>
          <button
            onClick={() => openGmailWebClient(email)}
            className="px-3.5 py-1.5 rounded bg-sev-critical text-white font-bold text-xs hover:bg-sev-critical/90 transition-all flex items-center gap-1.5 shadow-md shadow-sev-critical/20"
          >
            <Send size={13} /> 🚀 Open & Send in Gmail (All 4 Pre-filled)
          </button>
        </div>

        {/* Email Body Preview */}
        <div className="p-5 overflow-y-auto flex-1 bg-surface-0 space-y-4">
          <div
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            className="max-w-xl mx-auto"
          />
        </div>

        {/* Email Actions Bar */}
        <div className="px-5 py-3 border-t border-surface-border bg-surface-2/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openGmailWebClient(email)}
              className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1.5 py-1 px-2 rounded bg-accent/10 border border-accent/25 hover:bg-accent/20 transition-colors"
            >
              <ExternalLink size={13} /> Open in Gmail
            </button>
            <button
              onClick={() => openNativeMailClient(email)}
              className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 py-1 px-2 rounded hover:bg-surface-3 transition-colors border border-surface-borderLight"
            >
              <ExternalLink size={13} /> Open in Mail App (mailto)
            </button>
            <button
              onClick={handleCopyBody}
              className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5 py-1 px-2 rounded hover:bg-surface-3 transition-colors"
            >
              {copied ? <Check size={13} className="text-status-success" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeAttack?.status === 'detected' && (
              <Button
                variant="danger"
                size="sm"
                icon={<Lock size={13} />}
                onClick={handleSolveFromEmail}
                className="animate-pulse"
              >
                🛡️ One-Click Solve & Contain Attack Now
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Preview
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
