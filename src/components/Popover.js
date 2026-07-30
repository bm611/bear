import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
/**
 * A panel that closes on outside click or Escape. Unlike `Menu` it makes no
 * assumptions about its contents — no menu roles, no arrow-key walk — so it can
 * host something as involved as the library, nested menus and all.
 */
export function Popover({ onClose, label, className, triggerRef, children }) {
    const ref = useRef(null);
    const previouslyFocused = useRef(null);
    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        const onPointerDown = (event) => {
            const target = event.target;
            if (ref.current?.contains(target) || triggerRef?.current?.contains(target))
                return;
            onClose();
        };
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            // A menu opened inside us gets the first refusal, so Escape peels one
            // layer at a time instead of dismissing the lot.
            if (ref.current?.querySelector('.menu'))
                return;
            event.stopPropagation();
            event.preventDefault();
            onClose();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown, true);
            previouslyFocused.current?.focus?.();
        };
    }, [onClose, triggerRef]);
    // Land on whatever is currently selected, falling back to the first control.
    // Focusing scrolls that row into view, so keyboard entry and the scroll
    // position agree rather than fighting each other.
    useEffect(() => {
        const root = ref.current;
        const target = root?.querySelector('[aria-current="true"]') ??
            root?.querySelector('button:not([disabled])');
        target?.focus();
    }, []);
    return (_jsx("div", { className: className, role: "dialog", "aria-label": label, ref: ref, children: children }));
}
