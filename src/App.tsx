import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { Home } from './components/Home'
import { TeacherView } from './components/TeacherView'
import { StudentSetup } from './components/StudentSetup'
import { Gallery } from './components/Gallery'
import { AuthView } from './components/AuthView'
import { AuthProvider } from './components/AuthProvider'
import { AdminDashboard } from './components/AdminDashboard'

function App() {
  const view = useStore((state) => state.view)
  const setView = useStore((state) => state.setView)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('code') && view === 'home') {
      setView('student-setup')
    }
  }, [setView, view])

  return (
    <AuthProvider>
      <div className={`w-full font-sans bg-slate-900 text-slate-100 ${
        view === 'gallery' 
          ? 'fixed inset-0 h-[100dvh] overflow-hidden overscroll-none' 
          : 'min-h-[100dvh] overflow-x-hidden flex flex-col relative'
      }`}>
        {view === 'home' && <Home />}
        {view === 'auth' && <AuthView />}
        {view === 'teacher' && <TeacherView />}
        {view === 'student-setup' && <StudentSetup />}
        {view === 'gallery' && <Gallery />}
        {view === 'admin' && <AdminDashboard />}
      </div>
    </AuthProvider>
  )
}

export default App
