import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { BardMark } from '~/components/bard-mark'
import { Button } from '~/components/ui/button'
import ModelsChecker from '~/components/chat/models-checker'
import { ThemeSwitch } from '~/components/theme-switch'
import { randomUUID } from '~/lib/utils'

export const Route = createFileRoute('/_authed/home')({
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
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <ModelsChecker />

      <header className="border-border flex h-16 items-center justify-between border-b px-6 sm:px-10">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BardMark className="size-5 text-foreground" />
          Bard
        </span>
        <ThemeSwitch />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
            Inside
          </p>
          <h1 className="font-display mt-4 text-4xl font-light tracking-tight text-balance">
            What are we working on?
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">Signed in as {user.email}</p>

          <div className="mt-9 flex flex-col gap-4">
            <Button size="lg" onClick={handleStart} className="w-full cursor-pointer">
              Start a new thread
            </Button>
            <p className="text-muted-foreground font-mono text-xs">
              [cmd/ctrl + /] starts a thread from anywhere
            </p>
            <Link
              to="/logout"
              className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
