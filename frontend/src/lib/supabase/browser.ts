import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

// Lazily created so the module stays safe to import during SSR (route components
// are isomorphic); the client is only ever instantiated from browser code.
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_KEY,
    )
  }
  return client
}
