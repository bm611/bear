import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ChevronRight, MoreIcon, TagIcon, TrashIcon, PencilIcon } from './Icons';
import { Menu, MenuItem, MenuSeparator } from './Menu';
export function TagTree({ nodes, filter, onSelect, onRename, onDelete, depth = 0 }) {
    return (_jsx("div", { className: depth > 0 ? 'tag-children' : undefined, children: nodes.map((node) => (_jsx(TagRow, { node: node, filter: filter, onSelect: onSelect, onRename: onRename, onDelete: onDelete, depth: depth }, node.path))) }));
}
function TagRow({ node, filter, onSelect, onRename, onDelete, depth = 0 }) {
    const activePath = filter.kind === 'tag' ? filter.tag.toLowerCase() : '';
    const isSelected = activePath === node.path.toLowerCase();
    const containsSelection = activePath.startsWith(node.path.toLowerCase() + '/');
    const [open, setOpen] = useState(containsSelection);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuTriggerRef = useRef(null);
    const hasChildren = node.children.length > 0;
    // Reveal the branch when a nested tag is selected from elsewhere.
    useEffect(() => {
        if (containsSelection)
            setOpen(true);
    }, [containsSelection]);
    return (_jsxs("div", { className: "menu-anchor", children: [_jsxs("div", { className: "tag-row-wrapper", children: [hasChildren ? (_jsx("button", { type: "button", className: "disclosure", "data-open": open ? 'true' : 'false', "aria-label": `${open ? 'Collapse' : 'Expand'} ${node.name}`, "aria-expanded": open, onClick: () => setOpen((value) => !value), children: _jsx(ChevronRight, { size: 12 }) })) : (_jsx("span", { className: "disclosure", "aria-hidden": "true" })), _jsxs("button", { type: "button", className: "sidebar-row", "aria-current": isSelected ? 'true' : undefined, onClick: () => onSelect(node.path), onContextMenu: (event) => {
                            event.preventDefault();
                            setMenuOpen(true);
                        }, title: `#${node.path}`, children: [_jsx("span", { className: "sidebar-row-icon", children: _jsx(TagIcon, { size: 15 }) }), _jsx("span", { className: "sidebar-row-label", children: node.name }), _jsx("span", { className: "count-badge", children: node.count })] }), _jsx("button", { ref: menuTriggerRef, type: "button", className: "icon-button tag-row-more", "aria-label": `Actions for #${node.path}`, "aria-expanded": menuOpen, onClick: () => setMenuOpen((value) => !value), children: _jsx(MoreIcon, { size: 14 }) })] }), menuOpen ? (_jsxs(Menu, { align: "right", label: `Actions for #${node.path}`, triggerRef: menuTriggerRef, onClose: () => setMenuOpen(false), style: { top: '1.9rem' }, children: [_jsx(MenuItem, { icon: _jsx(PencilIcon, { size: 15 }), onSelect: () => {
                            setMenuOpen(false);
                            onRename(node.path);
                        }, children: "Rename tag\u2026" }), _jsx(MenuSeparator, {}), _jsx(MenuItem, { icon: _jsx(TrashIcon, { size: 15 }), danger: true, onSelect: () => {
                            setMenuOpen(false);
                            onDelete(node.path);
                        }, children: "Remove from notes\u2026" })] })) : null, hasChildren && open ? (_jsx(TagTree, { nodes: node.children, filter: filter, onSelect: onSelect, onRename: onRename, onDelete: onDelete, depth: depth + 1 })) : null] }));
}
