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
  return redirect && redirect.startsWith('/') ? redirect : '/'
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
    <div className='bg-neutral-950 w-full font-display text-white min-h-screen h-auto flex flex-col'>
      <section className='flex flex-col items-center justify-center h-screen'>
        <Card className='min-w-[30rem]'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold flex items-center'>
              <span>Join</span>
              <Link to='/' className='flex items-center hover:text-neutral-300 transition-colors ease-in-out duration-300'>
                <img src='/logo.png' alt='Bard' className='ml-2 mr-1 size-6' height={512} width={512} /> Bard
              </Link>
            </CardTitle>
            <CardDescription className='text-neutral-500 font-normal text-sm'>
              Create an account with your email to get started
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
                        <Input type='password' placeholder='••••••••' autoComplete='new-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type='password' placeholder='••••••••' autoComplete='new-password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.root && (
                  <p className='text-red-500 text-sm'>{form.formState.errors.root.message}</p>
                )}
                {notice && <p className='text-neutral-300 text-sm'>{notice}</p>}
                <Button type='submit' className='cursor-pointer' disabled={pending}>
                  {pending ? 'Creating account…' : 'Sign up'}
                </Button>
              </form>
            </Form>
            <p className='text-neutral-500 text-sm pt-6'>
              Already have an account?{' '}
              <Link to='/login' className='text-white hover:underline'>
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
