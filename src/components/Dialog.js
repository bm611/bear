import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function Scrim({ onClose, children, label }) {
    const scrimRef = useRef(null);
    const previouslyFocused = useRef(null);
    useEffect(() => {
        previouslyFocused.current = document.activeElement;
        const root = scrimRef.current;
        const focusables = () => [...(root?.querySelectorAll(FOCUSABLE) ?? [])];
        // Prefer an autofocus target, otherwise the first focusable control.
        const initial = root?.querySelector('[data-autofocus="true"]') ?? focusables()[0] ?? null;
        initial?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.stopPropagation();
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab' || !root)
                return;
            const items = focusables();
            if (items.length === 0)
                return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            previouslyFocused.current?.focus?.();
        };
    }, [onClose]);
    return (_jsx("div", { ref: scrimRef, className: "scrim", role: "dialog", "aria-modal": "true", "aria-label": label, onPointerDown: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: children }));
}
export function PromptDialog({ title, description, initialValue = '', confirmLabel = 'Save', onConfirm, onCancel, }) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current?.select();
    }, []);
    return (_jsx(Scrim, { onClose: onCancel, label: title, children: _jsxs("form", { className: "sheet dialog", onSubmit: (event) => {
                event.preventDefault();
                if (value.trim())
                    onConfirm(value.trim());
            }, children: [_jsxs("div", { className: "sheet-header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", className: "icon-button", "aria-label": "Close", onClick: onCancel, children: _jsx(CloseIcon, {}) })] }), description ? _jsx("p", { className: "dialog-text", children: description }) : null, _jsx("input", { ref: inputRef, className: "dialog-input", value: value, onChange: (event) => setValue(event.target.value), spellCheck: false, autoComplete: "off", "aria-label": title, "data-autofocus": "true" }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { type: "button", className: "button", onClick: onCancel, children: "Cancel" }), _jsx("button", { type: "submit", className: "button button-primary", disabled: !value.trim(), children: confirmLabel })] })] }) }));
}
export function ConfirmDialog({ title, description, confirmLabel = 'Confirm', destructive, onConfirm, onCancel, }) {
    return (_jsx(Scrim, { onClose: onCancel, label: title, children: _jsxs("div", { className: "sheet dialog", children: [_jsxs("div", { className: "sheet-header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", className: "icon-button", "aria-label": "Close", onClick: onCancel, children: _jsx(CloseIcon, {}) })] }), _jsx("p", { className: "dialog-text", children: description }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { type: "button", className: "button", onClick: onCancel, "data-autofocus": destructive ? 'true' : undefined, children: "Cancel" }), _jsx("button", { type: "button", className: destructive ? 'button button-danger' : 'button button-primary', onClick: onConfirm, "data-autofocus": destructive ? undefined : 'true', children: confirmLabel })] })] }) }));
}
