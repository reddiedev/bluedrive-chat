import { useEffect, useMemo, useRef } from 'react'
import { cn } from '~/lib/utils'

const VIEW_W = 300
const VIEW_H = 40

/** Resting line: a shallow, even breath so an idle trace still has a pulse. */
function restSamples(count: number) {
  return Array.from(
    { length: count },
    (_, i) => 0.1 + 0.05 * Math.sin(i / 3) + 0.02 * Math.sin(i / 1.7),
  )
}

function buildPaths(samples: number[], w: number, h: number) {
  const step = w / (samples.length - 1)
  const y = (v: number) => h - 2 - v * (h - 6)
  let line = `M 0 ${y(samples[0]).toFixed(2)}`
  for (let i = 1; i < samples.length; i++) {
    line += ` L ${(i * step).toFixed(2)} ${y(samples[i]).toFixed(2)}`
  }
  return { line, area: `${line} L ${w} ${h} L 0 ${h} Z` }
}

/**
 * A deterministic fingerprint for a saved conversation, so threads are
 * recognised by their shape rather than an emoji marker.
 */
export function ThreadFingerprint({
  seed,
  className,
}: {
  seed: string
  className?: string
}) {
  const paths = useMemo(() => {
    // xorshift seeded from the string — stable across renders and reloads.
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    const rand = () => {
      h ^= h << 13
      h ^= h >>> 17
      h ^= h << 5
      return ((h >>> 0) % 1000) / 1000
    }
    const count = 32
    const samples: number[] = []
    let v = 0.3
    for (let i = 0; i < count; i++) {
      v = Math.max(0.08, Math.min(1, v + (rand() - 0.5) * 0.55))
      // taper at both ends so it reads as a phrase, not noise
      const env = Math.sin((Math.PI * i) / (count - 1)) ** 0.5
      samples.push(0.08 + v * 0.72 * env)
    }
    return buildPaths(samples, 60, 16)
  }, [seed])

  return (
    <svg
      viewBox="0 0 60 16"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('h-4 w-7 shrink-0 text-signal opacity-60 transition-opacity', className)}
    >
      <path d={paths.area} fill="currentColor" fillOpacity={0.16} />
      <path
        d={paths.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The stream made visible. Rests flat, rises with the arrival of tokens while
 * a response streams, and settles when it ends. It is driven by real token
 * cadence (`pulse` increments per chunk) — never by fake audio.
 */
export function RecitationTrace({
  active,
  pulse = 0,
  className,
}: {
  active: boolean
  pulse?: number
  className?: string
}) {
  const lineRef = useRef<SVGPathElement>(null)
  const areaRef = useRef<SVGPathElement>(null)
  const initial = useRef(buildPaths(restSamples(96), VIEW_W, VIEW_H))
  const state = useRef({
    samples: restSamples(96),
    boost: 0,
    lastPulse: pulse,
    frame: 0,
    calm: 0,
  })

  useEffect(() => {
    const render = (samples: number[]) => {
      const { line, area } = buildPaths(samples, VIEW_W, VIEW_H)
      lineRef.current?.setAttribute('d', line)
      areaRef.current?.setAttribute('d', area)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      render(state.current.samples.map(() => (active ? 0.42 : 0.12)))
      return
    }

    let raf = 0
    const tick = () => {
      const s = state.current
      s.frame++
      s.calm = active ? 0 : s.calm + 1

      if (!active && s.calm > 150) {
        render(restSamples(s.samples.length))
        return
      }

      if (pulse !== s.lastPulse) {
        s.boost = 1
        s.lastPulse = pulse
      }
      s.boost *= 0.9

      if (s.frame % 2 === 0) {
        const base = active ? 0.28 : 0.1
        const amp = Math.min(1, base + s.boost * 0.6) * (0.3 + Math.random() * 0.7)
        s.samples.push(amp)
        s.samples.shift()
      }
      for (let i = 0; i < s.samples.length; i++) s.samples[i] *= 0.99

      render(s.samples)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, pulse])

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={active ? 'Response streaming' : 'Idle'}
      className={cn('h-6 w-full text-signal', className)}
    >
      <path
        ref={areaRef}
        d={initial.current.area}
        fill="currentColor"
        fillOpacity={0.14}
      />
      <path
        ref={lineRef}
        d={initial.current.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
