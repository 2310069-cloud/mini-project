import React, { useEffect, useRef, useState } from 'react'
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  LogOut,
  LogIn,
  RotateCw,
  Server,
} from 'lucide-react'
import { useSoc } from '../../context/SocContext'
import { NotificationPanel } from '../NotificationPanel'
import { GlobalSearchOverlay } from '../GlobalSearchOverlay'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const {
    unreadCount,
    currentUser,
    isAuthenticated,
    setAuthModalOpen,
    logout,
    backendConnected,
    refreshData,
  } = useSoc()

  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(new Date())
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SO'

  return (
    <>
      <header className="h-14 bg-surface-1 border-b border-surface-border flex items-center gap-3 px-3 lg:px-5 sticky top-0 z-30 shrink-0">
        <button onClick={onOpenMobileNav} className="lg:hidden text-text-secondary hover:text-text-primary p-1">
          <Menu size={20} />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted">
          <span className="font-semibold text-text-secondary">AdaptiveSOC</span>
          <span className="text-surface-border">/</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-medium text-[11px] ${
              backendConnected
                ? 'border-status-success/30 bg-status-successBg text-status-success'
                : 'border-sev-medium/30 bg-sev-mediumBg text-sev-medium'
            }`}
            title="FastAPI backend status at http://127.0.0.1:8000"
          >
            <Server size={11} />
            {backendConnected ? 'Backend: 127.0.0.1:8000' : 'Connecting: 127.0.0.1:8000'}
          </span>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-md flex items-center gap-2.5 bg-surface-3 hover:bg-surface-4 border border-surface-borderLight rounded-sm px-3 py-1.5 text-left transition-colors ml-1 lg:ml-3"
        >
          <Search size={14} className="text-text-muted shrink-0" />
          <span className="text-[13px] text-text-muted flex-1 truncate">
            Search events, alerts, incidents, IPs, hosts...
          </span>
          <kbd className="hidden sm:inline-flex text-[10px] text-text-muted bg-surface-4 border border-surface-borderLight rounded px-1.5 py-0.5 font-data">
            ⌘K
          </kbd>
        </button>

        <div className="flex-1" />

        {/* Refresh button */}
        <button
          onClick={handleManualRefresh}
          title="Refresh telemetry from backend"
          className="h-8 w-8 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <RotateCw size={15} className={refreshing ? 'animate-spin text-accent' : ''} />
        </button>

        {/* Time */}
        <div className="hidden md:flex flex-col items-end leading-tight mr-1">
          <span className="font-data text-[13px] text-text-primary tabular">
            {now.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className="text-[10px] text-text-muted">
            {now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative h-9 w-9 flex items-center justify-center rounded-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-sev-critical text-white text-[9px] font-bold flex items-center justify-center font-data">
                {unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Profile / Auth trigger */}
        <div className="relative" ref={profileRef}>
          {isAuthenticated && currentUser ? (
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-sm hover:bg-white/5 transition-colors"
            >
              <div className="h-7 w-7 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-[11px] font-bold font-data">
                {initials}
              </div>
              <div className="hidden xl:flex flex-col items-start leading-tight">
                <span className="text-[12px] font-medium text-text-primary">{currentUser.full_name}</span>
                <span className="text-[10px] text-text-muted">{currentUser.department || 'SOC Operator'}</span>
              </div>
              <ChevronDown size={14} className="text-text-muted hidden xl:block" />
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-accent/15 border border-accent/40 text-accent hover:bg-accent/25 text-[12px] font-medium transition-colors"
            >
              <LogIn size={14} />
              <span>Operator Login</span>
            </button>
          )}

          {profileOpen && isAuthenticated && currentUser && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-surface-3 border border-surface-borderLight rounded-md shadow-panel overflow-hidden z-40">
              <div className="p-3 border-b border-surface-border">
                <div className="text-[13px] font-semibold text-text-primary">{currentUser.full_name}</div>
                <div className="text-[11px] text-text-muted">{currentUser.email}</div>
                <div className="text-[11px] text-accent mt-0.5">ID: {currentUser.employee_id} · {currentUser.department}</div>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false)
                  setAuthModalOpen(true)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-text-secondary hover:bg-white/5 hover:text-text-primary"
              >
                <User size={14} /> Switch / Register Account
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-sev-critical hover:bg-sev-criticalBg hover:text-sev-critical border-t border-surface-border transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <GlobalSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
