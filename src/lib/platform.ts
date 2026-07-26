type NavigatorWithUAData = Navigator & { userAgentData?: { platform?: string } }

function platformName(): string {
  if (typeof navigator === 'undefined') return ''
  const nav = navigator as NavigatorWithUAData
  return nav.userAgentData?.platform || nav.platform || nav.userAgent || ''
}

const isApple = /mac|iphone|ipad|ipod/i.test(platformName())

export const MOD = isApple ? '⌘' : 'Ctrl'
export const ALT = isApple ? '⌥' : 'Alt'
export const SHIFT = isApple ? '⇧' : 'Shift'
export const BACKSPACE = isApple ? '⌫' : 'Backspace'

/** `mod('N')` → `⌘N` on Apple platforms, `Ctrl+N` elsewhere. */
export function mod(...keys: string[]): string {
  return isApple ? [MOD, ...keys].join('') : [MOD, ...keys].join('+')
}

export function combo(...keys: string[]): string {
  return isApple ? keys.join('') : keys.join('+')
}

/** True when the platform-appropriate modifier for shortcuts is held. */
export function hasMod(event: KeyboardEvent | React.KeyboardEvent): boolean {
  return isApple ? event.metaKey : event.ctrlKey
}
