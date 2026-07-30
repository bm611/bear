import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Scrim } from './Dialog';
import { CloseIcon } from './Icons';
import { ALT, BACKSPACE, MOD, SHIFT, combo, mod } from '../lib/platform';
const GROUPS = [
    {
        title: 'Library',
        rows: [
            ['New note', mod('N')],
            ['Search', mod('F')],
            ['Previous note', combo(MOD, ALT, '↑')],
            ['Next note', combo(MOD, ALT, '↓')],
            ['Toggle note list', mod('2')],
            ['Pin / unpin', combo(MOD, SHIFT, 'P')],
            ['Move to trash', combo(MOD, BACKSPACE)],
            ['This list', mod('/')],
        ],
    },
    {
        title: 'Formatting',
        rows: [
            ['Bold', mod('B')],
            ['Italic', mod('I')],
            ['Strikethrough', combo(MOD, SHIFT, 'X')],
            ['Highlight', combo(MOD, SHIFT, 'H')],
            ['Inline code', mod('E')],
            ['Code block', combo(MOD, SHIFT, 'E')],
            ['Link', mod('K')],
            ['Todo', combo(MOD, SHIFT, 'U')],
            ['Bulleted list', combo(MOD, SHIFT, '8')],
            ['Numbered list', combo(MOD, SHIFT, '7')],
            ['Quote', combo(MOD, SHIFT, '.')],
            ['Divider', combo(MOD, SHIFT, '-')],
            ['Table', combo(MOD, ALT, 'T')],
            ['Heading 1 – 6', combo(MOD, ALT, '1…6')],
            ['Indent / outdent', `Tab / ${combo(SHIFT, 'Tab')}`],
        ],
    },
];
export function ShortcutsSheet({ onClose }) {
    return (_jsx(Scrim, { onClose: onClose, label: "Keyboard shortcuts", children: _jsxs("div", { className: "sheet", children: [_jsxs("div", { className: "sheet-header", children: [_jsx("h2", { children: "Keyboard shortcuts" }), _jsx("button", { type: "button", className: "icon-button", "aria-label": "Close", onClick: onClose, children: _jsx(CloseIcon, {}) })] }), _jsx("div", { className: "shortcut-grid", children: GROUPS.map((group) => (_jsxs("div", { className: "shortcut-group", children: [_jsx("h3", { children: group.title }), group.rows.map(([label, keys]) => (_jsxs("div", { className: "shortcut-row", children: [_jsx("span", { children: label }), _jsx("kbd", { children: keys })] }, label)))] }, group.title))) })] }) }));
}
