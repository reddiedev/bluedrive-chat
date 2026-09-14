import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '~/lib/supabase/browser'

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
})

function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    getSupabaseBrowserClient()
      .auth.signOut()
      .finally(() => {
        if (active) {
          navigate({ to: '/login', replace: true })
        }
      })

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <div className='bg-neutral-950 w-full font-display text-white min-h-screen h-auto flex items-center justify-center'>
      <p className='text-neutral-500 text-sm'>Signing out…</p>
    </div>
  )
}
