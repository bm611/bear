import { useEffect, useState, type RefObject } from 'react'

/**
 * The observed content width of an element, or `Infinity` until it has been
 * measured. Callers pick layouts from it, so the optimistic start means a wide
 * pane renders its full layout on the first paint rather than flashing a
 * collapsed one.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(Number.POSITIVE_INFINITY)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return

    setWidth(element.clientWidth)
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
