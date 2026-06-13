import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// ════════════════════════════════════════════════════════════════════
// Sinmarca — App.jsx (routing retail marca blanca)
// ════════════════════════════════════════════════════════════════════

const LoginRetail     = lazy(() => import('./pages/LoginRetail'))
const RegisterCliente = lazy(() => import('./pages/RegisterCliente'))
const RetailPanel     = lazy(() => import('./pages/retail/RetailPanel'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))
const AuthCallback    = lazy(() => import('./pages/AuthCallback'))

function Splash() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#080B12',
    }}>
      <div style={{ textAlign: 'center', color: '#D4A843', fontFamily: 'monospace', fontSize: 12, letterSpacing: 3 }}>
        CARGANDO
      </div>
    </div>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to="/" replace />
  return children
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return <Suspense fallback={<Splash />}><RetailPanel /></Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth/callback" element={<Suspense fallback={<Splash />}><AuthCallback /></Suspense>} />
          <Route path="/reset-password" element={<Suspense fallback={<Splash />}><ResetPassword /></Suspense>} />
          <Route path="/forgot-password" element={<PublicRoute><Suspense fallback={<Splash />}><ForgotPassword /></Suspense></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Suspense fallback={<Splash />}><LoginRetail /></Suspense></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Suspense fallback={<Splash />}><RegisterCliente /></Suspense></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
