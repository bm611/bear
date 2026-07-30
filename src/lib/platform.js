function platformName() {
    if (typeof navigator === 'undefined')
        return '';
    const nav = navigator;
    return nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
}
const isApple = /mac|iphone|ipad|ipod/i.test(platformName());
export const MOD = isApple ? '⌘' : 'Ctrl';
export const ALT = isApple ? '⌥' : 'Alt';
export const SHIFT = isApple ? '⇧' : 'Shift';
export const BACKSPACE = isApple ? '⌫' : 'Backspace';
/** `mod('N')` → `⌘N` on Apple platforms, `Ctrl+N` elsewhere. */
export function mod(...keys) {
    return isApple ? [MOD, ...keys].join('') : [MOD, ...keys].join('+');
}
export function combo(...keys) {
    return isApple ? keys.join('') : keys.join('+');
}
/** True when the platform-appropriate modifier for shortcuts is held. */
export function hasMod(event) {
    return isApple ? event.metaKey : event.ctrlKey;
}
