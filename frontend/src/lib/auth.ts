import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '~/lib/supabase/server'

export type AuthUser = {
  id: string
  email: string | null
}

export const getUser = createServerFn({
  method: 'GET',
  response: 'data',
}).handler(async (): Promise<AuthUser | null> => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  }
})
