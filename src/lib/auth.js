import { supabase } from './supabase'

// Slugify un nombre arbitrario a un slug URL-safe.
// - Lowercase + sin tildes
// - Solo letras, números y guiones
// - Sin guiones al principio o al final
function makeSlug(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function signUp({ email, password, casinoName }) {
  // 1. Crear usuario en auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) throw authError

  const userId = authData.user?.id
  if (!userId) throw new Error('No se pudo crear el usuario')

  const slug = makeSlug(casinoName)
  if (!slug) throw new Error('Nombre inválido')

  // 2. Crear tenant via RPC server-side (S15).
  //
  // Antes (pre-S15): INSERT directo a public.tenants desde el cliente.
  // Riesgo: un atacante con DevTools podía agregar tier='enterprise' o
  // status='paid' al body y la RLS los aceptaba (solo validaba auth_user_id).
  //
  // Mitigación parcial S11: BEFORE INSERT trigger _enforce_tenant_insert_defaults
  // que reescribe tier/status a 'retail'/'trial' si el insert no viene de
  // service_role/admin.
  //
  // Solución correcta S15: RPC signup_create_tenant que valida y crea
  // del lado server, con tier/status hardcoded. El trigger queda como
  // defensa en profundidad.
  const { data: rpcData, error: rpcError } = await supabase.rpc('signup_create_tenant', {
    p_name: casinoName,
    p_slug: slug,
  })

  if (rpcError) {
    // Mensaje técnico del backend, mapeo a user-friendly si es de los conocidos.
    const code = String(rpcError.message || '')
    if (code.includes('slug_taken'))      throw new Error('Ese nombre ya está en uso. Probá con otro.')
    if (code.includes('already_exists'))  throw new Error('Ya existe una cuenta para este usuario.')
    if (code.includes('invalid_input'))   throw new Error('Datos inválidos. Revisá los campos.')
    if (code.includes('unauthorized'))    throw new Error('Sesión inválida. Volvé a intentar.')
    throw new Error('No se pudo crear la cuenta. Intentá de nuevo.')
  }

  if (!rpcData?.ok) {
    throw new Error('No se pudo crear la cuenta. Intentá de nuevo.')
  }

  return authData
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw error
  return data
}
