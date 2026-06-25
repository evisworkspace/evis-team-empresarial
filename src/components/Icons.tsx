// Ícones inline — SVG simples, sem dependência externa.
// Uso: <DashboardIcon /> ou <DashboardIcon size={20} className="..." />

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

export function DashboardIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" className={className}>
      <rect x="1" y="1" width="7" height="7" rx="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function BuildingIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 16V8.5L9 2l7 6.5V16H2z" />
      <path strokeLinecap="round" d="M6 16v-5h6v5" />
    </svg>
  );
}

export function UsersIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="7" cy="6" r="3" />
      <path strokeLinecap="round" d="M1 16c0-3.31 2.69-6 6-6" />
      <path strokeLinecap="round" d="M13.5 5.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      <path strokeLinecap="round" d="M17 16c0-2.76-1.79-5-4-5.5" />
    </svg>
  );
}

export function TruckIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="1" y="6" width="11" height="8" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9h3l2 3.5V14h-5V9z" />
      <circle cx="4.5" cy="14.5" r="1.5" />
      <circle cx="13.5" cy="14.5" r="1.5" />
    </svg>
  );
}

export function TasksIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3" y="2" width="12" height="14" rx="1.5" />
      <path strokeLinecap="round" d="M6 7h6M6 10h6M6 13h3" />
    </svg>
  );
}

export function AgentsIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" className={className}>
      <path d="M9 0.5L10.8 5.4 16 7 10.8 8.6 9 13.5 7.2 8.6 2 7 7.2 5.4z" />
      <path d="M14.5 10L15.6 13.1 18 14 15.6 14.9 14.5 18 13.4 14.9 11 14 13.4 13.1z" opacity="0.55" />
    </svg>
  );
}

export function PlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" d="M9 3v12M3 9h12" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function SignOutIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 12l3-3-3-3M14 9H6M9 2H3a1 1 0 00-1 1v10a1 1 0 001 1h6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
    </svg>
  );
}

export function AlertIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2L1.5 15.5h15L9 2z" />
      <path strokeLinecap="round" d="M9 8v3.5M9 13.5v.5" />
    </svg>
  );
}

export function FinanceIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="1" y="3" width="16" height="12" rx="2" />
      <path strokeLinecap="round" d="M1 7h16" />
      <path strokeLinecap="round" d="M5 11h2M11 11h2" />
    </svg>
  );
}

export function CalendarIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="1" y="3" width="16" height="13" rx="2" />
      <path strokeLinecap="round" d="M1 8h16M6 1v4M12 1v4" />
    </svg>
  );
}

export function PhoneIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 2h4l1.5 4-2 1.5c1 2 2.5 3.5 4.5 4.5L12.5 10l4 1.5V16a1 1 0 01-1 1C6.5 17 1 11.5 1 3a1 1 0 011-1z" />
    </svg>
  );
}

export function MapPinIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="9" cy="7" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 1C5.69 1 3 3.69 3 7c0 4.97 6 10 6 10s6-5.03 6-10c0-3.31-2.69-6-6-6z" />
    </svg>
  );
}

export function ClockIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="9" cy="9" r="7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5v4l2.5 2.5" />
    </svg>
  );
}

export function StarIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" className={className}>
      <path d="M9 1l2.3 4.9L17 7l-4 3.9.9 5.6L9 14l-4.9 2.5L5 11 1 7l5.7-.1z" />
    </svg>
  );
}

export function BotIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="2" y="6" width="14" height="9" rx="2" />
      <path strokeLinecap="round" d="M9 1v5" />
      <circle cx="9" cy="1" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M6 13.5h6" />
      <path strokeLinecap="round" d="M1 10h1M16 10h1" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function ZapIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M10 2L4 10H8L6 14L14 7H10L10 2Z" />
    </svg>
  );
}

export function EyeIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
      <circle cx="9" cy="9" r="2.5" />
    </svg>
  );
}

export function XIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

export function EditIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}

export function HistoryIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 9a7 7 0 1014 0A7 7 0 002 9z" />
      <path strokeLinecap="round" d="M2 5V2m0 3h3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6v3l2 2" />
    </svg>
  );
}

export function SettingsIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="9" cy="9" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M14.78 3.22l-1.42 1.42M4.64 13.36l-1.42 1.42" />
    </svg>
  )
}

export function CameraIcon({ size = 18, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} style={style}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 5h2l2-3h8l2 3h2a1 1 0 011 1v9a1 1 0 01-1 1H1a1 1 0 01-1-1V6a1 1 0 011-1z" />
      <circle cx="9" cy="10" r="2.5" />
    </svg>
  )
}

export function MailIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="1" y="4" width="16" height="11" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 7l8 5 8-5" />
    </svg>
  )
}

export function ActivityIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 4V2m6 2V2M2 7h14" />
      <path strokeLinecap="round" d="M5 10h4M5 12.5h2.5" />
      <circle cx="13" cy="11.5" r="2" />
      <path strokeLinecap="round" d="M13 10.5v1l.7.7" />
    </svg>
  );
}
