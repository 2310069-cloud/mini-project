import React, { useState } from 'react'
import { SocProvider, useSoc } from './context/SocContext'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { AuthModal } from './components/AuthModal'
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
  const { authModalOpen, setAuthModalOpen } = useSoc()

  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 min-w-0">
          <PageRouter />
        </main>
      </div>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <SocProvider>
      <AppShell />
    </SocProvider>
  )
}
