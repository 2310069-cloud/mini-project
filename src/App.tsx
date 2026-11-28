import React, { useState } from 'react'
import { SocProvider, useSoc } from './context/SocContext'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { AttackSimulatorModal } from './components/AttackSimulatorModal'
import { AttackReportModal } from './components/AttackReportModal'
import { EmergencyEmailModal } from './components/EmergencyEmailModal'
import { OverviewPage } from './pages/OverviewPage'
import { EventsPage } from './pages/EventsPage'
import { AlertsPage } from './pages/AlertsPage'
import { IncidentsPage } from './pages/IncidentsPage'
import { DetectionPage } from './pages/DetectionPage'
import { HostsPage } from './pages/HostsPage'
import { AuthPage } from './pages/AuthPage'
import { NetworkPage } from './pages/NetworkPage'
import { MitrePage } from './pages/MitrePage'
import { AIAnalystPage } from './pages/AIAnalystPage'
import { ResponsePage } from './pages/ResponsePage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'

function PageRouter() {
  const { currentPage } = useSoc()
  switch (currentPage) {
    case 'overview': return <OverviewPage />
    case 'events': return <EventsPage />
    case 'alerts': return <AlertsPage />
    case 'incidents': return <IncidentsPage />
    case 'detection': return <DetectionPage />
    case 'hosts': return <HostsPage />
    case 'auth': return <AuthPage />
    case 'network': return <NetworkPage />
    case 'mitre': return <MitrePage />
    case 'ai': return <AIAnalystPage />
    case 'response': return <ResponsePage />
    case 'reports': return <ReportsPage />
    case 'settings': return <SettingsPage />
    default: return <OverviewPage />
  }
}

function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const {
    isSimulatorOpen, setSimulatorOpen,
    activeReportModal, closeReportModal,
    activeEmailModal, setActiveEmailModal,
  } = useSoc()

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 min-w-0">
          <PageRouter />
        </main>
      </div>

      {/* Attack Simulator Lab Modal */}
      {isSimulatorOpen && (
        <AttackSimulatorModal onClose={() => setSimulatorOpen(false)} />
      )}

      {/* Comprehensive Attack Incident Report Modal */}
      {activeReportModal && (
        <AttackReportModal report={activeReportModal} onClose={closeReportModal} />
      )}

      {/* Emergency Email Dispatch Alert Modal */}
      {activeEmailModal && (
        <EmergencyEmailModal email={activeEmailModal} onClose={() => setActiveEmailModal(null)} />
      )}
    </div>
  )
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AdaptiveSOC Error caught:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center p-6 text-text-primary">
          <div className="bg-surface-1 border border-sev-critical/40 rounded-lg p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-sev-critical flex items-center gap-2">
              ⚠️ AdaptiveSOC Error Recovery
            </h2>
            <p className="text-xs text-text-secondary font-mono bg-surface-2 p-3 rounded border border-surface-borderLight">
              {this.state.error?.message || 'Unknown runtime error'}
            </p>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('adaptivesoc_active_attack')
                  localStorage.removeItem('adaptivesoc_live_events')
                } catch { }
                window.location.reload()
              }}
              className="px-4 py-2 bg-accent hover:bg-accent/85 text-white font-bold rounded text-xs transition-colors"
            >
              Reset Simulation Cache & Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocProvider>
        <AppShell />
      </SocProvider>
    </ErrorBoundary>
  )
}
