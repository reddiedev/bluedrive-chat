import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { BardMark } from '~/components/bard-mark'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { getSupabaseBrowserClient } from '~/lib/supabase/browser'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password cannot be empty'),
})

function safeRedirect(redirect: string | undefined) {
  return redirect && redirect.startsWith('/') ? redirect : '/home'
}

function LoginPage() {
  const { redirect } = Route.useSearch()
  const [pending, setPending] = useState(false)
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setPending(true)
    const { error } = await getSupabaseBrowserClient().auth.signInWithPassword(values)

    if (error) {
      setPending(false)
      form.setError('root', { message: error.message })
      return
    }

    window.location.href = safeRedirect(redirect)
  }

  return (
    <div className="bg-background text-foreground relative grid min-h-svh md:grid-cols-2">
      {/* The threshold: daylight on one side, the room on the other. */}
      <span aria-hidden className="bg-signal/40 absolute inset-y-0 left-1/2 hidden w-px md:block" />

      <aside className="hidden flex-col justify-between p-10 md:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BardMark className="size-5 text-foreground" />
          Bard
        </Link>
        <div>
          <h1 className="font-display text-5xl leading-[1.1] font-light tracking-tight">
            You&rsquo;re at the door.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-sm">
            Sign in and step inside. Your threads stay on your own machine — Bard keeps them, no one
            else.
          </p>
        </div>
        <p className="text-muted-foreground font-mono text-xs">
          Offline · local model · your database
        </p>
      </aside>

      <section className="bg-card border-border flex flex-col justify-center border-t px-6 py-16 md:border-t-0 md:border-l md:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2 text-lg font-semibold md:hidden">
            <BardMark className="size-5 text-foreground" />
            Bard
          </Link>

          <h2 className="font-display text-2xl font-light">Sign in</h2>
          <p className="text-muted-foreground mt-1 text-sm">Use the email you signed up with.</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 flex flex-col space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full cursor-pointer" disabled={pending}>
                {pending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <p className="text-muted-foreground mt-6 text-sm">
            Don&rsquo;t have an account?{' '}
            <Link to="/signup" className="text-signal hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
