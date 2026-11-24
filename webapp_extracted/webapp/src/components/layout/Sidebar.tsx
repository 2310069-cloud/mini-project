import React from 'react'
import {
  LayoutDashboard, Activity, ShieldAlert, FolderOpen, Radar, Server,
  KeyRound, Network, Crosshair, BrainCircuit, Zap, FileBarChart,
  Settings, ShieldCheck, X,
} from 'lucide-react'
import { useSoc } from '../../context/SocContext'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={17} /> },
  { id: 'events', label: 'Security Events', icon: <Activity size={17} /> },
  { id: 'alerts', label: 'Alerts', icon: <ShieldAlert size={17} />, badge: 4 },
  { id: 'incidents', label: 'Incidents', icon: <FolderOpen size={17} />, badge: 2 },
  { id: 'detection', label: 'Threat Detection', icon: <Radar size={17} /> },
  { id: 'hosts', label: 'Hosts', icon: <Server size={17} /> },
  { id: 'auth', label: 'Authentication', icon: <KeyRound size={17} /> },
  { id: 'network', label: 'Network', icon: <Network size={17} /> },
  { id: 'mitre', label: 'MITRE ATT&CK', icon: <Crosshair size={17} /> },
  { id: 'ai', label: 'AI Analyst', icon: <BrainCircuit size={17} /> },
  { id: 'response', label: 'Response Actions', icon: <Zap size={17} /> },
  { id: 'reports', label: 'Reports', icon: <FileBarChart size={17} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
]

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { currentPage, navigateTo } = useSoc()

  const handleNav = (id: string) => {
    navigateTo(id)
    onCloseMobile()
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[248px] bg-surface-1 border-r border-surface-border flex flex-col shrink-0 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-sm bg-accent/15 border border-accent/30 flex items-center justify-center">
              <ShieldCheck size={16} className="text-accent" />
            </div>
            <div className="leading-none">
              <div className="font-bold text-[13.5px] text-text-primary tracking-tight">AdaptiveSOC</div>
              <div className="text-[10px] text-text-muted tracking-wide">SECURITY OPERATIONS</div>
            </div>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 scrollbar-none">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = currentPage === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[13px] font-medium transition-colors group relative ${
                      active
                        ? 'bg-accent/12 text-accent'
                        : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                    }`}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] bg-accent rounded-full" />}
                    <span className={active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold font-data bg-sev-critical/20 text-sev-critical rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* System status */}
        <div className="border-t border-surface-border p-3.5 shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
            System Status
          </div>
          <ul className="space-y-1.5">
            <StatusLine label="SIEM Engine" />
            <StatusLine label="Detection Engine" />
            <StatusLine label="AI Analyst" />
          </ul>
        </div>
      </aside>
    </>
  )
}

function StatusLine({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-[11.5px] text-text-secondary">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-status-success" />
      </span>
      <span>{label}</span>
      <span className="ml-auto text-status-success text-[10px] font-medium">Online</span>
    </li>
  )
}
