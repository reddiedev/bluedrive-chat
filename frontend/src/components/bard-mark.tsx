import { cn } from '~/lib/utils'

/**
 * The Bard mark, painted with the current text colour by masking `logo.png`
 * rather than showing it as an `<img>`. That makes it dark on the light theme
 * and light on the dark theme without depending on a CSS filter, and keeps the
 * one asset the source of truth for the shape.
 *
 * Decorative: every place it appears already has the "Bard" word or a role
 * label beside it.
 */
export function BardMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        maskImage: 'url(/logo.png)',
        WebkitMaskImage: 'url(/logo.png)',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}
