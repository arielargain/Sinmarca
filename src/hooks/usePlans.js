import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ═══════════════════════════════════════════════════════════════
// usePlans — lee los add-ons vendidos (packs de créditos + línea WA)
//
// Filtra por tier_target según el tier del tenant actual:
//   - tier=partner    → ve addons con tier_target IN ('all','partner')
//   - tier=retail     → ve addons con tier_target IN ('all','retail')
//   - tier=enterprise → ve addons con tier_target IN ('all','enterprise')
//
// Si el tenant todavía no cargó (tier null), devuelve addons=[] y
// loading=true para que las páginas muestren su skeleton.
//
// 01/06/2026 — Antes este hook no filtraba por tier y leía todos los
// packs activos. Ahora hay packs partner-only y retail-only, así que el
// filtro es obligatorio para no cruzar precios entre tiers.
//
// Nota histórica: hasta el 20/04/2026 este hook leía una tabla
// public.plans con planes mensuales (Starter/Pro/Agencia/Empresa).
// Ese modelo se deprecó en favor de créditos puros + packs, y la
// tabla se dropeó. El hook mantiene la misma interfaz ({ plans,
// addons, loading }) para no romper los componentes que ya la
// consumen — simplemente devuelve plans: [] (nadie lo itera hoy).
// ═══════════════════════════════════════════════════════════════

export function usePlans() {
  // 02/06/2026 — leer tier del actor activo (puede ser tenant=partner
  // o retail). Antes solo leia tenant.tier y eso rompia la pagina
  // /mi-cuenta/billing para retail (tenant=null en retail).
  const { tenant, retail } = useAuth()
  const tier = tenant?.tier || retail?.tier || (retail ? 'retail' : null)

  const [plans]              = useState([])    // legacy, siempre []
  const [addons, setAddons]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sin tier conocido todavía → no cargamos addons. El consumer
    // sigue viendo loading=true hasta que tenant esté listo.
    if (!tier) {
      setAddons([])
      setLoading(true)
      return
    }

    setLoading(true)
    supabase
      .from('plan_addons')
      .select('id, name, description, price_usd, quantity, addon_type')
      .eq('active', true)
      .in('tier_target', ['all', tier])
      .order('price_usd')
      .then(({ data }) => {
        if (data) setAddons(data)
        setLoading(false)
      })
  }, [tier])

  return { plans, addons, loading }
}
