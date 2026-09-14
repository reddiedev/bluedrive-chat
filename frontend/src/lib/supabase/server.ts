import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getWebRequest,
  setCookie,
  setResponseHeader,
} from '@tanstack/react-start/server'

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY ?? process.env.VITE_SUPABASE_KEY

// Server-only client. Never share one across requests: each call reads the
// current request cookies and writes refreshed tokens back to the response.
export function createSupabaseServerClient(): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        const request = getWebRequest()
        const cookieHeader = request?.headers.get('cookie') ?? ''
        return parseCookieHeader(cookieHeader)
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options as CookieOptions)
        }
        for (const [key, value] of Object.entries(headers)) {
          setResponseHeader(key, value)
        }
      },
    },
  })
}
