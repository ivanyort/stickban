import { cn } from '@renderer/lib/utils'
import stickbanMarkSquareUrl from '../../../../../logos/ico_kit/Web/android-chrome-192x192.png'

export function StickbanMark({ className }: { className?: string }): JSX.Element {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn('h-full w-full object-contain', className)}
      src={stickbanMarkSquareUrl}
    />
  )
}
