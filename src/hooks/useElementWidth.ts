import { useEffect, useState, type RefObject } from 'react'

/**
 * The observed content width of an element, or `Infinity` until it has been
 * measured. Callers pick layouts from it, so the optimistic start means a wide
 * pane renders its full layout on the first paint rather than flashing a
 * collapsed one.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(Number.POSITIVE_INFINITY)
  const [element, setElement] = useState<HTMLElement | null>(null)

  // The measured element comes and goes (the toolbar unmounts for the empty
  // and read-only states and comes back as a fresh node), so follow whatever
  // the ref currently points at rather than observing the mount-time node
  // forever. Runs every commit; the set is a no-op while the node is stable.
  useEffect(() => {
    setElement(ref.current)
  })

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return

    setWidth(element.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return width
}
