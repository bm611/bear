import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react'
import {
  Archive02Icon,
  ArrowRight01Icon,
  BookmarkOff02Icon,
  Calendar03Icon,
  Cancel01Icon,
  CheckmarkSquare02Icon,
  ClipboardCopyIcon,
  Copy01Icon,
  Delete02Icon,
  DeletePutBackIcon,
  Download04Icon,
  Edit02Icon,
  Heading02Icon,
  KeyboardIcon as KeyboardGlyph,
  LeftToRightBlockQuoteIcon,
  LeftToRightListBulletIcon,
  Link02Icon,
  Menu01Icon,
  MoreHorizontalIcon,
  Note01Icon,
  PinIcon as PinGlyph,
  PlusSignIcon,
  Moon02Icon,
  Search01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  SourceCodeIcon,
  Sun03Icon,
  Table01Icon,
  Tag01Icon,
  TextBoldIcon,
  TextItalicIcon,
  Tick02Icon,
  Upload04Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'

export type IconProps = Omit<HugeiconsIconProps, 'icon' | 'altIcon'>

/** Wraps a Hugeicons glyph so every icon shares one size and stroke weight. */
function glyph(icon: IconSvgElement, name: string) {
  function Glyph({ size = 16, strokeWidth = 1.6, ...rest }: IconProps) {
    return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth} {...rest} />
  }
  Glyph.displayName = name
  return Glyph
}

/** The app's own mark — Hugeicons has no bear. */
export function BearMark({ size = 20, ...rest }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M5.5 7.2A2.6 2.6 0 0 1 9 5.4M18.5 7.2A2.6 2.6 0 0 0 15 5.4" />
      <path d="M12 20c4.1 0 6.6-2.6 6.6-6.3C18.6 9 15.7 5 12 5S5.4 9 5.4 13.7C5.4 17.4 7.9 20 12 20Z" />
      <path d="M10.2 12.4h.01M13.8 12.4h.01" strokeWidth={2.2} />
      <path d="M12 15.2c-.9 0-1.5.5-1.5 1.1s.6 1.1 1.5 1.1 1.5-.5 1.5-1.1-.6-1.1-1.5-1.1Z" />
    </svg>
  )
}

// Library
export const NotesIcon = glyph(Note01Icon, 'NotesIcon')
export const TagIcon = glyph(Tag01Icon, 'TagIcon')
export const UntaggedIcon = glyph(BookmarkOff02Icon, 'UntaggedIcon')
export const TodoIcon = glyph(CheckmarkSquare02Icon, 'TodoIcon')
export const TodayIcon = glyph(Calendar03Icon, 'TodayIcon')
export const ArchiveIcon = glyph(Archive02Icon, 'ArchiveIcon')
export const TrashIcon = glyph(Delete02Icon, 'TrashIcon')
export const RestoreIcon = glyph(DeletePutBackIcon, 'RestoreIcon')

// Chrome
export const SearchIcon = glyph(Search01Icon, 'SearchIcon')
export const PlusIcon = glyph(PlusSignIcon, 'PlusIcon')
export const SidebarIcon = glyph(SidebarLeft01Icon, 'SidebarIcon')
export const ListIcon = glyph(SidebarRight01Icon, 'ListIcon')
export const MenuIcon = glyph(Menu01Icon, 'MenuIcon')
export const MoreIcon = glyph(MoreHorizontalIcon, 'MoreIcon')
export const ChevronRight = glyph(ArrowRight01Icon, 'ChevronRight')
export const CloseIcon = glyph(Cancel01Icon, 'CloseIcon')
export const CheckIcon = glyph(Tick02Icon, 'CheckIcon')
export const PinIcon = glyph(PinGlyph, 'PinIcon')

// Settings
export const SunIcon = glyph(Sun03Icon, 'SunIcon')
export const MoonIcon = glyph(Moon02Icon, 'MoonIcon')
export const SettingsIcon = glyph(Settings01Icon, 'SettingsIcon')
export const KeyboardIcon = glyph(KeyboardGlyph, 'KeyboardIcon')
export const DownloadIcon = glyph(Download04Icon, 'DownloadIcon')
export const UploadIcon = glyph(Upload04Icon, 'UploadIcon')
export const CopyIcon = glyph(Copy01Icon, 'CopyIcon')
export const ClipboardIcon = glyph(ClipboardCopyIcon, 'ClipboardIcon')

// Editing
export const EyeIcon = glyph(ViewIcon, 'EyeIcon')
export const PencilIcon = glyph(Edit02Icon, 'PencilIcon')
export const BoldIcon = glyph(TextBoldIcon, 'BoldIcon')
export const ItalicIcon = glyph(TextItalicIcon, 'ItalicIcon')
export const CodeIcon = glyph(SourceCodeIcon, 'CodeIcon')
export const QuoteIcon = glyph(LeftToRightBlockQuoteIcon, 'QuoteIcon')
export const BulletIcon = glyph(LeftToRightListBulletIcon, 'BulletIcon')
export const HeadingIcon = glyph(Heading02Icon, 'HeadingIcon')
export const LinkIcon = glyph(Link02Icon, 'LinkIcon')
export const TableIcon = glyph(Table01Icon, 'TableIcon')
