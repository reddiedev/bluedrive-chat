import { createFileRoute } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormDescription, FormMessage } from '~/components/ui/form'
import { FormControl, FormField, FormItem, FormLabel } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

const usernameFormSchema = z.object({
  username: z.string().min(1),
})

function UsernameForm() {
  const form = useForm<z.infer<typeof usernameFormSchema>>({
    resolver: zodResolver(usernameFormSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof usernameFormSchema>) {
    console.log(values)
  }

  return (
    <Card className='min-w-[30rem]'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>
          Welcome to Bard!
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
