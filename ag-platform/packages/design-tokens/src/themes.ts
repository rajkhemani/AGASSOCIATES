/**
 * Theme Generator — Creates complete theme token sets
 *
 * This module generates complete ThemeTokens objects for each theme mode
 * by combining all token modules with theme-specific overrides.
 */

import { createSemanticColors, type SemanticColorTokens } from './colors';
import { spacingTokens, type SpacingTokens } from './spacing';
import { radiusTokens, type RadiusTokens } from './radius';
import { elevationTokens, type ElevationTokens } from './elevation';
import { motionTokens, type MotionTokens } from './motion';
import { statusTokens, type StatusTokens } from './status';
import { typographyTokens, type TypographyTokens } from './typography';
import { glassTokens, type GlassTokens } from './glass';
import { editorialTokens, type EditorialTokens } from './editorial';
import { generateCSSVariables, type ThemeTokens, type ThemeMode, type ColorScheme } from './index';

// ============================================
// Theme Token Generation
// ============================================

/**
 * Generate complete theme tokens for a given mode and color scheme
 */
export function generateThemeTokens(mode: ThemeMode, scheme: ColorScheme = 'dark'): ThemeTokens {
  const colors = createSemanticColors(scheme, mode);

  return {
    colors,
    spacing: spacingTokens,
    radius: radiusTokens,
    elevation: elevationTokens,
    motion: motionTokens,
    status: statusTokens,
    typography: typographyTokens,
    glass: glassTokens,
    editorial: editorialTokens,
  };
}

/**
 * Pre-generated theme token sets
 */
export const themeTokenSets = {
  // Glass theme (dark)
  glass: {
    dark: generateThemeTokens('glass', 'dark'),
    light: generateThemeTokens('glass', 'light'),
  },
  // Editorial theme
  editorial: {
    dark: generateThemeTokens('editorial', 'dark'),   // Blueprint
    light: generateThemeTokens('editorial', 'light'), // Default
  },
  // Brutalist theme
  brutalist: {
    dark: generateThemeTokens('brutalist', 'dark'),
    light: generateThemeTokens('brutalist', 'light'),
  },
} as const;

// ============================================
// CSS Variable Generation for Each Theme
// ============================================

/**
 * Generate CSS variables for a specific theme
 */
export function generateThemeCSSVariables(mode: ThemeMode, scheme: ColorScheme = 'dark', prefix = 'ag'): Record<string, string> {
  const tokens = generateThemeTokens(mode, scheme);
  return generateCSSVariables(tokens, prefix);
}

/**
 * Pre-generated CSS variable maps for each theme
 */
export const themeCSSVariables = {
  glass: {
    dark: generateThemeCSSVariables('glass', 'dark'),
    light: generateThemeCSSVariables('glass', 'light'),
  },
  editorial: {
    dark: generateThemeCSSVariables('editorial', 'dark'),
    light: generateThemeCSSVariables('editorial', 'light'),
  },
  brutalist: {
    dark: generateThemeCSSVariables('brutalist', 'dark'),
    light: generateThemeCSSVariables('brutalist', 'light'),
  },
} as const;

// ============================================
// Theme CSS Output (for injection)
// ============================================

/**
 * Generate complete CSS custom properties for a theme
 */
export function generateThemeCSS(mode: ThemeMode, scheme: ColorScheme = 'dark', selector = ':root', prefix = 'ag'): string {
  const vars = generateThemeCSSVariables(mode, scheme, prefix);
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

/**
 * Generate all theme CSS blocks
 */
export function generateAllThemesCSS(prefix = 'ag'): string {
  const themes: Array<{ mode: ThemeMode; scheme: ColorScheme; selector: string }> = [
    { mode: 'glass', scheme: 'dark', selector: '[data-theme="glass"]' },
    { mode: 'glass', scheme: 'light', selector: '[data-theme="glass"][data-color-scheme="light"]' },
    { mode: 'editorial', scheme: 'light', selector: '[data-theme="editorial"]' },
    { mode: 'editorial', scheme: 'dark', selector: '[data-theme="editorial"][data-color-scheme="dark"]' },
    { mode: 'brutalist', scheme: 'light', selector: '[data-theme="brutalist"]' },
    { mode: 'brutalist', scheme: 'dark', selector: '[data-theme="brutalist"][data-color-scheme="dark"]' },
  ];

  return themes
    .map(({ mode, scheme, selector }) => generateThemeCSS(mode, scheme, selector, prefix))
    .join('\n\n');
}

// ============================================
// Tailwind CSS Variable Definitions
// ============================================

/**
 * Generate Tailwind-compatible CSS variable definitions
 * These can be pasted into a global CSS file
 */
export function generateTailwindCSSVariables(prefix = 'ag'): string {
  // Use glass dark as the default/base
  const baseVars = generateThemeCSSVariables('glass', 'dark', prefix);
  const lines = Object.entries(baseVars).map(([key, value]) => `  ${key}: ${value};`);

  return `@layer base {\n  :root {\n${lines.join('\n')}\n  }\n\n${generateAllThemesCSS(prefix)}\n}`;
}

// ============================================
// Runtime Theme Application
// ============================================

/**
 * Apply theme tokens to document at runtime
 */
export function applyTheme(mode: ThemeMode, scheme: ColorScheme = 'dark', prefix = 'ag'): void {
  if (typeof document === 'undefined') return;

  const tokens = generateThemeTokens(mode, scheme);
  const vars = generateCSSVariables(tokens, prefix);

  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-color-scheme', scheme);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Get current theme from document
 */
export function getCurrentTheme(): { mode: ThemeMode; scheme: ColorScheme } | null {
  if (typeof document === 'undefined') return null;

  const mode = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
  const scheme = document.documentElement.getAttribute('data-color-scheme') as ColorScheme | null;

  if (!mode) return null;

  return { mode, scheme: scheme || 'dark' };
}

/**
 * Toggle color scheme (light/dark)
 */
export function toggleColorScheme(): ColorScheme {
  if (typeof document === 'undefined') return 'dark';

  const current = getCurrentTheme();
  const newScheme = current?.scheme === 'dark' ? 'light' : 'dark';

  if (current) {
    applyTheme(current.mode, newScheme);
  }

  return newScheme;
}

// ============================================
// Theme Configuration for Consumers
// ============================================

export const themeConfig = {
  // Available themes
  themes: ['glass', 'editorial', 'brutalist'] as ThemeMode[],
  // Default theme
  defaultTheme: 'glass' as ThemeMode,
  // Default color scheme
  defaultColorScheme: 'dark' as ColorScheme,
  // Theme display names
  themeLabels: {
    glass: 'Glassmorphism',
    editorial: 'Editorial',
    brutalist: 'Brutalist',
  },
  // Theme descriptions
  themeDescriptions: {
    glass: 'Dark glassmorphism with violet/cyan accents',
    editorial: 'Warm editorial with gold/blue accents (light) or blueprint (dark)',
    brutalist: 'High-contrast monochrome with yellow accent',
  },
  // Color schemes per theme
  colorSchemes: {
    glass: ['dark'] as ColorScheme[],
    editorial: ['light', 'dark'] as ColorScheme[],
    brutalist: ['light', 'dark'] as ColorScheme[],
  },
} as const;

export type ThemeConfig = typeof themeConfig;