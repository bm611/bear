import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HugeiconsIcon } from '@hugeicons/react';
import { Archive02Icon, ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, BookmarkOff02Icon, Calendar03Icon, Cancel01Icon, CheckmarkSquare02Icon, ClipboardCopyIcon, Copy01Icon, Delete02Icon, DeletePutBackIcon, Download04Icon, Edit02Icon, Heading02Icon, KeyboardIcon as KeyboardGlyph, LeftToRightBlockQuoteIcon, LeftToRightListBulletIcon, Link02Icon, MoreHorizontalIcon, Note01Icon, PinIcon as PinGlyph, PlusSignIcon, Moon02Icon, RefreshIcon, Search01Icon, Settings01Icon, SidebarRight01Icon, SourceCodeIcon, Sun03Icon, LayoutTable01Icon, Tag01Icon, TextBoldIcon, TextItalicIcon, Tick02Icon, Upload04Icon, ViewIcon, } from '@hugeicons/core-free-icons';
/** Wraps a Hugeicons glyph so every icon shares one size and stroke weight. */
function glyph(icon, name) {
    function Glyph({ size = 16, strokeWidth = 1.6, ...rest }) {
        return _jsx(HugeiconsIcon, { icon: icon, size: size, strokeWidth: strokeWidth, ...rest });
    }
    Glyph.displayName = name;
    return Glyph;
}
/** The app's own mark: a writing slate, ruled with three strokes of script. */
export function SlateMark({ size = 20, ...rest }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", ...rest, children: [_jsx("rect", { x: "3.2", y: "3.2", width: "17.6", height: "17.6", rx: "4.2", strokeWidth: 1.25 }), _jsxs("g", { strokeWidth: 1.85, children: [_jsx("path", { d: "M7.6 15.4 9.7 8.9" }), _jsx("path", { d: "M11.4 15.4 13.5 8.9" }), _jsx("path", { d: "M15.2 15.4 16.2 12.2" })] })] }));
}
// Library
export const NotesIcon = glyph(Note01Icon, 'NotesIcon');
export const TagIcon = glyph(Tag01Icon, 'TagIcon');
export const UntaggedIcon = glyph(BookmarkOff02Icon, 'UntaggedIcon');
export const TodoIcon = glyph(CheckmarkSquare02Icon, 'TodoIcon');
export const TodayIcon = glyph(Calendar03Icon, 'TodayIcon');
export const ArchiveIcon = glyph(Archive02Icon, 'ArchiveIcon');
export const TrashIcon = glyph(Delete02Icon, 'TrashIcon');
export const RestoreIcon = glyph(DeletePutBackIcon, 'RestoreIcon');
// Chrome
export const SearchIcon = glyph(Search01Icon, 'SearchIcon');
export const PlusIcon = glyph(PlusSignIcon, 'PlusIcon');
export const ListIcon = glyph(SidebarRight01Icon, 'ListIcon');
export const MoreIcon = glyph(MoreHorizontalIcon, 'MoreIcon');
export const ChevronRight = glyph(ArrowRight01Icon, 'ChevronRight');
export const ChevronDown = glyph(ArrowDown01Icon, 'ChevronDown');
export const CloseIcon = glyph(Cancel01Icon, 'CloseIcon');
export const CheckIcon = glyph(Tick02Icon, 'CheckIcon');
export const PinIcon = glyph(PinGlyph, 'PinIcon');
// Settings
export const SunIcon = glyph(Sun03Icon, 'SunIcon');
export const MoonIcon = glyph(Moon02Icon, 'MoonIcon');
export const SettingsIcon = glyph(Settings01Icon, 'SettingsIcon');
export const KeyboardIcon = glyph(KeyboardGlyph, 'KeyboardIcon');
export const DownloadIcon = glyph(Download04Icon, 'DownloadIcon');
export const UploadIcon = glyph(Upload04Icon, 'UploadIcon');
export const CopyIcon = glyph(Copy01Icon, 'CopyIcon');
export const ClipboardIcon = glyph(ClipboardCopyIcon, 'ClipboardIcon');
// Editing
export const EyeIcon = glyph(ViewIcon, 'EyeIcon');
export const PencilIcon = glyph(Edit02Icon, 'PencilIcon');
export const BoldIcon = glyph(TextBoldIcon, 'BoldIcon');
export const ItalicIcon = glyph(TextItalicIcon, 'ItalicIcon');
export const CodeIcon = glyph(SourceCodeIcon, 'CodeIcon');
export const QuoteIcon = glyph(LeftToRightBlockQuoteIcon, 'QuoteIcon');
export const BulletIcon = glyph(LeftToRightListBulletIcon, 'BulletIcon');
export const HeadingIcon = glyph(Heading02Icon, 'HeadingIcon');
export const LinkIcon = glyph(Link02Icon, 'LinkIcon');
export const TableIcon = glyph(LayoutTable01Icon, 'TableIcon');
// Landing & navigation
export const SyncIcon = glyph(RefreshIcon, 'SyncIcon');
export const BackIcon = glyph(ArrowLeft01Icon, 'BackIcon');
