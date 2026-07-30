import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CheckIcon } from './Icons';
export function Toast() {
    const toast = useStore((state) => state.toast);
    const dismiss = useStore((state) => state.dismissToast);
    useEffect(() => {
        if (!toast)
            return;
        const timer = setTimeout(dismiss, 2600);
        return () => clearTimeout(timer);
    }, [toast, dismiss]);
    if (!toast)
        return null;
    return (_jsxs("output", { className: "toast", "aria-live": "polite", children: [_jsx(CheckIcon, { size: 14 }), toast.message] }, toast.id));
}
