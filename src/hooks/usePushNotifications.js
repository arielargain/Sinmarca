import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// VAPID public se obtiene en runtime desde la EF push-notify (action: vapid-key).
// Antes estaba hardcodeada y se descoordinaba cuando el backend rotaba claves.
const PUSH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notify`

let _vapidCache = null
async function fetchVapidPublic() {
  if (_vapidCache) return _vapidCache
  try {
    const res = await fetch(PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vapid-key' }),
    })
    const data = await res.json()
    if (data?.vapid_public) {
      _vapidCache = String(data.vapid_public)
      return _vapidCache
    }
    return null
  } catch {
    return null
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const [supported, setSupported]   = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  const subscribe = useCallback(async () => {
    if (!supported || loading) return false
    setLoading(true)
    try {
      // 1. Obtener VAPID public actual del backend (no hardcodeada)
      const VAPID_PUBLIC = await fetchVapidPublic()
      if (!VAPID_PUBLIC) {
        alert('No se pudo obtener la clave de notificaciones del servidor.')
        setLoading(false)
        return false
      }

      // 2. Registrar / obtener Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      // 3. Pedir permiso
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') { setLoading(false); return false }

      // 4. Desuscribir cualquier suscripción previa (puede tener key vieja)
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) {
        await existingSub.unsubscribe()
      }

      // 5. Crear nueva suscripción con la key actual
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
      const subJson = sub.toJSON()

      // 6. Guardar en Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setLoading(false)
        return false
      }

      const res = await fetch(PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action:   'subscribe',
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth:   subJson.keys?.auth,
          },
        }),
      })

      const resData = await res.json()

      if (res.ok && resData.ok) {
        setSubscribed(true)
        setLoading(false)
        // Test inmediato: mostrar notificación local para confirmar que funciona
        reg.showNotification('✅ Notificaciones activadas', {
          body: 'Vas a recibir alertas cuando lleguen mensajes nuevos.',
          icon: '/icon-192.svg',
          tag: 'push-test',
        })
        return true
      }
    } catch (err) {
      alert('Error activando notificaciones: ' + String(err?.message || err))
    }
    setLoading(false)
    return false
  }, [supported, loading])

  const unsubscribe = useCallback(async () => {
    if (!supported || loading) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const endpoint = sub.endpoint
        await sub.unsubscribe()
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'unsubscribe', endpoint }),
        })
      }
      setSubscribed(false)
    } catch {}
    setLoading(false)
  }, [supported, loading])

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}
