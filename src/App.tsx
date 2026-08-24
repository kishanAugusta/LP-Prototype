import { AppProvider, useStore } from './store/AppContext'
import { AdminTab } from './components/AdminTab'
import { AppShell } from './components/AppShell'
import { HelpModal } from './components/HelpModal'
import { LoginScreen } from './components/LoginScreen'
import { MapViewTab } from './components/MapViewTab'
import { NotesDrawer } from './components/NotesDrawer'
import { PlannerTab, ReasonModal } from './components/PlannerTab'
import { SummaryTab } from './components/SummaryTab'
import { OfflineBanner, Toasts } from './components/Toasts'

function Prototype() {
  const { user, state, isAdmin } = useStore()
  if (!user) {
    return (
      <>
        <LoginScreen />
        <HelpModal />
      </>
    )
  }

  return (
    <>
      <OfflineBanner />
      <AppShell>
        {state.tab === 'planner' && <PlannerTab />}
        {state.tab === 'summary' && <SummaryTab />}
        {state.tab === 'map' && <MapViewTab />}
        {state.tab === 'admin' && isAdmin && <AdminTab />}
      </AppShell>
      <NotesDrawer />
      <ReasonModal />
      <HelpModal />
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Prototype />
    </AppProvider>
  )
}
