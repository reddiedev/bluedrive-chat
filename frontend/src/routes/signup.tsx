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

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: SignupPage,
})

const signupSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

function safeRedirect(redirect: string | undefined) {
  return redirect && redirect.startsWith('/') ? redirect : '/home'
}

function SignupPage() {
  const { redirect } = Route.useSearch()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setPending(true)
    setNotice(null)
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setPending(false)
      form.setError('root', { message: error.message })
      return
    }

    // With email confirmation enabled, no session is returned until the user
    // clicks the confirmation link. We only enable that path defensively.
    if (!data.session) {
      setPending(false)
      setNotice('Check your email to confirm your account, then sign in.')
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
            Make yourself a room.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-sm">
            One account, your own threads, your own machine. Create it with an email and a
            password.
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

          <h2 className="font-display text-2xl font-light">Create an account</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            You&rsquo;ll sign in with this email from now on.
          </p>

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
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
              )}
              {notice && <p className="text-muted-foreground text-sm">{notice}</p>}
              <Button type="submit" className="w-full cursor-pointer" disabled={pending}>
                {pending ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="text-muted-foreground mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-signal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
