// Constantes globales — configurables via env vars por instalación

export const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL
export const APP_URL         = import.meta.env.VITE_APP_URL         || ''
export const APP_NAME        = import.meta.env.VITE_APP_NAME        || 'Sinmarca'
export const SUPPORT_EMAIL   = import.meta.env.VITE_SUPPORT_EMAIL   || ''
export const WA_VERIFY_TOKEN = import.meta.env.VITE_WA_VERIFY_TOKEN || ''

// Edge Functions — relativas a SUPABASE_URL
export const WA_WEBHOOK_URL          = `${SUPABASE_URL}/functions/v1/wa-webhook`
export const META_CONVERSION_URL     = `${SUPABASE_URL}/functions/v1/meta-conversion`
export const CASINO_ACTION_URL       = `${SUPABASE_URL}/functions/v1/casino-action`
export const NOTIFY_LINE_TICKET_URL  = `${SUPABASE_URL}/functions/v1/notify-new-line-ticket`
export const SEND_WA_MANUAL_URL      = `${SUPABASE_URL}/functions/v1/send-wa-manual`
export const SEND_WA_MEDIA_URL       = `${SUPABASE_URL}/functions/v1/send-wa-media`
export const LANDING_AI_URL          = `${SUPABASE_URL}/functions/v1/landing-ai`
export const WA_LINK_SESSION_URL     = `${SUPABASE_URL}/functions/v1/wa-link-session`
