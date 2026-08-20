/**
 * Typography Tokens — Font system
 *
 * Provides a unified typography system with font families, sizes, weights,
 * line heights, and letter spacing that works across all themes.
 */

// Font families
export const fontFamily = {
  // Primary sans-serif (UI text)
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),

  // Secondary sans-serif (headings, emphasis)
  sansDisplay: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(', '),

  // Serif (editorial, long-form content)
  serif: [
    'Playfair Display',
    'Georgia',
    'Cambria',
    'Times New Roman',
    'Times',
    'serif',
  ].join(', '),

  // Monospace (code, data, technical)
  mono: [
    'JetBrains Mono',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),

  // Legal/document font (contracts, formal docs)
  legal: [
    'Fraunces',
    'Georgia',
    'Cambria',
    'Times New Roman',
    'serif',
  ].join(', '),

  // Editorial theme specific
  editorial: {
    sans: [
      'IBM Plex Sans',
      'Inter',
      'system-ui',
      'sans-serif',
    ].join(', '),
    serif: [
      'Fraunces',
      'Georgia',
      'serif',
    ].join(', '),
    mono: [
      'IBM Plex Mono',
      'JetBrains Mono',
      'monospace',
    ].join(', '),
  },

  // Brutalist theme specific
  brutalist: {
    sans: [
      'JetBrains Mono',
      'ui-monospace',
      'monospace',
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'ui-monospace',
      'monospace',
    ].join(', '),
  },
} as const;

// Font sizes (using rem for scalability)
export const fontSize = {
  // Display sizes (marketing, hero)
  'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],  // 72px
  'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],   // 60px
  'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],     // 48px
  'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],   // 36px
  'display-sm': ['1.875rem', { lineHeight: '1.25', letterSpacing: '0' }],       // 30px
  'display-xs': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0' }],          // 24px

  // Heading sizes
  h1: ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],   // 36px
  h2: ['1.875rem', { lineHeight: '1.3', letterSpacing: '0' }],         // 30px
  h3: ['1.5rem', { lineHeight: '1.35', letterSpacing: '0' }],          // 24px
  h4: ['1.25rem', { lineHeight: '1.4', letterSpacing: '0' }],          // 20px
  h5: ['1.125rem', { lineHeight: '1.45', letterSpacing: '0' }],        // 18px
  h6: ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],             // 16px

  // Body sizes
  'body-xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0' }],   // 20px
  'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],  // 18px
  'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],      // 16px
  'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],  // 14px
  'body-xs': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0' }], // 13px

  // Label/caption sizes
  'label-lg': ['1rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],      // 16px
  'label-md': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],  // 14px
  'label-sm': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }], // 13px
  'label-xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],   // 12px

  // Caption/footnote
  caption: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],      // 12px
  footnote: ['0.6875rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],   // 11px
  legal: ['0.625rem', { lineHeight: '1.6', letterSpacing: '0.03em' }],       // 10px
} as const;

// Font weights
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// Line heights
export const lineHeight = {
  none: '1',
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.02em',
  normal: '0',
  wide: '0.02em',
  wider: '0.04em',
  widest: '0.1em',
} as const;

// Semantic typography aliases
export const semanticTypography = {
  // Display/hero text
  display: {
    hero: fontSize['display-xl'],
    section: fontSize['display-lg'],
    subsection: fontSize['display-md'],
    card: fontSize['display-sm'],
  },
  // Headings
  heading: {
    h1: fontSize.h1,
    h2: fontSize.h2,
    h3: fontSize.h3,
    h4: fontSize.h4,
    h5: fontSize.h5,
    h6: fontSize.h6,
  },
  // Body text
  body: {
    xl: fontSize['body-xl'],
    lg: fontSize['body-lg'],
    md: fontSize['body-md'],
    sm: fontSize['body-sm'],
    xs: fontSize['body-xs'],
  },
  // UI labels
  label: {
    lg: fontSize['label-lg'],
    md: fontSize['label-md'],
    sm: fontSize['label-sm'],
    xs: fontSize['label-xs'],
  },
  // Captions/footnotes
  caption: {
    default: fontSize.caption,
    footnote: fontSize.footnote,
    legal: fontSize.legal,
  },
  // Code/monospace
  code: {
    sm: ['0.8125rem', { lineHeight: '1.5', fontFamily: fontFamily.mono }],
    md: ['0.875rem', { lineHeight: '1.6', fontFamily: fontFamily.mono }],
    lg: ['1rem', { lineHeight: '1.6', fontFamily: fontFamily.mono }],
  },
} as const;

// Theme-specific typography overrides
export const themeTypography = {
  glass: {
    // Glass theme uses Inter for everything, slightly larger for readability on dark
    fontFamily: {
      ...fontFamily,
      sans: fontFamily.sans,
      sansDisplay: fontFamily.sans,
    },
    // Slightly increased font sizes for dark mode readability
    fontSize: {
      ...fontSize,
      'body-md': ['1.0625rem', { lineHeight: '1.6', letterSpacing: '0' }],  // 17px
      'body-sm': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0' }],   // 15px
    },
  },
  editorial: {
    // Editorial uses IBM Plex Sans + Fraunces
    fontFamily: fontFamily.editorial,
    // Standard sizes, optimized for reading
    fontSize: {
      ...fontSize,
      'body-lg': ['1.1875rem', { lineHeight: '1.7', letterSpacing: '0' }],  // 19px
      'body-md': ['1.0625rem', { lineHeight: '1.7', letterSpacing: '0' }],   // 17px
    },
  },
  brutalist: {
    // Brutalist uses monospace for everything
    fontFamily: fontFamily.brutalist,
    // Standard sizes, monospace optimized
    fontSize: {
      ...fontSize,
      'body-md': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],        // 16px
      'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],    // 14px
    },
  },
} as const;

// Text color tokens (semantic)
export const textColor = {
  // Primary text
  primary: 'var(--ag-color-text-primary)',
  secondary: 'var(--ag-color-text-secondary)',
  tertiary: 'var(--ag-color-text-tertiary)',
  inverse: 'var(--ag-color-text-inverse)',
  disabled: 'var(--ag-color-text-disabled)',

  // Link colors
  link: 'var(--ag-color-text-link)',
  linkHover: 'var(--ag-color-text-link-hover)',

  // Status text colors
  success: 'var(--ag-color-status-success-text)',
  warning: 'var(--ag-color-status-warning-text)',
  error: 'var(--ag-color-status-error-text)',
  info: 'var(--ag-color-status-info-text)',

  // Brand text
  brand: 'var(--ag-color-brand-primary)',
  brandLight: 'var(--ag-color-brand-primary-light)',
  brandDark: 'var(--ag-color-brand-primary-dark)',
} as const;

export type TypographyTokens = {
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
  letterSpacing: typeof letterSpacing;
  semantic: typeof semanticTypography;
  theme: typeof themeTypography;
  textColor: typeof textColor;
};

export const typographyTokens: TypographyTokens = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  semantic: semanticTypography,
  theme: themeTypography,
  textColor,
} as const;

export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
export type LineHeightKey = keyof typeof lineHeight;
export type LetterSpacingKey = keyof typeof letterSpacing;
export type SemanticTypographyCategory = keyof typeof semanticTypography;