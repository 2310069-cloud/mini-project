import React, { useEffect, useRef, useState } from 'react'
import { Search, Bell, Menu, ChevronDown, User, LogOut, Settings as SettingsIcon, Zap, AlertTriangle } from 'lucide-react'
import { useSoc } from '../../context/SocContext'
import { NotificationPanel } from '../NotificationPanel'
import { GlobalSearchOverlay } from '../GlobalSearchOverlay'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { unreadCount, isSimulatorOpen, setSimulatorOpen, activeAttack } = useSoc()
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
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

  const isDetected = activeAttack?.status === 'detected'
  const isRunning = activeAttack?.status === 'running'

  return (
    <>
      <header className="h-14 bg-surface-1 border-b border-surface-border flex items-center gap-2.5 px-3 lg:px-5 sticky top-0 z-30 shrink-0">
        <button onClick={onOpenMobileNav} className="lg:hidden text-text-secondary hover:text-text-primary p-1">
          <Menu size={20} />
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted">
          <span className="font-semibold text-text-secondary">AdaptiveSOC</span>
          <span className="text-surface-border">/</span>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-status-success/30 bg-status-successBg text-status-success px-2 py-0.5 font-medium text-[11px]">
            Environment: LAB
          </span>
        </div>

        {/* Attack Simulator Launcher Button */}
        <button
          onClick={() => setSimulatorOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-semibold transition-all border shrink-0 ${
            isDetected
              ? 'bg-sev-critical text-white border-sev-critical animate-pulse shadow-md shadow-sev-critical/30'
              : isRunning
              ? 'bg-accent/20 text-accent border-accent/40 animate-pulse'
              : 'bg-surface-3 hover:bg-surface-4 text-text-primary border-surface-borderLight hover:border-accent/40'
          }`}
          title="Launch Live Attack Simulation Lab"
        >
          {isDetected ? (
            <AlertTriangle size={14} className="text-white animate-bounce" />
          ) : (
            <Zap size={14} className="text-accent" />
          )}
          <span className="hidden sm:inline">Attack Simulator</span>
          {isDetected ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-white font-bold uppercase">
              ACTIVE THREAT
            </span>
          ) : isRunning ? (
            <span className="text-[10px] px-1 rounded bg-accent/30 text-accent font-data font-bold">
              {activeAttack?.progress}%
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-status-danger/20 text-status-danger">
              LIVE
            </span>
          )}
        </button>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-sm sm:max-w-md flex items-center gap-2.5 bg-surface-3 hover:bg-surface-4 border border-surface-borderLight rounded-sm px-3 py-1.5 text-left transition-colors ml-1"
        >
          <Search size={14} className="text-text-muted shrink-0" />
          <span className="text-[12.5px] text-text-muted flex-1 truncate">
            Search events, alerts, incidents, IPs, hosts...
          </span>
          <kbd className="hidden sm:inline-flex text-[10px] text-text-muted bg-surface-4 border border-surface-borderLight rounded px-1.5 py-0.5 font-data">
            ⌘K
          </kbd>
        </button>

        <div className="flex-1" />

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

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-sm hover:bg-white/5 transition-colors"
          >
            <div className="h-7 w-7 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-[11px] font-bold font-data">
              SO
            </div>
            <div className="hidden xl:flex flex-col items-start leading-tight">
              <span className="text-[12px] font-medium text-text-primary">S. Okafor</span>
              <span className="text-[10px] text-text-muted">Tier 2 Analyst</span>
            </div>
            <ChevronDown size={14} className="text-text-muted hidden xl:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-3 border border-surface-borderLight rounded-md shadow-panel overflow-hidden z-40">
              <div className="p-3 border-b border-surface-border">
                <div className="text-[13px] font-semibold text-text-primary">S. Okafor</div>
                <div className="text-[11px] text-text-muted">s.okafor@adaptivesoc.lab</div>
                <div className="text-[11px] text-text-muted mt-0.5">Tier 2 SOC Analyst</div>
              </div>
              <button
                onClick={() => { setProfileOpen(false); setSimulatorOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-accent hover:bg-white/5 text-left font-medium"
              >
                <Zap size={14} /> Attack Simulator
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-text-secondary hover:bg-white/5 hover:text-text-primary">
                <User size={14} /> View Profile
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-text-secondary hover:bg-white/5 hover:text-text-primary">
                <SettingsIcon size={14} /> Preferences
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-text-secondary hover:bg-white/5 hover:text-text-primary border-t border-surface-border">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Live Attack Detected Alert Ribbon */}
      {isDetected && (
        <div className="bg-sev-critical text-white px-4 py-2 flex items-center justify-between text-xs font-semibold z-20 sticky top-14 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="truncate">
              🚨 LIVE ATTACK CONFIRMED: Brute-Force in progress against {activeAttack.targetHost} from {activeAttack.sourceIp} (Wazuh Rule {activeAttack.matchedIntel?.wazuhRuleId})
            </span>
          </div>
          <button
            onClick={() => setSimulatorOpen(true)}
            className="shrink-0 bg-white text-sev-critical px-2.5 py-1 rounded text-xs font-bold hover:bg-white/90 transition-colors ml-3"
          >
            Contain Threat
          </button>
        </div>
      )}

      <GlobalSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
