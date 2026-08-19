// AG Associates Design Tokens — single source of truth
// Extracted from: styles/glass-theme.css, styles/ag-editorial.css, tailwind.config.js, index.css

export const glassTokens = {
  colors: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    secondary: '#4f46e5',
    secondaryLight: '#818cf8',
    secondaryDark: '#3730a3',
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    accentDark: '#0891b2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    bgPrimary: '#0f0f23',
    bgSecondary: '#1a1a2e',
    bgTertiary: '#16213e',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
  },
  glass: {
    blur: '20px',
    bg: 'rgba(255,255,255,0.03)',
    bgHover: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.15)',
    shadow: '0 8px 32px rgba(0,0,0,0.3)',
    shadowHover: '0 12px 48px rgba(0,0,0,0.4)',
    background: 'rgba(255,255,255,0.05)',
    glassBorder: 'rgba(255,255,255,0.1)',
    glassShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    accent: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
    dark: 'linear-gradient(180deg, rgba(15,15,35,0.8) 0%, rgba(15,15,35,0.95) 100%)',
    mesh: 'radial-gradient(at 40% 20%, hsla(250,60%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(200,60%,50%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270,60%,50%,0.1) 0px, transparent 50%)',
    domainGradientStart: '#7c3aed',
    domainGradientEnd: '#4f46e5',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
    slower: '500ms ease',
  },
  status: {
    pending: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    active: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    completed: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    error: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  },
  domain: {
    primary: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryDark: '#5b21b6',
    secondary: '#4f46e5',
    secondaryLight: '#818cf8',
    secondaryDark: '#3730a3',
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    accentDark: '#0891b2',
    gradientStart: '#7c3aed',
    gradientEnd: '#4f46e5',
  },
} as const;

export const editorialTokens = {
  colors: {
    bg: '#f5f1e8',
    paper: '#fbf8f0',
    paper2: '#f0ead9',
    ink: '#1a1f2e',
    ink2: '#2a3142',
    muted: '#6b6557',
    accent: '#9a6b1e',
    accentSoft: '#c79a4a',
    green: '#3d7a4a',
    red: '#a8392b',
    blue: '#3a5b8a',
    line: 'rgba(26,31,46,0.12)',
    lineStrong: 'rgba(26,31,46,0.25)',
  },
  fonts: {
    sans: "'IBM Plex Sans', system-ui, sans-serif",
    serif: "'Fraunces', serif",
    mono: "'IBM Plex Mono', monospace",
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 12,
    full: 999,
  },
  transitions: {
    fast: '0.15s',
    base: '0.2s',
    slow: '0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const;

export const baseTokens = {
  fonts: {
    sans: "'Inter', system-ui, sans-serif",
    serif: "'Playfair Display', serif",
    mono: "'JetBrains Mono', monospace",
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
  },
} as const;

export type ThemeMode = 'glass' | 'editorial' | 'brutalist';
export type TokenSet = typeof glassTokens | typeof editorialTokens;
