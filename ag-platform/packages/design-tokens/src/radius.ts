/**
 * Border Radius Tokens — Consistent radius scale
 *
 * Provides a unified radius system that works across all themes.
 * Includes both fixed values and semantic aliases.
 */

export const radius = {
  none: '0',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  '4xl': '2rem',    // 32px
  full: '9999px',
} as const;

// Semantic radius aliases for different component types
export const semanticRadius = {
  // Button radii
  button: {
    sm: radius.sm,      // 4px
    md: radius.md,      // 6px
    lg: radius.lg,      // 8px
    xl: radius.xl,      // 12px
    full: radius.full,
  },
  // Input/field radii
  field: {
    sm: radius.sm,      // 4px
    md: radius.md,      // 6px
    lg: radius.lg,      // 8px
    xl: radius.xl,      // 12px
  },
  // Card/panel radii
  card: {
    sm: radius.md,      // 6px
    md: radius.lg,      // 8px
    lg: radius.xl,      // 12px
    xl: radius['2xl'],  // 16px
    '2xl': radius['3xl'], // 24px
  },
  // Modal/dialog radii
  modal: {
    sm: radius.lg,      // 8px
    md: radius.xl,      // 12px
    lg: radius['2xl'],  // 16px
    xl: radius['3xl'],  // 24px
  },
  // Badge/pill radii
  badge: {
    sm: radius.md,      // 6px
    md: radius.lg,      // 8px
    full: radius.full,
  },
  // Image/avatar radii
  image: {
    sm: radius.md,      // 6px
    md: radius.lg,      // 8px
    lg: radius.xl,      // 12px
    full: radius.full,
  },
  // Divider/separator radii
  divider: {
    sm: radius.xs,      // 2px
    md: radius.sm,      // 4px
    full: radius.full,
  },
} as const;

// Theme-specific radius overrides
export const themeRadius = {
  glass: {
    ...semanticRadius,
    // Glass theme uses slightly larger radii for softer feel
    card: {
      sm: radius.lg,      // 8px
      md: radius.xl,      // 12px
      lg: radius['2xl'],  // 16px
      xl: radius['3xl'],  // 24px
      '2xl': radius['4xl'], // 32px
    },
    button: {
      sm: radius.md,      // 6px
      md: radius.lg,      // 8px
      lg: radius.xl,      // 12px
      xl: radius['2xl'],  // 16px
      full: radius.full,
    },
  },
  editorial: {
    ...semanticRadius,
    // Editorial theme uses smaller, sharper radii
    card: {
      sm: radius.sm,      // 4px
      md: radius.md,      // 6px
      lg: radius.lg,      // 8px
      xl: radius.xl,      // 12px
      '2xl': radius['2xl'], // 16px
    },
    button: {
      sm: radius.sm,      // 4px
      md: radius.md,      // 6px
      lg: radius.lg,      // 8px
      xl: radius.xl,      // 12px
      full: radius.full,
    },
  },
  brutalist: {
    ...semanticRadius,
    // Brutalist theme uses minimal radii (sharp corners)
    card: {
      sm: radius.none,    // 0px
      md: radius.none,    // 0px
      lg: radius.xs,      // 2px
      xl: radius.sm,      // 4px
      '2xl': radius.md,   // 6px
    },
    button: {
      sm: radius.none,    // 0px
      md: radius.none,    // 0px
      lg: radius.xs,      // 2px
      xl: radius.sm,      // 4px
      full: radius.sm,    // 4px (not fully round)
    },
    badge: {
      sm: radius.none,
      md: radius.xs,
      full: radius.sm,
    },
  },
} as const;

export type RadiusTokens = typeof radius & {
  button: typeof semanticRadius.button;
  field: typeof semanticRadius.field;
  card: typeof semanticRadius.card;
  modal: typeof semanticRadius.modal;
  badge: typeof semanticRadius.badge;
  image: typeof semanticRadius.image;
  divider: typeof semanticRadius.divider;
  glass: typeof themeRadius.glass;
  editorial: typeof themeRadius.editorial;
  brutalist: typeof themeRadius.brutalist;
};

export const radiusTokens: RadiusTokens = {
  ...radius,
  button: semanticRadius.button,
  field: semanticRadius.field,
  card: semanticRadius.card,
  modal: semanticRadius.modal,
  badge: semanticRadius.badge,
  image: semanticRadius.image,
  divider: semanticRadius.divider,
  glass: themeRadius.glass,
  editorial: themeRadius.editorial,
  brutalist: themeRadius.brutalist,
} as const;

export type RadiusTokenKey = keyof typeof radius;
export type SemanticRadiusCategory = keyof typeof semanticRadius;