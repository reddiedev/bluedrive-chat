import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import ModelsChecker from '~/components/chat/models-checker'
import { randomUUID } from '~/lib/utils'

export const Route = createFileRoute('/_authed/')({
  component: Home,
})

function Home() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  function handleStart() {
    const session_id = randomUUID()
    navigate({ to: '/chat/$session_id', params: { session_id } })
  }

  return (
    <div className="bg-neutral-950 w-full font-display text-white min-h-screen h-auto flex flex-col">
      <ModelsChecker />
      <section className='flex flex-col items-center justify-center h-screen'>
        <Card className='min-w-[30rem]'>
          <CardHeader>
            <CardTitle className='text-2xl font-semibold flex items-center'>
              <span >Welcome to</span>
              <Link to="/" className='flex items-center hover:text-neutral-300 transition-colors ease-in-out duration-300'>
                <img src="/logo.png" alt="Bard" className='ml-2 mr-1 size-6' height={512} width={512} /> Bard
              </Link>
            </CardTitle>
            <CardDescription className='text-neutral-500 font-normal text-sm'>
              Signed in as {user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <Button id='new-thread-button' onClick={handleStart} className='cursor-pointer w-full'>
              Start a new thread
            </Button>
            <Link
              to="/logout"
              className='text-neutral-500 text-sm text-center hover:text-white hover:underline'
            >
              Sign out
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
