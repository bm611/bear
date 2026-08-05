import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react'
import {
  Archive02Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
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
  MoreHorizontalIcon,
  Note01Icon,
  PinIcon as PinGlyph,
  PlusSignIcon,
  Moon02Icon,
  RefreshIcon,
  Search01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  Sorting05Icon,
  SourceCodeIcon,
  Sun03Icon,
  LayoutTable01Icon,
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

/** The app's own mark: a folded sheet with one decisive line of writing. */
export function SlateMark({ size = 20, ...rest }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M5 3.5h9.8L19 7.7v12.8H5z" />
      <path d="M14.8 3.5v4.2H19" />
      <path d="M8.2 12h7.6M8.2 15.3h5.5" strokeWidth={1.9} />
    </svg>
  )
}

/**
 * The brand ornament: a small gateway drawn as nested arches over a ground
 * line of dots — an archway built with mandala repetition. Sits above hero
 * eyebrows and on the auth card.
 */
export function MotifMark({ size = 64, ...rest }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={(size * 5) / 12}
      viewBox="0 0 72 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {/* Nested gateway arches — the threshold */}
      <path d="M26 26.5 V15.5 C26 9.4 30.3 5.6 36 5.6 C41.7 5.6 46 9.4 46 15.5 V26.5" />
      <path d="M31.5 26.5 V16.5 C31.5 13.2 33.4 11 36 11 C38.6 11 40.5 13.2 40.5 16.5 V26.5" />
      {/* The finial dot above the crown */}
      <circle cx="36" cy="1.9" r="1.15" fill="currentColor" stroke="none" />
      {/* Ground line, extending into mandala dots either side */}
      <path d="M18 26.5 H54" strokeWidth={1.2} />
      <circle cx="11.5" cy="26.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="26.5" r="1.15" fill="currentColor" stroke="none" opacity="0.45" />
      <circle cx="60.5" cy="26.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="66.5" cy="26.5" r="1.15" fill="currentColor" stroke="none" opacity="0.45" />
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
export const ListIcon = glyph(SidebarRight01Icon, 'ListIcon')
export const SidebarIcon = glyph(SidebarLeft01Icon, 'SidebarIcon')
export const SortIcon = glyph(Sorting05Icon, 'SortIcon')
export const MoreIcon = glyph(MoreHorizontalIcon, 'MoreIcon')
export const ChevronRight = glyph(ArrowRight01Icon, 'ChevronRight')
export const ChevronDown = glyph(ArrowDown01Icon, 'ChevronDown')
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
export const TableIcon = glyph(LayoutTable01Icon, 'TableIcon')

// Landing & navigation
export const SyncIcon = glyph(RefreshIcon, 'SyncIcon')
export const BackIcon = glyph(ArrowLeft01Icon, 'BackIcon')
