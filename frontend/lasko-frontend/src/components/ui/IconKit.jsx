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

export const CheckIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
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
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
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

export const LockIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M12 14V16M8.11972 5.02477C8.55509 3.28699 10.1272 2 12 2C14.2091 2 16 3.79086 16 6V9M7 21H17C18.1046 21 19 20.1046 19 19V11C19 9.89543 18.1046 9 17 9H7C5.89543 9 5 9.89543 5 11V19C5 20.1046 5.89543 21 7 21Z" />
  </svg>
);

export const SkullIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 512 512" className={className}>
    <path d="M437.914,74.078C392.43,27,326.117,0,255.992,0C185.883,0,119.57,27,74.102,74.063 c-42.5,44-64.703,102.828-62.531,165.688l6.609,83.875c6.031,84.75,55.234,93.906,76.094,93.906c7.563,0,15.531-1.094,23.625-3.188 c1.094,7.938,1,21.859,0.922,32.688l-0.078,15.063c-0.141,10.938-0.359,27.5,11.234,39.234c4.797,4.875,13.563,10.672,28,10.672 h196.047c14.438,0,23.188-5.797,28-10.656c11.578-11.75,11.375-28.297,11.234-39.25l-0.094-15.031 c-0.063-10.844-0.172-24.781,0.938-32.719c8.172,2.109,16.094,3.188,23.625,3.188c20.859,0,70.047-9.156,76.094-93.75l6.563-83.156 l0.047-0.875C502.602,176.891,480.398,118.063,437.914,74.078z M459.961,237.906l-6.516,82.844 c-2.672,37.344-14.703,56.281-35.719,56.281c-4.844,0-10.266-0.891-16.297-2.688c-14.406-4.156-26.891-1.375-35.703,7.5 c-13.406,13.5-13.266,35.313-13.047,65.5l0.078,15.281c0.031,2.5,0.078,6.188-0.141,8.875h-42.75v-50.016h-32.406V471.5h-42.938 v-50.016h-32.391V471.5h-42.766c-0.203-2.688-0.156-6.375-0.125-8.906l0.078-15.297c0.219-30.156,0.359-51.953-13.047-65.453 c-8.766-8.844-20.953-11.75-35.875-7.453c-5.859,1.75-11.281,2.641-16.125,2.641c-21.031,0-33.031-18.938-35.719-56.438 l-6.531-82.688c-1.656-51.609,16.5-99.781,51.203-135.688C141.117,63,196.805,40.5,255.992,40.5 c59.203,0,114.891,22.5,152.781,61.719C443.477,138.125,461.648,186.297,459.961,237.906z"/>
    <path d="M256.008,309.656c-9.719,0-31.125,46.688-35.031,54.469c-3.875,7.781,3.906,19.469,15.578,15.563 c11.672-3.875,19.453-13.609,19.453-13.609s7.781,9.734,19.453,13.609c11.656,3.906,19.453-7.781,15.563-15.563 C287.117,356.344,265.742,309.656,256.008,309.656z"/>
    <path d="M171.586,183.281c-30.891-3.25-58.578,19.188-61.828,50.094l-4.188,29.422 c-3.25,30.922,19.188,58.578,50.078,61.828c30.922,3.25,58.609-19.172,61.844-50.094l4.188-29.422 C224.914,214.188,202.508,186.531,171.586,183.281z"/>
    <path d="M402.242,233.375c-3.234-30.906-30.938-53.344-61.828-50.094c-30.922,3.25-53.328,30.906-50.094,61.828 l4.172,29.422c3.25,30.922,30.938,53.344,61.844,50.094s53.344-30.906,50.094-61.828L402.242,233.375z"/>
  </svg>
);

export const UserIcon = ({ size = 'md', className = '' }) => (
  <svg width={iconSizes[size]} height={iconSizes[size]} fill="currentColor" viewBox="0 0 512 512" className={className}>
    <path d="M458.159,404.216c-18.93-33.65-49.934-71.764-100.409-93.431c-28.868,20.196-63.938,32.087-101.745,32.087 c-37.828,0-72.898-11.89-101.767-32.087c-50.474,21.667-81.479,59.782-100.398,93.431C28.731,448.848,48.417,512,91.842,512 c43.426,0,164.164,0,164.164,0s120.726,0,164.153,0C463.583,512,483.269,448.848,458.159,404.216z"/>
    <path d="M256.005,300.641c74.144,0,134.231-60.108,134.231-134.242v-32.158C390.236,60.108,330.149,0,256.005,0 c-74.155,0-134.252,60.108-134.252,134.242V166.4C121.753,240.533,181.851,300.641,256.005,300.641z"/>
  </svg>
);

// ============================================================================
// EKSPORT WSZYSTKICH IKON
// ============================================================================

const IconKit = {
  // Nawigacja i akcje
  Plus: PlusIcon,
  Close: CloseIcon,
  Check: CheckIcon,
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
  Lock: LockIcon,
  Skull: SkullIcon,
  User: UserIcon,
};

export default IconKit;

