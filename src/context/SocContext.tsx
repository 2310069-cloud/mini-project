import React, { createContext, useCallback, useContext, useMemo, useState, useRef, useEffect } from 'react'
import type {
  NotificationItem, ResponseAction, Incident, TimeRange,
  SecurityEvent, Alert, AuthEvent, AttackType, LiveAttackState,
  AttackIncidentReport, LiveLogItem, EmailAlertConfig, DispatchedEmail
} from '../types'
import {
  INITIAL_NOTIFICATIONS, INITIAL_RESPONSE_ACTIONS, INCIDENTS,
  SECURITY_EVENTS, ALERTS, AUTH_EVENTS
} from '../data/generator'
import { checkWazuhThreatIntel } from '../data/wazuhThreatIntel'
import { buildEmergencyEmail } from '../lib/emailDispatcher'
import {
  syncAttackToBackend,
  postEventToBackend,
  dispatchEmailViaBackend,
  clearBackendEvents,
  getBackendEvents,
} from '../lib/apiClient'

interface SocContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void

  responseActions: ResponseAction[]
  executeAction: (id: string) => void
  addResponseAction: (action: ResponseAction) => void

  incidents: Incident[]
  updateIncident: (id: string, patch: Partial<Incident>) => void

  securityEvents: SecurityEvent[]
  addSecurityEvent: (evt: SecurityEvent) => void

  alerts: Alert[]
  addAlert: (alert: Alert) => void
  updateAlert: (id: string, patch: Partial<Alert>) => void

  authEvents: AuthEvent[]
  addAuthEvent: (evt: AuthEvent) => void

  // Attack simulation & reports
  activeAttack: LiveAttackState | null
  incidentReports: AttackIncidentReport[]
  activeReportModal: AttackIncidentReport | null
  isSimulatorOpen: boolean
  setSimulatorOpen: (open: boolean) => void

  triggerLiveAttack: (type: AttackType, targetIp?: string) => void
  solveCurrentAttack: () => void
  clearLiveLogs: () => void
  viewReport: (report: AttackIncidentReport) => void
  closeReportModal: () => void

  // Email Notification System (up to 4 inboxes)
  emailConfig: EmailAlertConfig
  setEmailConfig: (cfg: EmailAlertConfig) => void
  dispatchedEmails: DispatchedEmail[]
  activeEmailModal: DispatchedEmail | null
  setActiveEmailModal: (e: DispatchedEmail | null) => void
  sendTestEmail: () => void

  timeRange: TimeRange
  setTimeRange: (r: TimeRange) => void

  globalSearch: string
  setGlobalSearch: (s: string) => void

  navigateTo: (page: string, params?: Record<string, string>) => void
  currentPage: string
  currentParams: Record<string, string>
}

const SocContext = createContext<SocContextValue | null>(null)

export function useSoc() {
  const ctx = useContext(SocContext)
  if (!ctx) throw new Error('useSoc must be used within SocProvider')
  return ctx
}

export function SocProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [responseActions, setResponseActions] = useState<ResponseAction[]>(INITIAL_RESPONSE_ACTIONS)
  const [incidents, setIncidents] = useState<Incident[]>(INCIDENTS)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('adaptivesoc_live_events')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...SECURITY_EVENTS]
        }
      }
    } catch {}
    return SECURITY_EVENTS
  })
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS)
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>(AUTH_EVENTS)

  // Simulation & Reports state (persists across page reloads)
  const [activeAttack, setActiveAttack] = useState<LiveAttackState | null>(() => {
    try {
      const saved = localStorage.getItem('adaptivesoc_active_attack')
      if (saved) return JSON.parse(saved)
    } catch {}
    return null
  })
  const [incidentReports, setIncidentReports] = useState<AttackIncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem('adaptivesoc_reports')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [activeReportModal, setActiveReportModal] = useState<AttackIncidentReport | null>(null)
  const [isSimulatorOpen, setSimulatorOpen] = useState(false)

  // Email alerts configuration (saved locally)
  const [emailConfig, setEmailConfigState] = useState<EmailAlertConfig>(() => {
    const userEmails = [
      '2310069@ritindia.edu',
      '2410055@ritindia.edu',
      '2410015@ritindia.edu',
      '2410066@ritindia.edu',
    ]
    try {
      const saved = localStorage.getItem('adaptivesoc_alert_emails')
      if (saved) {
        const parsed = JSON.parse(saved)
        const hasAllFour = parsed.recipients && userEmails.every((em) => parsed.recipients.includes(em))
        if (!hasAllFour || parsed.recipients.length !== 4 || parsed.recipients.some((r: string) => r.includes('.lab'))) {
          parsed.recipients = userEmails
          localStorage.setItem('adaptivesoc_alert_emails', JSON.stringify(parsed))
        }
        return parsed
      }
    } catch {}
    const initialConfig: EmailAlertConfig = {
      enabled: true,
      recipients: userEmails,
      sendRealEmail: true,
    }
    try {
      localStorage.setItem('adaptivesoc_alert_emails', JSON.stringify(initialConfig))
    } catch {}
    return initialConfig
  })

  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>([])
  const [activeEmailModal, setActiveEmailModal] = useState<DispatchedEmail | null>(null)

  const setEmailConfig = useCallback((cfg: EmailAlertConfig) => {
    setEmailConfigState(cfg)
    try {
      localStorage.setItem('adaptivesoc_alert_emails', JSON.stringify(cfg))
    } catch {}
  }, [])

  // Ensure 2410055@ritindia.edu and all 4 inboxes are active on mount
  useEffect(() => {
    const userEmails = [
      '2310069@ritindia.edu',
      '2410055@ritindia.edu',
      '2410015@ritindia.edu',
      '2410066@ritindia.edu',
    ]
    const hasAll = userEmails.every((em) => emailConfig.recipients?.includes(em))
    if (!hasAll || emailConfig.recipients?.length !== 4) {
      setEmailConfig({
        ...emailConfig,
        recipients: userEmails,
      })
    }
  }, [])

  const [timeRange, setTimeRange] = useState<TimeRange>('1h')
  const [globalSearch, setGlobalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState('overview')
  const [currentParams, setCurrentParams] = useState<Record<string, string>>({})

  const attackIntervalRef = useRef<any>(null)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const executeAction = useCallback((id: string) => {
    setResponseActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Executing' } : a))
    )
    setTimeout(() => {
      setResponseActions((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'Completed', timestamp: new Date().toISOString() }
            : a
        )
      )
    }, 1400)
  }, [])

  const addResponseAction = useCallback((action: ResponseAction) => {
    setResponseActions((prev) => [action, ...prev])
  }, [])

  const updateIncident = useCallback((id: string, patch: Partial<Incident>) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const addSecurityEvent = useCallback((evt: SecurityEvent) => {
    setSecurityEvents((prev) => [evt, ...prev])
  }, [])

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev])
  }, [])

  const updateAlert = useCallback((id: string, patch: Partial<Alert>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }, [])

  const addAuthEvent = useCallback((evt: AuthEvent) => {
    setAuthEvents((prev) => [evt, ...prev])
  }, [])

  const navigateTo = useCallback((page: string, params: Record<string, string> = {}) => {
    setCurrentPage(page)
    setCurrentParams(params)
    window.scrollTo({ top: 0 })
  }, [])

  const viewReport = useCallback((report: AttackIncidentReport) => {
    setActiveReportModal(report)
  }, [])

  const closeReportModal = useCallback(() => {
    setActiveReportModal(null)
  }, [])

  const sendTestEmail = useCallback(async () => {
    const recipients = emailConfig.recipients.slice(0, 4)
    const testEmail = buildEmergencyEmail({
      targetHost: 'WIN-DC01',
      targetUser: 'administrator',
      sourceIp: '185.220.101.42',
      threatScore: 98,
      wazuhRuleId: '5712',
      classification: 'Active Brute-Force Scanner & Tor Exit Node',
      country: 'Russia',
      recipients,
    })

    // 1. Send REAL zero-API alert via backend REST endpoint to all 4 inboxes!
    dispatchEmailViaBackend({
      targetHost: 'WIN-DC01',
      targetUser: 'administrator',
      sourceIp: '185.220.101.42',
      threatScore: 98,
      wazuhRuleId: '5712',
      recipients,
      subject: testEmail.subject,
      bodyText: testEmail.bodyText,
    })

    setDispatchedEmails((prev) => [testEmail, ...prev])
    setActiveEmailModal(testEmail)

    setNotifications((prev) => [
      {
        id: `notif-test-email-${Date.now()}`,
        severity: 'INFO',
        title: `📧 Real Email Dispatched to 4 Inboxes`,
        detail: `Sent via zero-API relay to: ${recipients.join(', ')}. Please check your inbox and Spam folder.`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ])
  }, [emailConfig])

  const clearLiveLogs = useCallback(async () => {
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current)
      attackIntervalRef.current = null
    }
    setActiveAttack(null)
    setSecurityEvents(SECURITY_EVENTS)
    try {
      localStorage.removeItem('adaptivesoc_active_attack')
      localStorage.removeItem('adaptivesoc_live_events')
    } catch {}
    await clearBackendEvents()
    setNotifications((prev) => [
      {
        id: `notif-clear-${Date.now()}`,
        severity: 'INFO',
        title: `🧹 Live Attack Logs Cleared`,
        detail: `SIEM telemetry buffer reset to baseline state.`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ])
  }, [])

  // ==========================================================================
  // LIVE ATTACK SIMULATION ENGINE
  // ==========================================================================

  const triggerLiveAttack = useCallback((type: AttackType, targetIp?: string) => {
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current)
    }

    const ip = targetIp || (type === 'brute-force' ? '185.220.101.42' : '10.0.10.14')
    const { intel } = checkWazuhThreatIntel(ip)

    if (type === 'brute-force') {
      const targetHost = 'WIN-DC01'
      const targetUser = 'administrator'
      const totalAttempts = 10
      let currentAttempt = 0
      const accumulatedLogs: LiveLogItem[] = []

      const initialState: LiveAttackState = {
        status: 'running',
        attackType: 'brute-force',
        targetHost,
        targetUser,
        sourceIp: ip,
        matchedIntel: intel,
        progress: 0,
        currentAttempt: 0,
        totalAttempts,
        logs: [],
        startTime: new Date().toISOString(),
      }

      setActiveAttack(initialState)
      try {
        localStorage.setItem('adaptivesoc_active_attack', JSON.stringify(initialState))
      } catch {}

      syncAttackToBackend('running', 1)

      const passwords = [
        'Admin123!', 'P@ssw0rd2024', 'Winter2025!', 'CorpAdmin#',
        'Password123', 'Secret@99', 'Welcome1!', 'Root2026$',
        'Administrator1!', 'DomainAdmin!!'
      ]

      attackIntervalRef.current = setInterval(() => {
        currentAttempt++
        const nowIso = new Date().toISOString()
        const pwd = passwords[currentAttempt - 1] || 'UnknownP@ss'

        const logItem: LiveLogItem = {
          id: `log-${Date.now()}-${currentAttempt}`,
          timestamp: nowIso,
          level: 'CRITICAL',
          message: `[WAZUH-ALERT] Event 4625: Failed logon attempt for '${targetUser}' from ${ip} (Password candidate #${currentAttempt}: '${pwd}'). Reason: Unknown username or bad password.`,
          ip,
          user: targetUser,
          host: targetHost,
          eventId: '4625',
          rule: 'AUTH-BRUTE-001',
          isWazuhMatch: true,
        }

        accumulatedLogs.push(logItem)

        // Inject into live SIEM Security Events with isLiveAttack: true
        const liveEvent: SecurityEvent = {
          id: `evt-live-${Date.now()}-${currentAttempt}`,
          timestamp: nowIso,
          severity: 'CRITICAL',
          source: 'Wazuh Live Sensor',
          eventType: 'Brute Force Attempt',
          sourceIp: ip,
          destination: '10.0.10.25',
          user: targetUser,
          host: targetHost,
          rule: 'AUTH-BRUTE-001',
          status: 'Open',
          eventId: '4625',
          description: `Live attack attempt #${currentAttempt} (candidate '${pwd}') against ${targetHost} from Wazuh-flagged IP ${ip}`,
          isLiveAttack: true,
        }

        addSecurityEvent(liveEvent)
        // Transmit directly into backend SIEM REST API!
        postEventToBackend(liveEvent)

        // Persist live events buffer to localStorage
        try {
          const stored = localStorage.getItem('adaptivesoc_live_events')
          const existing = stored ? JSON.parse(stored) : []
          localStorage.setItem('adaptivesoc_live_events', JSON.stringify([liveEvent, ...existing].slice(0, 50)))
        } catch {}

        // Inject into live Auth Events
        addAuthEvent({
          id: `auth-live-${Date.now()}-${currentAttempt}`,
          timestamp: nowIso,
          user: targetUser,
          sourceIp: ip,
          host: targetHost,
          result: 'Failure',
          method: 'NTLMv2',
          country: intel.country,
          privileged: true,
        })

        // On attempt 4, add AI correlation log
        if (currentAttempt === 4) {
          const aiLog: LiveLogItem = {
            id: `log-ai-${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'HIGH',
            message: `[AI CORRELATION] IP ${ip} matched Wazuh Malicious CDB List (Rule ${intel.wazuhRuleId})! Threat Score: ${intel.threatScore}/100. Actor: ${intel.threatActor}.`,
            ip,
            user: targetUser,
            host: targetHost,
            eventId: 'WAZUH-INTEL',
            rule: intel.wazuhRuleId,
            isWazuhMatch: true,
          }
          accumulatedLogs.push(aiLog)
          postEventToBackend({
            ...liveEvent,
            id: `evt-ai-${Date.now()}`,
            severity: 'HIGH',
            eventType: 'AI Threat Intelligence Match',
            description: aiLog.message,
          })
        }

        // On attempt 6, trigger Alert, Notification, and REAL Emergency Email Dispatch to 4 inboxes
        if (currentAttempt === 6) {
          syncAttackToBackend('detected', 6)
          const alertId = `ALR-LIVE-${Date.now()}`
          addAlert({
            id: alertId,
            severity: 'CRITICAL',
            rule: `SSH/RDP & SMB Brute Force (Wazuh Rule ${intel.wazuhRuleId})`,
            ruleId: 'AUTH-BRUTE-001',
            sourceIp: ip,
            target: `${targetHost} (${targetUser})`,
            firstSeen: nowIso,
            lastSeen: nowIso,
            occurrences: currentAttempt,
            riskScore: intel.threatScore,
            status: 'Open',
            mitreId: 'T1110.001',
            host: targetHost,
            user: targetUser,
            assignee: 'Wazuh AI Correlation Engine',
            description: `Live brute force attack detected from blacklisted IP ${ip} targeting ${targetUser}. Threat score ${intel.threatScore}/100.`,
          })

          setNotifications((prev) => [
            {
              id: `notif-live-${Date.now()}`,
              severity: 'CRITICAL',
              title: `🚨 LIVE ATTACK DETECTED: Brute Force from ${ip}`,
              detail: `Matched Wazuh Threat Intel (Rule ${intel.wazuhRuleId}). Target: ${targetHost}. Risk ${intel.threatScore}/100.`,
              timestamp: nowIso,
              read: false,
              link: { page: 'alerts', id: alertId },
            },
            ...prev,
          ])

          // REAL EMERGENCY EMAIL DISPATCH TO ALL 4 INBOXES
          if (emailConfig.enabled && emailConfig.recipients.length > 0) {
            const recipients = emailConfig.recipients.slice(0, 4)
            const emergencyEmail = buildEmergencyEmail({
              targetHost,
              targetUser,
              sourceIp: ip,
              threatScore: intel.threatScore,
              wazuhRuleId: intel.wazuhRuleId,
              classification: intel.classification,
              country: intel.country,
              recipients,
              attackId: alertId,
            })

            // 1. Dispatch real zero-API email through backend to all 4 inboxes!
            dispatchEmailViaBackend({
              targetHost,
              targetUser,
              sourceIp: ip,
              threatScore: intel.threatScore,
              wazuhRuleId: intel.wazuhRuleId,
              recipients,
              subject: emergencyEmail.subject,
              bodyText: emergencyEmail.bodyText,
            })

            setDispatchedEmails((prev) => [emergencyEmail, ...prev])
            setActiveEmailModal(emergencyEmail)

            accumulatedLogs.push({
              id: `log-email-${Date.now()}`,
              timestamp: new Date().toISOString(),
              level: 'CRITICAL',
              message: `[EMAIL DISPATCH] 🚨 Critical Incident Alert dispatched to 4 inboxes: ${recipients.join(', ')}`,
              ip,
              user: targetUser,
              host: targetHost,
              eventId: 'SMTP-DISPATCH',
              rule: 'EMAIL-ALERT-001',
              isWazuhMatch: true,
            })

            setNotifications((prev) => [
              {
                id: `notif-email-${Date.now()}`,
                severity: 'CRITICAL',
                title: `📧 Email Alert Dispatched to 4 Inboxes`,
                detail: `Real email sent to: ${recipients.join(', ')}. Please check your inbox and Spam folder.`,
                timestamp: nowIso,
                read: false,
              },
              ...prev,
            ])
          }
        }

        setActiveAttack((prev) => {
          if (!prev) return null
          const nextState: LiveAttackState = {
            ...prev,
            currentAttempt,
            progress: Math.round((currentAttempt / totalAttempts) * 100),
            logs: [...accumulatedLogs],
          }
          try {
            localStorage.setItem('adaptivesoc_active_attack', JSON.stringify(nextState))
          } catch {}
          return nextState
        })

        if (currentAttempt >= totalAttempts) {
          clearInterval(attackIntervalRef.current)
          attackIntervalRef.current = null
          setActiveAttack((prev) => {
            if (!prev) return null
            const finalState: LiveAttackState = {
              ...prev,
              status: 'detected',
              progress: 100,
            }
            try {
              localStorage.setItem('adaptivesoc_active_attack', JSON.stringify(finalState))
            } catch {}
            return finalState
          })
        }
      }, 350)

    } else {
      // Normal Login Simulation
      const targetHost = 'WIN-APP02'
      const targetUser = 'm.chen'
      const nowIso = new Date().toISOString()

      const logs: LiveLogItem[] = [
        {
          id: `log-norm-1-${Date.now()}`,
          timestamp: nowIso,
          level: 'INFO',
          message: `[WAZUH-AGENT] Event 4624: Successful logon for user '${targetUser}' on host ${targetHost} from IP ${ip}. Logon Type 2 (Interactive).`,
          ip,
          user: targetUser,
          host: targetHost,
          eventId: '4624',
          rule: 'AUTH-SUCCESS-001',
          isWazuhMatch: false,
        },
        {
          id: `log-norm-2-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[AI CORRELATION] IP ${ip} evaluated against Wazuh Malicious Database -> RESULT: CLEAN. Threat score: 0/100. Whitelisted Corporate Host.`,
          ip,
          user: targetUser,
          host: targetHost,
          eventId: 'AI-VERIFY',
          rule: 'RULE-CLEAN-BASELINE',
          isWazuhMatch: false,
        },
        {
          id: `log-norm-3-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: `[SOC VERDICT] Baseline authorized session approved. Zero anomaly detected. No false-positive alert triggered.`,
          ip,
          user: targetUser,
          host: targetHost,
          eventId: 'SOC-AUDIT',
          rule: 'RULE-BASELINE',
          isWazuhMatch: false,
        },
      ]

      addSecurityEvent({
        id: `evt-norm-${Date.now()}`,
        timestamp: nowIso,
        severity: 'INFO',
        source: 'Wazuh Agent',
        eventType: 'Successful Logon',
        sourceIp: ip,
        destination: '10.0.10.15',
        user: targetUser,
        host: targetHost,
        rule: 'AUTH-SUCCESS-001',
        status: 'Resolved',
        eventId: '4624',
        description: `Authorized interactive logon for ${targetUser} from internal workstation ${ip}`,
      })

      addAuthEvent({
        id: `auth-norm-${Date.now()}`,
        timestamp: nowIso,
        user: targetUser,
        sourceIp: ip,
        host: targetHost,
        result: 'Success',
        method: 'Kerberos',
        country: 'Internal Corporate Network',
        privileged: false,
      })

      const reportId = `REP-2026-BASE-${Math.floor(1000 + Math.random() * 9000)}`
      const cleanReport: AttackIncidentReport = {
        id: reportId,
        title: `Baseline Authentication Audit: Normal User Login from ${ip}`,
        generatedAt: nowIso,
        attackType: 'normal-login',
        severity: 'INFO',
        status: 'Clean Baseline Verified',
        sourceIp: ip,
        targetHost,
        targetUser,
        wazuhMatch: false,
        wazuhRuleId: 'RULE-CLEAN-BASELINE',
        wazuhRuleDescription: 'Legitimate internal authentication - authorized Active Directory member',
        threatScore: 0,
        reputation: 'Clean',
        country: 'Internal Corporate Network',
        asn: 'AS-PRIVATE (Internal RFC-1918)',
        mitreTactic: 'Normal Activity',
        mitreTechnique: 'Authorized Authentication',
        totalAttempts: 1,
        durationSeconds: 1,
        executiveSummary: `An authorized logon was observed for user '${targetUser}' on '${targetHost}' originating from internal workstation IP ${ip}. Telemetry matched standard organizational operational baseline without deviation.`,
        aiVerdict: `VERIFIED NORMAL ACCESS: IP ${ip} belongs to ${intel.classification}. Threat score: 0/100. Behavioral and threat intelligence correlation confirmed authentic employee activity with zero indicators of compromise.`,
        remediationActions: [
          'No remediation required; activity conforms to approved baseline',
          'Logged successful session audit trail in SIEM compliance archive',
          'Verified Kerberos ticket issuance validity with Domain Controller',
        ],
        recommendations: [
          'Continue regular baseline behavioral monitoring',
          'Ensure all endpoints maintain active Wazuh agent telemetry synchronization',
          'Periodically review privileged group memberships',
        ],
        evidenceLogs: logs,
      }

      setIncidentReports((prev) => [cleanReport, ...prev])
      setActiveAttack({
        status: 'solved',
        attackType: 'normal-login',
        targetHost,
        targetUser,
        sourceIp: ip,
        matchedIntel: intel,
        progress: 100,
        currentAttempt: 1,
        totalAttempts: 1,
        logs,
        reportId,
        startTime: nowIso,
        endTime: nowIso,
      })

      setActiveReportModal(cleanReport)

      setNotifications((prev) => [
        {
          id: `notif-norm-${Date.now()}`,
          severity: 'INFO',
          title: `✅ Clean Login Verified: ${targetUser}`,
          detail: `Telemetry matched baseline. Baseline Report ${reportId} generated.`,
          timestamp: nowIso,
          read: false,
        },
        ...prev,
      ])
    }
  }, [addSecurityEvent, addAuthEvent, addAlert, emailConfig])

  // ==========================================================================
  // SOLVE ATTACK & GENERATE REPORT
  // ==========================================================================

  const solveCurrentAttack = useCallback(() => {
    if (!activeAttack) return

    setActiveAttack((prev) => (prev ? { ...prev, status: 'mitigating' } : null))

    setTimeout(() => {
      const nowIso = new Date().toISOString()
      const ip = activeAttack.sourceIp
      const { intel } = checkWazuhThreatIntel(ip)
      const reportId = `REP-2026-LIVE-${Math.floor(1000 + Math.random() * 9000)}`

      // 1. Execute Active Response Action
      addResponseAction({
        id: `act-live-${Date.now()}`,
        action: 'Block IP',
        target: ip,
        triggeredBy: 'Wazuh Active Response (AI Engine)',
        timestamp: nowIso,
        status: 'Completed',
        detail: `Blocked at perimeter firewall via Wazuh Rule ${intel.wazuhRuleId} (firewall-drop). Attack contained.`,
      })

      // 2. Add Active Response log
      const mitigationLogs: LiveLogItem[] = [
        ...activeAttack.logs,
        {
          id: `log-mit-1-${Date.now()}`,
          timestamp: nowIso,
          level: 'HIGH',
          message: `[ACTIVE RESPONSE] Executed Wazuh Active Response rule 80710 (firewall-drop). IP ${ip} permanently blocked at firewall.`,
          ip,
          user: activeAttack.targetUser,
          host: activeAttack.targetHost,
          eventId: '80710',
          rule: 'ACTIVE-RESP-001',
          isWazuhMatch: true,
        },
        {
          id: `log-mit-2-${Date.now()}`,
          timestamp: nowIso,
          level: 'HIGH',
          message: `[SECURITY ACTION] Account '${activeAttack.targetUser}' placed in temporary containment. Mandatory MFA challenge triggered.`,
          ip,
          user: activeAttack.targetUser,
          host: activeAttack.targetHost,
          eventId: 'USER-LOCK',
          rule: 'ACTIVE-RESP-002',
          isWazuhMatch: true,
        },
      ]

      // 3. Generate Comprehensive Incident Report
      const incidentReport: AttackIncidentReport = {
        id: reportId,
        title: `Incident Investigation Report: Brute-Force Attack from ${ip}`,
        generatedAt: nowIso,
        attackType: 'brute-force',
        severity: 'CRITICAL',
        status: 'Contained & Resolved',
        sourceIp: ip,
        targetHost: activeAttack.targetHost,
        targetUser: activeAttack.targetUser,
        wazuhMatch: true,
        wazuhRuleId: intel.wazuhRuleId,
        wazuhRuleDescription: intel.wazuhRuleDescription,
        threatScore: intel.threatScore,
        reputation: intel.reputation,
        country: `${intel.country} (${intel.city})`,
        asn: intel.asn,
        mitreTactic: intel.mitreTactic,
        mitreTechnique: intel.mitreTechnique,
        totalAttempts: activeAttack.currentAttempt,
        durationSeconds: 4,
        executiveSummary: `A high-frequency authentication brute-force attack was detected against Domain Controller '${activeAttack.targetHost}' targeting privileged account '${activeAttack.targetUser}'. The attacking source IP ${ip} was matched in real-time against the Wazuh Threat Intelligence CDB list (Wazuh Rule ${intel.wazuhRuleId}), scoring a critical threat score of ${intel.threatScore}/100. Automated active response engaged, blocking the IP across all boundary firewalls and preserving system integrity.`,
        aiVerdict: `CRITICAL ATTACK NEUTRALIZED: Telemetry matches automated credential guessing tools affiliated with ${intel.threatActor}. Attack progression exceeded configured brute-force thresholds (Event ID 4625). Wazuh AI correlation identified the source as ${intel.classification}. Active response mitigated the threat before unauthorized access was achieved. Zero lateral movement observed.`,
        remediationActions: [
          `Permanently blocked malicious IP ${ip} at perimeter firewall (Wazuh Active Response: firewall-drop.sh)`,
          `Terminated all active SMB, RDP, and Kerberos handshakes originating from ${ip}`,
          `Enforced temporary security lockout on account '${activeAttack.targetUser}' and forced MFA reset`,
          `Synchronized ${ip} to distributed SIEM blacklists and external IDS sensor arrays`,
          `Generated and archived forensic evidence package for compliance and audit trail`,
        ],
        recommendations: [
          'Enforce strict Account Lockout policy after 5 failed authentication attempts across the domain',
          'Restrict direct external exposure of Domain Controller RDP/SMB ports; require bastion host with MFA',
          'Enable geo-IP filtering to drop incoming authentication attempts from unexpected geographic regions',
          'Deploy Windows Defender Credential Guard to prevent memory dumping of hashed credentials',
          'Maintain real-time synchronization between Wazuh rules and AlienVault OTX / AbuseIPDB threat feeds',
        ],
        evidenceLogs: mitigationLogs,
      }

      setIncidentReports((prev) => {
        const next = [incidentReport, ...prev]
        try {
          localStorage.setItem('adaptivesoc_reports', JSON.stringify(next))
        } catch {}
        return next
      })
      syncAttackToBackend('solved', 10)
      const solvedState: LiveAttackState = {
        ...activeAttack,
        status: 'solved',
        reportId,
        logs: mitigationLogs,
        endTime: nowIso,
      }
      try {
        localStorage.setItem('adaptivesoc_active_attack', JSON.stringify(solvedState))
      } catch {}
      setActiveAttack(solvedState)

      // Pop up report modal
      setActiveReportModal(incidentReport)

      // Add success notification
      setNotifications((prev) => [
        {
          id: `notif-mit-${Date.now()}`,
          severity: 'HIGH',
          title: `🛡️ Threat Mitigated & Incident Report Generated`,
          detail: `Brute force from ${ip} contained. Incident report ${reportId} is ready for export.`,
          timestamp: nowIso,
          read: false,
        },
        ...prev,
      ])
    }, 700)
  }, [activeAttack, addResponseAction])

  const value: SocContextValue = {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    responseActions,
    executeAction,
    addResponseAction,
    incidents,
    updateIncident,
    securityEvents,
    addSecurityEvent,
    alerts,
    addAlert,
    updateAlert,
    authEvents,
    addAuthEvent,
    activeAttack,
    incidentReports,
    activeReportModal,
    isSimulatorOpen,
    setSimulatorOpen,
    triggerLiveAttack,
    solveCurrentAttack,
    clearLiveLogs,
    viewReport,
    closeReportModal,
    emailConfig,
    setEmailConfig,
    dispatchedEmails,
    activeEmailModal,
    setActiveEmailModal,
    sendTestEmail,
    timeRange,
    setTimeRange,
    globalSearch,
    setGlobalSearch,
    navigateTo,
    currentPage,
    currentParams,
  }

  return <SocContext.Provider value={value}>{children}</SocContext.Provider>
}
