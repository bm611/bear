import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
function menuItems(root) {
    if (!root)
        return [];
    return [...root.querySelectorAll('.menu-item:not([disabled])')];
}
/** A lightweight popover: closes on outside click, Escape or scroll-away. */
export function Menu({ onClose, align = 'right', style, label, restoreFocus = true, triggerRef, children, }) {
    const ref = useRef(null);
    const previouslyFocused = useRef(null);
    const restoreFocusRef = useRef(restoreFocus);
    restoreFocusRef.current = restoreFocus;
    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        const onPointerDown = (event) => {
            const target = event.target;
            if (ref.current?.contains(target) || triggerRef?.current?.contains(target))
                return;
            onClose();
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                event.preventDefault();
                onClose();
                return;
            }
            const items = menuItems(ref.current);
            if (items.length === 0)
                return;
            const index = items.indexOf(document.activeElement);
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                const next = index < 0 ? 0 : (index + 1) % items.length;
                items[next].focus();
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                const next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
                items[next].focus();
                return;
            }
            if (event.key === 'Home') {
                event.preventDefault();
                items[0].focus();
                return;
            }
            if (event.key === 'End') {
                event.preventDefault();
                items[items.length - 1].focus();
            }
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown, true);
            if (restoreFocusRef.current)
                previouslyFocused.current?.focus?.();
        };
    }, [onClose, triggerRef]);
    useEffect(() => {
        menuItems(ref.current)[0]?.focus();
    }, []);
    return (_jsx("div", { className: "menu", "data-align": align, style: style, role: "menu", "aria-label": label, ref: ref, children: children }));
}
export function MenuItem({ onSelect, children, shortcut, danger, checked, icon, disabled, }) {
    return (_jsxs("button", { type: "button", className: "menu-item", role: checked === undefined ? 'menuitem' : 'menuitemcheckbox', "aria-checked": checked, "data-danger": danger === true ? 'true' : undefined, disabled: disabled, onClick: onSelect, children: [icon, _jsx("span", { children: children }), shortcut ? _jsx("span", { className: "menu-shortcut", children: shortcut }) : null] }));
}
export function MenuSeparator() {
    return _jsx("div", { className: "menu-separator", role: "separator" });
}
export function MenuLabel({ children }) {
    return _jsx("div", { className: "menu-label", children: children });
}
