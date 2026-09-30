import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { NotificationItem, ResponseAction, Incident, TimeRange } from '../types'
import { INITIAL_NOTIFICATIONS, INITIAL_RESPONSE_ACTIONS, INCIDENTS } from '../data/generator'

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
  const [timeRange, setTimeRange] = useState<TimeRange>('1h')
  const [globalSearch, setGlobalSearch] = useState('')
  const [currentPage, setCurrentPage] = useState('overview')
  const [currentParams, setCurrentParams] = useState<Record<string, string>>({})

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

  const navigateTo = useCallback((page: string, params: Record<string, string> = {}) => {
    setCurrentPage(page)
    setCurrentParams(params)
    window.scrollTo({ top: 0 })
  }, [])

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
