import { BrowserRouter, Routes, Route } from 'react-router-dom'

// ════════════════════════════════════════════════════════════════════
// Sinmarca — App shell
// TODO: copiar componentes retail desde app.inovate-ia
// ════════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div style={{
            minHeight: '100vh',
            background: '#080B12',
            color: '#E8E4D9',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                Sinmarca
              </h1>
              <p style={{ color: '#6a7180', fontSize: 14 }}>
                Proyecto inicializado. Falta copiar los componentes retail.
              </p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
