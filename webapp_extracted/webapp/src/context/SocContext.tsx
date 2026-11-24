import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type {
  NotificationItem,
  ResponseAction,
  Incident,
  SecurityEvent,
  TimeRange,
  Host,
  Alert,
  VerificationRecord,
  DetectionItem,
} from '../types'
import {
  api,
  type ApiEmployeeUser,
  type EmployeeRegistrationPayload,
  type FirewallBlockResponse,
  type BackendEventRow,
  type BackendDetectionRow,
  type BackendIncidentRow,
  type BackendResponseRow,
  type BackendVerificationRow,
  type BackendNotificationRow,
  type BackendHostRow,
  type BackendRiskRow,
  type BackendAuditLogRow,
} from '../lib/api'
import {
  adaptBackendEvent,
  adaptBackendDetection,
  detectionToAlert,
  adaptBackendIncident,
  adaptBackendResponse,
  adaptBackendVerification,
  adaptBackendNotification,
  adaptBackendHost,
  type CorrelationMaps,
} from '../lib/adapters'

interface SocContextValue {
  // Authentication
  currentUser: ApiEmployeeUser | null
  isAuthenticated: boolean
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  login: (identifier: string, password: string) => Promise<void>
  register: (payload: EmployeeRegistrationPayload) => Promise<void>
  logout: () => Promise<void>

  // Backend Connectivity & State
  backendConnected: boolean
  isLoading: boolean
  refreshData: () => Promise<void>

  // Notifications
  notifications: NotificationItem[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void

  // Telemetry & Records
  securityEvents: SecurityEvent[]
  detections: DetectionItem[]
  alerts: Alert[]
  incidents: Incident[]
  responseActions: ResponseAction[]
  verifications: VerificationRecord[]
  hosts: Host[]
  auditLogs: BackendAuditLogRow[]

  // Real Calculated Metrics
  totalEvents: number
  totalDetections: number
  totalIncidents: number
  totalResponses: number
  successfulFirewallActions: number
  verifiedPreventions: number
  totalVerifications: number
  monitoredHostsCount: number

  // Actions
  executeAction: (id: string) => void
  addResponseAction: (action: ResponseAction) => void
  executeBlockIp: (riskId: number, targetIp: string) => Promise<FirewallBlockResponse>
  updateIncident: (id: string, patch: Partial<Incident>) => void

  // Navigation & UI
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
  // Auth state
  const [currentUser, setCurrentUser] = useState<ApiEmployeeUser | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Real backend state (initialized empty, populated from FastAPI)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [detections, setDetections] = useState<DetectionItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([])
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [auditLogs, setAuditLogs] = useState<BackendAuditLogRow[]>([])

  const [backendConnected, setBackendConnected] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const lastFingerprintRef = React.useRef<string>('')

  // Navigation and filter state
  const [timeRange, setTimeRange] = useState<TimeRange>('1h')
  const [globalSearch, setGlobalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState('overview')
  const [currentParams, setCurrentParams] = useState<Record<string, string>>({})

  // Session restoration
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('soc_session_token') : null
    if (token) {
      api.restoreSession(token)
        .then((res) => {
          if (res?.user) {
            setCurrentUser(res.user)
          }
        })
        .catch(() => {
          localStorage.removeItem('soc_session_token')
        })
    }
  }, [])

  // Live backend data loader & correlation engine
  const refreshData = useCallback(async () => {
    try {
      const [
        eventsRes,
        detectionsRes,
        incidentsRes,
        responsesRes,
        verificationsRes,
        notificationsRes,
        auditLogsRes,
        hostsRes,
        risksRes,
      ] = await Promise.allSettled([
        api.getEvents(),
        api.getDetections(),
        api.getIncidents(),
        api.getResponses(),
        api.getVerifications(),
        api.getNotifications(),
        api.getAuditLogs(),
        api.listTable<BackendHostRow>('hosts'),
        api.listTable<BackendRiskRow>('risks'),
      ])

      let connected = false

      // Raw rows
      const rawEvents: BackendEventRow[] =
        eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value) ? eventsRes.value : []
      const rawDetections: BackendDetectionRow[] =
        detectionsRes.status === 'fulfilled' && Array.isArray(detectionsRes.value) ? detectionsRes.value : []
      const rawIncidents: BackendIncidentRow[] =
        incidentsRes.status === 'fulfilled' && Array.isArray(incidentsRes.value) ? incidentsRes.value : []
      const rawResponses: BackendResponseRow[] =
        responsesRes.status === 'fulfilled' && Array.isArray(responsesRes.value) ? responsesRes.value : []
      const rawVerifications: BackendVerificationRow[] =
        verificationsRes.status === 'fulfilled' && Array.isArray(verificationsRes.value) ? verificationsRes.value : []
      const rawNotifications: BackendNotificationRow[] =
        notificationsRes.status === 'fulfilled' && Array.isArray(notificationsRes.value) ? notificationsRes.value : []
      const rawAuditLogs: BackendAuditLogRow[] =
        auditLogsRes.status === 'fulfilled' && Array.isArray(auditLogsRes.value) ? auditLogsRes.value : []
      const rawHosts: BackendHostRow[] =
        hostsRes.status === 'fulfilled' && Array.isArray(hostsRes.value?.data) ? hostsRes.value.data : []
      const rawRisks: BackendRiskRow[] =
        risksRes.status === 'fulfilled' && Array.isArray(risksRes.value?.data) ? risksRes.value.data : []

      if (rawEvents.length > 0 || rawDetections.length > 0 || rawResponses.length > 0) {
        connected = true
      }

      setBackendConnected(connected)

      // Calculate data fingerprint to avoid thrashing React state if records have not changed
      const currentFingerprint = `${rawEvents.length}:${rawEvents[0]?.event_id}:${rawDetections.length}:${rawIncidents.length}:${rawResponses.length}:${rawVerifications.length}:${rawHosts.length}`
      if (lastFingerprintRef.current === currentFingerprint && lastFingerprintRef.current !== '') {
        return
      }
      lastFingerprintRef.current = currentFingerprint

      // Build Correlation Maps
      const eventsById = new Map<number, BackendEventRow>()
      for (const e of rawEvents) eventsById.set(e.event_id, e)

      const detectionsById = new Map<number, BackendDetectionRow>()
      const detectionsByEventId = new Map<number, BackendDetectionRow>()
      for (const d of rawDetections) {
        detectionsById.set(d.detection_id, d)
        detectionsByEventId.set(d.event_id, d)
      }

      const risksById = new Map<number, BackendRiskRow>()
      const risksByDetectionId = new Map<number, BackendRiskRow>()
      for (const r of rawRisks) {
        risksById.set(r.risk_id, r)
        risksByDetectionId.set(r.detection_id, r)
      }

      const responsesById = new Map<number, BackendResponseRow>()
      const responsesByRiskId = new Map<number, BackendResponseRow>()
      for (const resp of rawResponses) {
        responsesById.set(resp.response_id, resp)
        responsesByRiskId.set(resp.risk_id, resp)
      }

      const verificationsByResponseId = new Map<number, BackendVerificationRow>()
      for (const v of rawVerifications) {
        verificationsByResponseId.set(v.response_id, v)
      }

      const incidentsByDetectionId = new Map<number, BackendIncidentRow>()
      for (const inc of rawIncidents) {
        incidentsByDetectionId.set(inc.detection_id, inc)
      }

      const correlations: CorrelationMaps = {
        eventsById,
        detectionsById,
        risksByDetectionId,
        risksById,
        responsesByRiskId,
        responsesById,
        verificationsByResponseId,
        incidentsByDetectionId,
      }

      // 1. Adapted Security Events
      const adaptedEvents: SecurityEvent[] = rawEvents.map((e) => {
        const linkedDet = detectionsByEventId.get(e.event_id)
        return adaptBackendEvent(e, linkedDet?.detection_id)
      })
      setSecurityEvents(adaptedEvents)

      // 2. Adapted Detections & Alerts
      const adaptedDetections: DetectionItem[] = rawDetections.map((d) =>
        adaptBackendDetection(d, correlations)
      )
      setDetections(adaptedDetections)
      setAlerts(adaptedDetections.map(detectionToAlert))

      // 3. Adapted Incidents
      const adaptedIncidents: Incident[] = rawIncidents.map((i) =>
        adaptBackendIncident(i, correlations)
      )
      setIncidents(adaptedIncidents)

      // 4. Adapted Response Actions
      const adaptedResponses: ResponseAction[] = rawResponses.map((r) =>
        adaptBackendResponse(r, correlations)
      )
      setResponseActions(adaptedResponses)

      // 5. Adapted Verifications
      const adaptedVerifications: VerificationRecord[] = rawVerifications.map((v) =>
        adaptBackendVerification(v, responsesById)
      )
      setVerifications(adaptedVerifications)

      // 6. Adapted Hosts
      const adaptedHosts: Host[] = rawHosts.map(adaptBackendHost)
      setHosts(adaptedHosts)

      // 7. Adapted Notifications
      const adaptedNotifications: NotificationItem[] = rawNotifications.map(adaptBackendNotification)
      setNotifications(adaptedNotifications)

      // 8. Audit logs
      setAuditLogs(rawAuditLogs)

      setBackendConnected(connected)
    } catch {
      setBackendConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load & periodic poll
  useEffect(() => {
    refreshData()
    const timer = setInterval(() => {
      refreshData()
    }, 25000)
    return () => clearInterval(timer)
  }, [refreshData])

  // Auth actions
  const login = useCallback(
    async (identifier: string, pass: string) => {
      const res = await api.login({ identifier, password: pass })
      if (res.token) {
        localStorage.setItem('soc_session_token', res.token)
      }
      setCurrentUser(res.user)
      await refreshData()
    },
    [refreshData]
  )

  const register = useCallback(async (payload: EmployeeRegistrationPayload) => {
    await api.register(payload)
  }, [])

  const logout = useCallback(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('soc_session_token') : null
    if (token) {
      try {
        await api.logout(token)
      } catch {
        // Ignore logout errors
      }
      localStorage.removeItem('soc_session_token')
    }
    setCurrentUser(null)
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  // Real Windows Firewall block execution
  const executeBlockIp = useCallback(
    async (riskId: number, targetIp: string): Promise<FirewallBlockResponse> => {
      const res = await api.blockIp({ risk_id: riskId, target_ip: targetIp })
      await refreshData()
      return res
    },
    [refreshData]
  )

  const executeAction = useCallback(
    (id: string) => {
      setResponseActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Executing' } : a))
      )
      setTimeout(() => {
        refreshData()
      }, 1200)
    },
    [refreshData]
  )

  const addResponseAction = useCallback((action: ResponseAction) => {
    setResponseActions((prev) => [action, ...prev])
  }, [])

  const updateIncident = useCallback((id: string, patch: Partial<Incident>) => {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }, [])

  const navigateTo = useCallback((page: string, params: Record<string, string> = {}) => {
    setCurrentPage(page)
    setCurrentParams(params)
    window.scrollTo({ top: 0 })
  }, [])

  // Calculated Real Statistics
  const totalEvents = securityEvents.length
  const totalDetections = detections.length
  const totalIncidents = incidents.length
  const totalResponses = responseActions.length
  const successfulFirewallActions = responseActions.filter(
    (r) => r.status === 'Completed'
  ).length
  const verifiedPreventions = verifications.filter(
    (v) => v.result === 'STOPPED'
  ).length
  const totalVerifications = verifications.length
  const monitoredHostsCount = hosts.length

  const value: SocContextValue = {
    currentUser,
    isAuthenticated: !!currentUser,
    authModalOpen,
    setAuthModalOpen,
    login,
    register,
    logout,
    backendConnected,
    isLoading,
    refreshData,
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    securityEvents,
    detections,
    alerts,
    incidents,
    responseActions,
    verifications,
    hosts,
    auditLogs,
    totalEvents,
    totalDetections,
    totalIncidents,
    totalResponses,
    successfulFirewallActions,
    verifiedPreventions,
    totalVerifications,
    monitoredHostsCount,
    executeAction,
    addResponseAction,
    executeBlockIp,
    updateIncident,
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
