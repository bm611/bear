import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { exportLibrary, parseLibraryFile } from '../lib/storage';
import { downloadFile } from '../lib/download';
import { supabase } from '../lib/supabaseClient';
import { mod } from '../lib/platform';
import { Menu, MenuItem, MenuLabel, MenuSeparator } from './Menu';
import { DownloadIcon, KeyboardIcon, MoonIcon, SunIcon, UploadIcon } from './Icons';
const THEMES = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Match system' },
];
/**
 * Theme, editor type, backup and sign-out. Tall enough that it has to open where
 * there is room, so its placement is left to whoever anchors it.
 */
export function SettingsMenu({ onClose, align = 'left', style, onShowShortcuts, triggerRef, }) {
    const notes = useStore((state) => state.notes);
    const preferences = useStore((state) => state.preferences);
    const setPreferences = useStore((state) => state.setPreferences);
    const importNotes = useStore((state) => state.importNotes);
    const showToast = useStore((state) => state.showToast);
    const fileRef = useRef(null);
    const handleImport = async (file) => {
        try {
            const text = await file.text();
            const added = importNotes(parseLibraryFile(text));
            showToast(`Imported ${added} note${added === 1 ? '' : 's'}`);
        }
        catch {
            showToast('That file could not be imported');
        }
    };
    return (_jsxs(Menu, { align: align, label: "Settings", onClose: onClose, style: style, triggerRef: triggerRef, children: [_jsx(MenuLabel, { children: "Theme" }), THEMES.map(({ value, label }) => (_jsx(MenuItem, { checked: preferences.theme === value, icon: value === 'dark' ? _jsx(MoonIcon, { size: 15 }) : _jsx(SunIcon, { size: 15 }), onSelect: () => setPreferences({ theme: value }), children: label }, value))), _jsx(MenuSeparator, {}), _jsx(MenuLabel, { children: "Editor font" }), _jsx(MenuItem, { checked: preferences.font === 'sans', onSelect: () => setPreferences({ font: 'sans' }), children: "Google Sans" }), _jsx(MenuItem, { checked: preferences.font === 'inter', onSelect: () => setPreferences({ font: 'inter' }), children: "Inter" }), _jsx(MenuItem, { checked: preferences.font === 'system', onSelect: () => setPreferences({ font: 'system' }), children: "System" }), _jsx(MenuItem, { checked: preferences.font === 'mono', onSelect: () => setPreferences({ font: 'mono' }), children: "Mono" }), _jsxs("div", { className: "stepper", children: [_jsx("button", { type: "button", "aria-label": "Smaller text", onClick: () => setPreferences({ fontSize: Math.max(13, preferences.fontSize - 1) }), children: "\u2212" }), _jsx("button", { type: "button", "aria-label": "Larger text", onClick: () => setPreferences({ fontSize: Math.min(24, preferences.fontSize + 1) }), children: "+" }), _jsxs("span", { children: [preferences.fontSize, "px"] })] }), _jsx(MenuSeparator, {}), _jsx(MenuLabel, { children: "Library" }), _jsx(MenuItem, { icon: _jsx(DownloadIcon, { size: 15 }), onSelect: () => {
                    onClose();
                    downloadFile('slate-notes.json', exportLibrary(notes), 'application/json');
                    showToast('Backup downloaded');
                }, children: "Export backup\u2026" }), _jsx(MenuItem, { icon: _jsx(UploadIcon, { size: 15 }), onSelect: () => fileRef.current?.click(), children: "Import backup\u2026" }), onShowShortcuts ? (_jsxs(_Fragment, { children: [_jsx(MenuSeparator, {}), _jsx(MenuItem, { icon: _jsx(KeyboardIcon, { size: 15 }), shortcut: mod('/'), onSelect: () => {
                            onClose();
                            onShowShortcuts();
                        }, children: "Keyboard shortcuts" })] })) : null, _jsx(MenuSeparator, {}), _jsx(MenuItem, { onSelect: () => {
                    onClose();
                    void supabase.auth.signOut();
                }, children: "Sign out" }), _jsx("input", { ref: fileRef, type: "file", accept: "application/json,.json", hidden: true, onChange: (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file)
                        return;
                    void handleImport(file);
                    onClose();
                } })] }));
}
