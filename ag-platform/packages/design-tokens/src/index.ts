/**
 * @ag/design-tokens — Unified Semantic Design Token System
 *
 * This package provides a single source of truth for all design tokens across
 * the Luxor9 Legal OS MVP. It unifies the glass-theme, editorial, and base
 * token sets into a coherent semantic system using the color.role.state pattern.
 *
 * Token Structure:
 * - colors: Semantic color tokens (color.role.state)
 * - spacing: Consistent spacing scale
 * - radius: Border radius scale
 * - elevation: Shadow/depth tokens
 * - motion: Animation/transition tokens
 * - status: Status-specific tokens (pending, active, completed, error, etc.)
 * - typography: Font families, sizes, weights, line heights
 * - glass: Glassmorphism-specific tokens
 * - editorial: Editorial theme tokens
 */

// Re-export all token modules
export * from './colors';
export * from './spacing';
export * from './radius';
export * from './elevation';
export * from './motion';
export * from './status';
export * from './typography';
export * from './glass';
export * from './editorial';
export * from './themes';

// Theme types
export type ThemeMode = 'glass' | 'editorial' | 'brutalist';
export type ColorScheme = 'light' | 'dark';

// Semantic color token type
export interface SemanticColorTokens {
  // Background roles
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    overlay: string;
  };
  // Surface roles
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    raised: string;
    sunken: string;
  };
  // Border roles
  border: {
    primary: string;
    secondary: string;
    tertiary: string;
    focus: string;
    error: string;
  };
  // Text roles
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
    link: string;
    linkHover: string;
  };
  // Interactive roles
  interactive: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryDisabled: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    secondaryDisabled: string;
    accent: string;
    accentHover: string;
    accentActive: string;
    accentDisabled: string;
  };
  // Status roles (color.role.state)
  status: {
    success: { bg: string; text: string; border: string; icon: string };
    warning: { bg: string; text: string; border: string; icon: string };
    error: { bg: string; text: string; border: string; icon: string };
    info: { bg: string; text: string; border: string; icon: string };
    pending: { bg: string; text: string; border: string; icon: string };
    active: { bg: string; text: string; border: string; icon: string };
    completed: { bg: string; text: string; border: string; icon: string };
    neutral: { bg: string; text: string; border: string; icon: string };
  };
  // Brand roles
  brand: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
  };
  // Gradient roles
  gradient: {
    primary: string;
    secondary: string;
    accent: string;
    mesh: string;
  };
}

// Complete token set for a theme
export interface ThemeTokens {
  colors: SemanticColorTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  elevation: ElevationTokens;
  motion: MotionTokens;
  status: StatusTokens;
  typography: TypographyTokens;
  glass: GlassTokens;
  editorial: EditorialTokens;
}

// Utility type for CSS variable generation
export type CSSVariableMap = Record<string, string>;

// Helper to generate CSS custom properties from tokens
export function generateCSSVariables(tokens: ThemeTokens, prefix = 'ag'): CSSVariableMap {
  const vars: CSSVariableMap = {};

  // Colors
  Object.entries(tokens.colors.background).forEach(([key, value]) => {
    vars[`--${prefix}-color-background-${key}`] = value;
  });
  Object.entries(tokens.colors.surface).forEach(([key, value]) => {
    vars[`--${prefix}-color-surface-${key}`] = value;
  });
  Object.entries(tokens.colors.border).forEach(([key, value]) => {
    vars[`--${prefix}-color-border-${key}`] = value;
  });
  Object.entries(tokens.colors.text).forEach(([key, value]) => {
    vars[`--${prefix}-color-text-${key}`] = value;
  });
  Object.entries(tokens.colors.interactive).forEach(([key, value]) => {
    vars[`--${prefix}-color-interactive-${key}`] = value;
  });
  Object.entries(tokens.colors.status).forEach(([status, colors]) => {
    Object.entries(colors).forEach(([role, value]) => {
      vars[`--${prefix}-color-status-${status}-${role}`] = value;
    });
  });
  Object.entries(tokens.colors.brand).forEach(([key, value]) => {
    vars[`--${prefix}-color-brand-${key}`] = value;
  });
  Object.entries(tokens.colors.gradient).forEach(([key, value]) => {
    vars[`--${prefix}-color-gradient-${key}`] = value;
  });

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    vars[`--${prefix}-spacing-${key}`] = value;
  });

  // Radius
  Object.entries(tokens.radius).forEach(([key, value]) => {
    vars[`--${prefix}-radius-${key}`] = value;
  });

  // Elevation
  Object.entries(tokens.elevation).forEach(([key, value]) => {
    vars[`--${prefix}-elevation-${key}`] = value;
  });

  // Motion
  Object.entries(tokens.motion).forEach(([key, value]) => {
    vars[`--${prefix}-motion-${key}`] = value;
  });

  // Typography
  Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
    vars[`--${prefix}-font-${key}`] = value;
  });
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    vars[`--${prefix}-text-${key}`] = value;
  });
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    vars[`--${prefix}-font-weight-${key}`] = value;
  });
  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    vars[`--${prefix}-leading-${key}`] = value;
  });

  // Glass
  Object.entries(tokens.glass).forEach(([key, value]) => {
    vars[`--${prefix}-glass-${key}`] = value;
  });

  // Editorial
  Object.entries(tokens.editorial).forEach(([key, value]) => {
    vars[`--${prefix}-editorial-${key}`] = value;
  });

  return vars;
}

// Helper to inject CSS variables into document
export function applyCSSVariables(tokens: ThemeTokens, prefix = 'ag'): void {
  if (typeof document === 'undefined') return;
  const vars = generateCSSVariables(tokens, prefix);
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}