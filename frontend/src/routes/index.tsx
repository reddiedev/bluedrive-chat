import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/')({
  component: Home,
})

const usernameFormSchema = z.object({
  username: z.string().min(1).max(20),
})

function UsernameForm() {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof usernameFormSchema>>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof usernameFormSchema>) {
    // generate uuid v4 
    const { username } = values
    const session_id = crypto.randomUUID()
    navigate({ to: '/chat/$session_id', params: { session_id }, search: { username } })
  }

  return (
    <Card className='min-w-[30rem]'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold flex items-center'>
          <span >Welcome to</span> <Link to="/" className='flex items-center hover:text-neutral-300 transition-colors ease-in-out duration-300'>
            <img src="/logo.png" alt="Bard" className='ml-2 mr-1 size-6' height={512} width={512} /> Bard
          </Link>
        </CardTitle>
        <CardDescription className='text-neutral-500 font-normal text-sm'>
          Please enter your username to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="User" {...field} autoComplete="off" />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='cursor-pointer'>Continue</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function Home() {
  return (
    <div className="bg-neutral-950 w-full font-display text-white min-h-screen h-auto flex flex-col">
      <section className='flex flex-col items-center justify-center h-screen'>
        <UsernameForm />
      </section>
    </div>
  )
}
