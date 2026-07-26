import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const BearMark = (props: IconProps) => (
  <Icon {...props} strokeWidth={1.5}>
    <path d="M5.5 7.2A2.6 2.6 0 0 1 9 5.4M18.5 7.2A2.6 2.6 0 0 0 15 5.4" />
    <path d="M12 20c4.1 0 6.6-2.6 6.6-6.3C18.6 9 15.7 5 12 5S5.4 9 5.4 13.7C5.4 17.4 7.9 20 12 20Z" />
    <path d="M10.2 12.4h.01M13.8 12.4h.01" strokeWidth={2.2} />
    <path d="M12 15.2c-.9 0-1.5.5-1.5 1.1s.6 1.1 1.5 1.1 1.5-.5 1.5-1.1-.6-1.1-1.5-1.1Z" />
  </Icon>
)

export const NotesIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 4.5h14v15H5z" />
    <path d="M8.2 9h7.6M8.2 12.2h7.6M8.2 15.4h4.6" />
  </Icon>
)

export const TagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 11.2 11.2 4.5H19V12l-6.7 6.7a1.6 1.6 0 0 1-2.3 0l-5.5-5.4a1.6 1.6 0 0 1 0-2.1Z" />
    <path d="M15.3 8.7h.01" strokeWidth={2.4} />
  </Icon>
)

export const UntaggedIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 11.2 11.2 4.5H19V12l-6.7 6.7a1.6 1.6 0 0 1-2.3 0l-5.5-5.4a1.6 1.6 0 0 1 0-2.1Z" />
    <path d="m4 4 16 16" />
  </Icon>
)

export const TodoIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 5.5h14v13H5z" />
    <path d="m8.5 12 2.4 2.4 4.6-4.8" />
  </Icon>
)

export const TodayIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 6.5h14v13H5zM8.5 4v4M15.5 4v4M5 10.5h14" />
  </Icon>
)

export const ArchiveIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 5.5h16v3.5H4zM5.5 9v10h13V9M10 12.5h4" />
  </Icon>
)

export const TrashIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.9 12h8.6l.9-12M10.5 10.5v5M13.5 10.5v5" />
  </Icon>
)

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="5.5" />
    <path d="m15.2 15.2 4 4" />
  </Icon>
)

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
)

export const SidebarIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 5h15v14h-15zM9.5 5v14" />
  </Icon>
)

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 5h15v14h-15zM14 5v14" />
  </Icon>
)

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 14.5V20M8 4.8h8l-1 6 2.2 2.2H6.8L9 10.8z" />
  </Icon>
)

export const MoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6.5 12h.01M12 12h.01M17.5 12h.01" strokeWidth={2.6} />
  </Icon>
)

export const ChevronRight = (props: IconProps) => (
  <Icon {...props} strokeWidth={2}>
    <path d="m10 7.5 5 4.5-5 4.5" />
  </Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Icon>
)

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </Icon>
)

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
  </Icon>
)

export const SettingsIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 4v2.2M12 17.8V20M4.9 8l1.9 1.1M17.2 14.9 19.1 16M19.1 8l-1.9 1.1M6.8 14.9 4.9 16" />
  </Icon>
)

export const EyeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M2.8 12S6 6.5 12 6.5 21.2 12 21.2 12 18 17.5 12 17.5 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Icon>
)

export const PencilIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.8 19.2h3.4L19 8.4a1.7 1.7 0 0 0 0-2.4l-1-1a1.7 1.7 0 0 0-2.4 0L4.8 15.8z" />
    <path d="m14.4 7 2.6 2.6" />
  </Icon>
)

export const BoldIcon = (props: IconProps) => (
  <Icon {...props} strokeWidth={2}>
    <path d="M7.5 5h5.2a3.5 3.5 0 0 1 0 7H7.5zM7.5 12h5.9a3.5 3.5 0 0 1 0 7H7.5z" />
  </Icon>
)

export const ItalicIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10 5h7M7 19h7M14.5 5 9.5 19" />
  </Icon>
)

export const CodeIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m9 8.5-4 3.5 4 3.5M15 8.5l4 3.5-4 3.5" />
  </Icon>
)

export const QuoteIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5.5 6v12M9.5 8.5h9M9.5 12h9M9.5 15.5h5" />
  </Icon>
)

export const BulletIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9.5 7.5h10M9.5 12h10M9.5 16.5h10M5 7.5h.01M5 12h.01M5 16.5h.01" strokeWidth={2.2} />
  </Icon>
)

export const HeadingIcon = (props: IconProps) => (
  <Icon {...props} strokeWidth={2}>
    <path d="M6 5.5v13M14 5.5v13M6 12h8M17.5 18.5V11l-2 1.3" />
  </Icon>
)

export const LinkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M10.5 13.5 13.5 10.5" />
    <path d="M9.2 15.9 7.8 17.3a3 3 0 0 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0" />
    <path d="M14.8 8.1l1.4-1.4a3 3 0 0 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0" />
  </Icon>
)

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 9V5.5h9.5V15H15" />
    <path d="M5.5 9H15v9.5H5.5z" />
  </Icon>
)

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 4.5v10M8.2 11l3.8 3.8L15.8 11M5 18.5h14" />
  </Icon>
)

export const UploadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 14.8V4.8M8.2 8.4 12 4.6l3.8 3.8M5 18.5h14" />
  </Icon>
)

export const RestoreIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.8 9.5A7.5 7.5 0 1 1 4.5 14" />
    <path d="M4.5 5v4.8h4.8" />
  </Icon>
)

export const KeyboardIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3.5 7h17v10h-17z" />
    <path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M8 13.5h8" strokeWidth={2.1} />
  </Icon>
)

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
  </Icon>
)

export const CheckIcon = (props: IconProps) => (
  <Icon {...props} strokeWidth={2.2}>
    <path d="m5.5 12.5 4 4 9-9" />
  </Icon>
)
