/**
 * Elevation Tokens — Shadow and depth system
 *
 * Provides a consistent elevation/depth system using box-shadows.
 * Includes both standard elevations and glassmorphism-specific shadows.
 */

// Base shadow primitives
const shadowPrimitives = {
  // Standard Material-style shadows
  level0: 'none',
  level1: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  level2: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  level3: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  level4: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  level5: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  level6: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Colored shadows (brand-aware)
  brand: {
    sm: '0 2px 8px rgba(124, 58, 237, 0.15)',
    md: '0 4px 16px rgba(124, 58, 237, 0.2)',
    lg: '0 8px 24px rgba(124, 58, 237, 0.25)',
    xl: '0 12px 32px rgba(124, 58, 237, 0.3)',
  },

  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
    md: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: 'inset 0 4px 8px rgba(0, 0, 0, 0.15)',
  },

  // Focus rings
  focus: {
    sm: '0 0 0 2px rgba(124, 58, 237, 0.3)',
    md: '0 0 0 3px rgba(124, 58, 237, 0.3)',
    lg: '0 0 0 4px rgba(124, 58, 237, 0.3)',
  },

  // Error focus rings
  focusError: {
    sm: '0 0 0 2px rgba(239, 68, 68, 0.3)',
    md: '0 0 0 3px rgba(239, 68, 68, 0.3)',
    lg: '0 0 0 4px rgba(239, 68, 68, 0.3)',
  },
} as const;

// Standard elevation levels (0-5)
export const elevation = {
  // No elevation
  none: shadowPrimitives.level0,
  // Subtle - for cards, panels at rest
  subtle: shadowPrimitives.level1,
  // Low - for hover states, dropdowns
  low: shadowPrimitives.level2,
  // Medium - for raised cards, modals
  medium: shadowPrimitives.level3,
  // High - for modals, drawers, popovers
  high: shadowPrimitives.level4,
  // Maximum - for toasts, critical overlays
  maximum: shadowPrimitives.level5,
  // Overlay - for full-screen modals
  overlay: shadowPrimitives.level6,
} as const;

// Semantic elevation for specific component types
export const semanticElevation = {
  // Card elevations
  card: {
    rest: shadowPrimitives.level1,
    hover: shadowPrimitives.level3,
    active: shadowPrimitives.level2,
    dragged: shadowPrimitives.level5,
  },
  // Button elevations
  button: {
    rest: shadowPrimitives.level1,
    hover: '0 4px 12px rgba(0, 0, 0, 0.15)',
    active: shadowPrimitives.level1,
    disabled: shadowPrimitives.level0,
  },
  // Modal elevations
  modal: {
    backdrop: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    content: shadowPrimitives.level5,
    nested: shadowPrimitives.level4,
  },
  // Dropdown/popover elevations
  popover: {
    sm: shadowPrimitives.level3,
    md: shadowPrimitives.level4,
    lg: shadowPrimitives.level5,
  },
  // Navigation elevations
  nav: {
    bar: '0 1px 3px rgba(0, 0, 0, 0.1)',
    drawer: '0 10px 40px rgba(0, 0, 0, 0.2)',
    sticky: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  // Toast/notification elevations
  toast: {
    default: shadowPrimitives.level5,
    error: '0 20px 25px -5px rgba(239, 68, 68, 0.2), 0 8px 10px -6px rgba(239, 68, 68, 0.15)',
    success: '0 20px 25px -5px rgba(16, 185, 129, 0.2), 0 8px 10px -6px rgba(16, 185, 129, 0.15)',
  },
  // Divider elevations (subtle depth)
  divider: {
    subtle: '0 1px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
} as const;

// Glassmorphism-specific elevations
export const glassElevation = {
  // Glass card shadows
  card: {
    rest: '0 8px 32px rgba(0, 0, 0, 0.3)',
    hover: '0 12px 48px rgba(0, 0, 0, 0.4)',
    active: '0 6px 24px rgba(0, 0, 0, 0.35)',
  },
  // Glass button shadows
  button: {
    rest: '0 2px 8px rgba(0, 0, 0, 0.2)',
    hover: '0 8px 24px rgba(124, 58, 237, 0.2)',
    active: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },
  // Glass modal shadows
  modal: {
    backdrop: '0 24px 64px rgba(0, 0, 0, 0.5)',
    content: '0 24px 64px rgba(0, 0, 0, 0.5)',
  },
  // Glass inner glow
  innerGlow: {
    sm: 'inset 0 0 20px rgba(124, 58, 237, 0.1)',
    md: 'inset 0 0 30px rgba(124, 58, 237, 0.15)',
    lg: 'inset 0 0 40px rgba(124, 58, 237, 0.2)',
  },
  // Glass outer glow
  outerGlow: {
    sm: '0 0 20px rgba(124, 58, 237, 0.15)',
    md: '0 0 30px rgba(124, 58, 237, 0.2)',
    lg: '0 0 40px rgba(124, 58, 237, 0.25)',
  },
  // Liquid border glow
  liquidBorder: 'linear-gradient(45deg, #7c3aed, #4f46e5, #06b6d4, #7c3aed, #4f46e5)',
} as const;

// Editorial theme elevations
export const editorialElevation = {
  card: {
    rest: '0 1px 3px rgba(26, 31, 46, 0.08)',
    hover: '0 4px 12px rgba(26, 31, 46, 0.12)',
    active: '0 2px 6px rgba(26, 31, 46, 0.1)',
  },
  button: {
    rest: '0 1px 2px rgba(26, 31, 46, 0.06)',
    hover: '0 2px 8px rgba(154, 107, 30, 0.15)',
    active: '0 1px 3px rgba(26, 31, 46, 0.1)',
  },
  modal: {
    backdrop: '0 20px 40px rgba(26, 31, 46, 0.3)',
    content: '0 10px 30px rgba(26, 31, 46, 0.15)',
  },
  popover: {
    sm: '0 4px 12px rgba(26, 31, 46, 0.1)',
    md: '0 8px 24px rgba(26, 31, 46, 0.12)',
    lg: '0 12px 32px rgba(26, 31, 46, 0.15)',
  },
} as const;

// Brutalist theme elevations (hard shadows)
export const brutalistElevation = {
  card: {
    rest: '4px 4px 0 #0a0a0a',
    hover: '6px 6px 0 #0a0a0a',
    active: '2px 2px 0 #0a0a0a',
  },
  button: {
    rest: '3px 3px 0 #0a0a0a',
    hover: '4px 4px 0 #0a0a0a',
    active: '1px 1px 0 #0a0a0a',
  },
  modal: {
    backdrop: '8px 8px 0 #0a0a0a',
    content: '6px 6px 0 #0a0a0a',
  },
  popover: {
    sm: '4px 4px 0 #0a0a0a',
    md: '6px 6px 0 #0a0a0a',
    lg: '8px 8px 0 #0a0a0a',
  },
} as const;

export type ElevationTokens = typeof elevation & {
  card: typeof semanticElevation.card;
  button: typeof semanticElevation.button;
  modal: typeof semanticElevation.modal;
  popover: typeof semanticElevation.popover;
  nav: typeof semanticElevation.nav;
  toast: typeof semanticElevation.toast;
  divider: typeof semanticElevation.divider;
  glass: typeof glassElevation;
  editorial: typeof editorialElevation;
  brutalist: typeof brutalistElevation;
  focus: typeof shadowPrimitives.focus;
  focusError: typeof shadowPrimitives.focusError;
  inner: typeof shadowPrimitives.inner;
  brand: typeof shadowPrimitives.brand;
};

export const elevationTokens: ElevationTokens = {
  ...elevation,
  card: semanticElevation.card,
  button: semanticElevation.button,
  modal: semanticElevation.modal,
  popover: semanticElevation.popover,
  nav: semanticElevation.nav,
  toast: semanticElevation.toast,
  divider: semanticElevation.divider,
  glass: glassElevation,
  editorial: editorialElevation,
  brutalist: brutalistElevation,
  focus: shadowPrimitives.focus,
  focusError: shadowPrimitives.focusError,
  inner: shadowPrimitives.inner,
  brand: shadowPrimitives.brand,
} as const;

export type ElevationTokenKey = keyof typeof elevation;
export type SemanticElevationCategory = keyof typeof semanticElevation;