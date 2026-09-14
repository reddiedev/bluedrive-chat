import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
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
  return redirect && redirect.startsWith('/') ? redirect : '/'
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
    <div className='bg-neutral-950 w-full font-display text-white min-h-screen h-auto flex flex-col'>
      <section className='flex flex-col items-center justify-center h-screen'>
        <Card className='min-w-[30rem]'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold flex items-center'>
              <span>Welcome back to</span>
              <Link to='/' className='flex items-center hover:text-neutral-300 transition-colors ease-in-out duration-300'>
                <img src='/logo.png' alt='Bard' className='ml-2 mr-1 size-6' height={512} width={512} /> Bard
              </Link>
            </CardTitle>
            <CardDescription className='text-neutral-500 font-normal text-sm'>
              Sign in with your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col space-y-6'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type='email' placeholder='you@example.com' autoComplete='email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type='password' placeholder='••••••••' autoComplete='current-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <p className='text-red-500 text-sm'>{form.formState.errors.root.message}</p>
                )}
                <Button type='submit' className='cursor-pointer' disabled={pending}>
                  {pending ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>
            <p className='text-neutral-500 text-sm pt-6'>
              Don&apos;t have an account?{' '}
              <Link to='/signup' className='text-white hover:underline'>
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
