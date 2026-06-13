import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase maneja el token del link automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    navigate('/')
  }

  if (!ready) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080B12' }}>
      <p style={{ color:'#D4A843', fontFamily:'monospace', fontSize:12, letterSpacing:2 }}>Verificando link...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080B12', padding:'0 16px' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#E9E7E0', marginBottom:6, textAlign:'center' }}>Nueva contraseña</h1>
        <p style={{ fontSize:13, color:'#8B8E9F', textAlign:'center', marginBottom:28 }}>Ingresá tu nueva contraseña</p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['Nueva contraseña', password, setPassword], ['Confirmar contraseña', confirm, setConfirm]].map(([label, val, setter]) => (
            <div key={label}>
              <label style={{ fontSize:11, fontWeight:600, color:'#8B8E9F', letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:6 }}>{label}</label>
              <input type="password" value={val} onChange={e => setter(e.target.value)} placeholder="••••••••" required minLength={8}
                style={{ width:'100%', background:'#111420', border:'1px solid #1e2130', borderRadius:10, padding:'11px 14px', color:'#E9E7E0', fontSize:14, boxSizing:'border-box', outline:'none' }} />
            </div>
          ))}

          {error && <p style={{ fontSize:13, color:'#f87171', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'10px 14px', margin:0 }}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{ background:'#D4A843', color:'#080B12', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
