import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BardMark } from '~/components/bard-mark'
import { RecitationTrace } from '~/components/chat/recitation-trace'
import { ThemeSwitch } from '~/components/theme-switch'
import { Button } from '~/components/ui/button'
import { usePrefersReducedMotion } from '~/hooks/use-prefers-reduced-motion'

export const Route = createFileRoute('/')({
  component: Landing,
})

const THESIS = 'Every word you say here,\nstays in this room.'

/** Types the thesis once, driving the recitation trace as it goes. */
function useRecitation(text: string, speed = 42, delay = 450) {
  const reduced = usePrefersReducedMotion()
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (reduced) {
      setCount(text.length)
      return
    }
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [reduced, delay, text.length])

  useEffect(() => {
    if (!started || count >= text.length) return
    const timer = setTimeout(() => setCount((c) => c + 1), speed)
    return () => clearTimeout(timer)
  }, [started, count, text.length, speed])

  return {
    typed: text.slice(0, count),
    typing: started && count < text.length,
    pulse: count,
  }
}

function Landing() {
  const { typed, typing, pulse } = useRecitation(THESIS)

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <header className="border-border flex h-16 items-center justify-between border-b px-6 sm:px-10">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <BardMark className="size-5 text-foreground" />
          Bard
        </Link>
        <ThemeSwitch />
      </header>

      <main className="flex flex-1 flex-col justify-center px-6 py-16 sm:px-10">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
            Offline · on your machine
          </p>

          <h1 className="font-display mt-6 text-4xl leading-[1.05] font-light tracking-tight whitespace-pre-line sm:text-6xl lg:text-7xl">
            {typed}
            {typing && (
              <span
                aria-hidden
                className="bg-signal ml-1 inline-block h-[0.8em] w-[3px] translate-y-[0.02em] animate-pulse align-baseline"
              />
            )}
          </h1>

          <RecitationTrace
            active={typing}
            pulse={pulse}
            className="mt-10 h-8 w-full max-w-xl text-signal"
          />

          <p className="font-display text-muted-foreground mt-10 max-w-lg text-lg leading-relaxed">
            Bard answers with a model running on your own hardware — or any endpoint you point it
            at — and keeps each thread in your own database. Nothing else hears it.
          </p>

          <div className="mt-14 flex items-center gap-4">
            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase">
              the door
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg">
              <Link to="/home">Step inside</Link>
            </Button>
            <span className="text-muted-foreground font-mono text-xs">
              No account? Signing up takes a minute.
            </span>
          </div>
        </div>
      </main>

      <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-6 py-6 sm:px-10">
        <p className="text-muted-foreground font-mono text-xs">
          Ollama · any OpenAI-compatible API · Postgres
        </p>
        <p className="text-muted-foreground font-mono text-xs">An AI engineering showcase</p>
      </footer>
    </div>
  )
}
