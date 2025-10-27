import React from 'react';

/**
 * IconKit - zestaw ikon SVG dla całej aplikacji
 * Ikony są podzielone na kategorie i mają spójny design
 */

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

// ============================================================================
// IKONY NAWIGACJI I AKCJI
// ============================================================================

export const PlusIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export const CloseIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const DownloadIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const SearchIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const BellIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const SettingsIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6" />
    <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24" />
    <path d="M1 12h6m6 0h6" />
    <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
  </svg>
);

export const CopyIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// ============================================================================
// IKONY TRENINGOWE (WYPEŁNIONE)
// ============================================================================

export const DumbbellIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
  </svg>
);

export const BarbellIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M2 9v6h1V9H2zm18 0v6h1V9h-1zm-3 0v6h1V9h-1zM4 9v6h1V9H4zm14 0h-1v6h1V9zM6 9v6h1V9H6zm8 0H9v6h5V9z"/>
  </svg>
);

export const PlayIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M8 5v14l11-7z"/>
  </svg>
);

export const ZapIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

// ============================================================================
// IKONY DOKUMENTÓW I DANYCH (WYPEŁNIONE)
// ============================================================================

export const NotebookIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h12V4H6zm2 3h8v2H8V7zm0 4h8v2H8v-2zm0 4h5v2H8v-2z"/>
  </svg>
);

export const DocumentIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
  </svg>
);

export const CalendarIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
  </svg>
);

export const ChartUpIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" fill="none" stroke="currentColor" strokeWidth="2"/>
    <polyline points="16 7 22 7 22 13" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const ChartBarIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <rect x="4" y="11" width="4" height="10"/>
    <rect x="10" y="7" width="4" height="14"/>
    <rect x="16" y="3" width="4" height="18"/>
  </svg>
);

// ============================================================================
// IKONY NAGRÓD I CELÓW (WYPEŁNIONE)
// ============================================================================

export const TrophyIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M6 9H4.5C3.67 9 3 8.33 3 7.5S3.67 6 4.5 6H6V9zm12-3h1.5c.83 0 1.5.67 1.5 1.5S20.33 9 19.5 9H18V6zM12 3c-1.66 0-3 1.34-3 3v6c0 2.76 2.24 5 5 5h1v3H9v2h6v-2h-3v-3h1c2.76 0 5-2.24 5-5V6c0-1.66-1.34-3-3-3h-3z"/>
  </svg>
);

export const TargetIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const StarIcon = ({ size = 'md', className = '', filled = true }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ============================================================================
// IKONY POMOCNICZE
// ============================================================================

export const ClockIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
    <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const LightbulbIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
  </svg>
);

export const MuscleIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-1.5 5c-1.17 0-2.12.95-2.12 2.12 0 .74.38 1.39.96 1.76l1.66 7.78c.11.5.55.84 1.06.84h.88c.51 0 .95-.34 1.06-.84l1.66-7.78c.58-.37.96-1.02.96-1.76C13.62 7.95 12.67 7 11.5 7h-1z"/>
  </svg>
);

export const InfoIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const ChevronLeftIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 19l-7-7 7-7" />
  </svg>
);

export const ChevronRightIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19l7-7-7-7" />
  </svg>
);

// ============================================================================
// EKSPORT WSZYSTKICH IKON
// ============================================================================

const IconKit = {
  // Nawigacja i akcje
  Plus: PlusIcon,
  Close: CloseIcon,
  Download: DownloadIcon,
  Search: SearchIcon,
  Bell: BellIcon,
  Settings: SettingsIcon,
  Copy: CopyIcon,
  
  // Treningowe
  Dumbbell: DumbbellIcon,
  Barbell: BarbellIcon,
  Play: PlayIcon,
  Zap: ZapIcon,
  
  // Dokumenty i dane
  Notebook: NotebookIcon,
  Document: DocumentIcon,
  Calendar: CalendarIcon,
  ChartUp: ChartUpIcon,
  ChartBar: ChartBarIcon,
  
  // Nagrody i cele
  Trophy: TrophyIcon,
  Target: TargetIcon,
  Star: StarIcon,
  
  // Pomocnicze
  Clock: ClockIcon,
  Lightbulb: LightbulbIcon,
  Muscle: MuscleIcon,
  Info: InfoIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
};

export default IconKit;

