import { useEffect, useState } from 'react'

/** Subscribes to a media query, e.g. `useMediaQuery('(max-width: 720px)')`. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

/** The breakpoint below which the three panes stack into one. */
export const NARROW_QUERY = '(max-width: 720px)'
