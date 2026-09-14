import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

const OPTIONS = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
] as const

/**
 * Three-state theme control. `next-themes` is already a dependency (it backs
 * the toaster); this just surfaces it. Rendered inert until mount so the
 * server and client markup agree.
 */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-border bg-card/70 p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] px-2 py-1 font-mono text-[11px] tracking-wider uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-signal text-signal-fg'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
