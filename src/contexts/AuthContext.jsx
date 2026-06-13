import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

let _tenantCache = null
let _retailCache = null
let _creditsCache = null
let _creditsDataCache = null
let _subTenantCache = null

/**
 * AuthContext v2 — Tres estados mutuamente excluyentes:
 *
 *   a) Sub-tenant real: fila en sub_tenants con auth_user_id = user.id
 *      y is_retail_self = false. Panel /cliente/* (de un partner).
 *      → isSubTenant=true, isRetail=false, isPartner=false
 *
 *   b) Tenant retail: fila en tenants con auth_user_id = user.id y tier='retail'.
 *      Auto-servicio en chat.innovate-ia.com. Panel /mi-cuenta/*
 *      → isRetail=true, isSubTenant=false, isPartner=false
 *
 *   c) Tenant partner/enterprise: fila en tenants con tier='partner' o 'enterprise'.
 *      Operador mayorista en app.innovate-ia.com. Panel raíz /
 *      → isPartner=true, isRetail=false, isSubTenant=false
 *
 * La RPC get_my_full_identity() es la fuente de verdad — devuelve uno de:
 *   { kind: 'sub_tenant', sub_tenant: {...} }
 *   { kind: 'retail',     retail: {...} }
 *   { kind: 'tenant',     tenant: {...}, config: {...}, credits: {...} }
 *   { kind: 'none' }
 *
 * MFA: obligatorio para los 3 tipos. Estado mfaState:
 *   'loading' | 'none' | 'setup' | 'challenge' | 'ok'
 */
export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(undefined)
  const [tenant,        setTenant]        = useState(_tenantCache)        // partner/enterprise
  const [retail,        setRetail]        = useState(_retailCache)        // tenant retail
  const [subTenant,     setSubTenant]     = useState(_subTenantCache)     // sub-tenant real
  const [credits,       setCredits]       = useState(_creditsCache)
  const [creditsData,   setCreditsData]   = useState(_creditsDataCache)
  const [config,        setConfig]        = useState(null)
  const [tenantLoading, setTenantLoading] = useState(!_tenantCache && !_subTenantCache && !_retailCache)
  const [mfaState,      setMfaState]      = useState('loading')
  const inflightRef = useRef(false)

  // Refresh helpers que llaman las RPCs específicas
  const fetchSubTenantContext = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_sub_tenant_context')
      if (error || !data) return null
      return data
    } catch { return null }
  }

  const fetchRetailContext = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_retail_context')
      if (error || !data) return null
      return data
    } catch { return null }
  }

  const computeMfaState = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (error) { setMfaState('none'); return 'none' }
      const next = data?.nextLevel
      const curr = data?.currentLevel
      let newState
      if (next === 'aal2' && curr === 'aal2') newState = 'ok'
      else if (next === 'aal2' && curr === 'aal1') newState = 'challenge'
      else newState = 'setup'
      setMfaState(newState)
      return newState
    } catch {
      setMfaState('none')
      return 'none'
    }
  }

  const refreshMfa = () => computeMfaState()

  // Helper: limpiar todos los estados de identidad (al cambiar de tipo o logout)
  const clearAllIdentities = () => {
    setTenant(null);    _tenantCache = null
    setRetail(null);    _retailCache = null
    setSubTenant(null); _subTenantCache = null
    setCredits(null);   _creditsCache = null
    setCreditsData(null); _creditsDataCache = null
    setConfig(null)
  }

  const fetchIdentity = async (userId, isRetry = false) => {
    if (inflightRef.current) return
    inflightRef.current = true
    if (!isRetry) setTenantLoading(true)

    try {
      // 1 sola roundtrip: trae sub_tenant | retail | tenant + config + credits
      const { data: ident, error } = await supabase.rpc('get_my_full_identity')
      if (error || !ident) throw error

      // Caso sub-tenant real (de un partner)
      if (ident.kind === 'sub_tenant' && ident.sub_tenant) {
        setSubTenant(ident.sub_tenant); _subTenantCache = ident.sub_tenant
        setTenant(null);   _tenantCache = null
        setRetail(null);   _retailCache = null
        setCredits(null);  _creditsCache = null
        setCreditsData(null); _creditsDataCache = null
        setConfig(null)
        return
      }

      // Caso tenant retail (autoservicio en chat.innovate-ia.com)
      if (ident.kind === 'retail' && ident.retail) {
        setRetail(ident.retail);     _retailCache = ident.retail
        setTenant(null);             _tenantCache = null
        setSubTenant(null);          _subTenantCache = null
        setCredits(null);            _creditsCache = null
        setCreditsData(null);        _creditsDataCache = null
        setConfig(null)
        return
      }

      // Caso tenant partner/enterprise
      if (ident.kind === 'tenant' && ident.tenant) {
        setTenant(ident.tenant);     _tenantCache = ident.tenant
        setRetail(null);             _retailCache = null
        setSubTenant(null);          _subTenantCache = null

        if (ident.config) setConfig(ident.config)

        const cr = ident.credits
        if (cr) {
          const bal = cr.balance ?? 0
          setCredits(bal); _creditsCache = bal
          const dataObj = { balance: bal, unlimited: !!cr.unlimited, last_charged_date: cr.last_charged_date ?? null }
          setCreditsData(dataObj); _creditsDataCache = dataObj
        }
        return
      }

      // Sin identidad: probable race condition justo despues del signup, reintentar
      if (!isRetry) {
        inflightRef.current = false
        setTenantLoading(false)
        setTimeout(() => fetchIdentity(userId, true), 1500)
        return
      }
      clearAllIdentities()
    } catch {
      clearAllIdentities()
    } finally {
      inflightRef.current = false
      setTenantLoading(false)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)
        if (newUser) {
          if (_tenantCache || _subTenantCache || _retailCache) {
            setTenant(_tenantCache)
            setRetail(_retailCache)
            setSubTenant(_subTenantCache)
            setCredits(_creditsCache)
            setCreditsData(_creditsDataCache)
            setTenantLoading(false)
          }
          computeMfaState()
          fetchIdentity(newUser.id)
        } else {
          clearAllIdentities()
          setMfaState('none')
          setTenantLoading(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    clearAllIdentities()
    setMfaState('none')
  }

  const refreshTenant = () => user && fetchIdentity(user.id)

  const refreshSubTenant = async () => {
    const ctx = await fetchSubTenantContext()
    if (ctx) { setSubTenant(ctx); _subTenantCache = ctx }
  }

  const refreshRetail = async () => {
    const ctx = await fetchRetailContext()
    if (ctx) { setRetail(ctx); _retailCache = ctx }
  }

  const refreshCredits = (newBalance) => {
    setCredits(newBalance); _creditsCache = newBalance
    const existing = _creditsDataCache || { unlimited: false, last_charged_date: null }
    const dataObj = { ...existing, balance: newBalance }
    setCreditsData(dataObj); _creditsDataCache = dataObj
  }

  const loading = user === undefined || (user !== null && tenantLoading)

  // Flags mutuamente excluyentes
  const isSubTenant = !!subTenant && !tenant && !retail
  const isRetail    = !!retail    && !tenant && !subTenant
  const isPartner   = !!tenant    && !retail && !subTenant

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      // Identidades
      tenant, retail, subTenant,
      isSubTenant, isRetail, isPartner,
      config, credits, creditsData,
      // Estados
      loading, tenantLoading, mfaState,
      // Refresh
      refreshMfa, signOut,
      refreshTenant, refreshSubTenant, refreshRetail, refreshCredits,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
