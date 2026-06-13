import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { APP_URL } from '../lib/constants'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) { setError('Ingresá tu email'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080B12' }}>
      <div style={{ textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>📧</div>
        <h2 style={{ fontSize:22, fontWeight:600, color:'#E9E7E0', marginBottom:12 }}>Revisá tu correo</h2>
        <p style={{ fontSize:14, color:'#8B8E9F', lineHeight:1.7, marginBottom:24 }}>
          Te enviamos un link a <strong style={{ color:'#D4A843' }}>{email}</strong> para resetear tu contraseña.
        </p>
        <Link to="/login" style={{ color:'#D4A843', fontSize:13 }}>← Volver al login</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080B12', padding:'0 16px' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:48, height:48, background:'rgba(212,168,67,0.12)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <span style={{ fontSize:24 }}>🔑</span>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#E9E7E0', marginBottom:6 }}>Recuperar contraseña</h1>
          <p style={{ fontSize:13, color:'#8B8E9F' }}>Te enviamos un link para resetearla</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#8B8E9F', letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              style={{ width:'100%', background:'#111420', border:'1px solid #1e2130', borderRadius:10, padding:'11px 14px', color:'#E9E7E0', fontSize:14, boxSizing:'border-box', outline:'none' }}
            />
          </div>

          {error && <p style={{ fontSize:13, color:'#f87171', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', margin:0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ background:'#D4A843', color:'#080B12', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enviando...' : 'Enviar link de recuperación'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'#4E5168' }}>
          <Link to="/login" style={{ color:'#D4A843' }}>← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}
