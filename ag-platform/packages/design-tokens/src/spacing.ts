/**
 * Spacing Tokens — Consistent spacing scale
 *
 * Based on a 4px (0.25rem) base unit with semantic naming.
 * Supports both rem and px values for flexibility.
 */

export const spacing = {
  // Base unit: 4px = 0.25rem
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
  36: '9rem',     // 144px
  40: '10rem',    // 160px
  44: '11rem',    // 176px
  48: '12rem',    // 192px
  52: '13rem',    // 208px
  56: '14rem',    // 224px
  60: '15rem',    // 240px
  64: '16rem',    // 256px
  72: '18rem',    // 288px
  80: '20rem',    // 320px
  96: '24rem',    // 384px
} as const;

// Semantic spacing aliases
export const semanticSpacing = {
  // Component internal spacing
  inset: {
    none: spacing[0],
    xs: spacing[1],      // 4px
    sm: spacing[2],      // 8px
    md: spacing[3],      // 12px
    lg: spacing[4],      // 16px
    xl: spacing[5],      // 20px
    '2xl': spacing[6],   // 24px
    '3xl': spacing[8],   // 32px
  },
  // Component gap spacing
  gap: {
    none: spacing[0],
    xs: spacing[1],      // 4px
    sm: spacing[2],      // 8px
    md: spacing[3],      // 12px
    lg: spacing[4],      // 16px
    xl: spacing[6],      // 24px
    '2xl': spacing[8],   // 32px
  },
  // Layout spacing
  layout: {
    xs: spacing[2],      // 8px
    sm: spacing[3],      // 12px
    md: spacing[4],      // 16px
    lg: spacing[6],      // 24px
    xl: spacing[8],      // 32px
    '2xl': spacing[12],  // 48px
    '3xl': spacing[16],  // 64px
    '4xl': spacing[24],  // 96px
  },
  // Section spacing
  section: {
    sm: spacing[8],      // 32px
    md: spacing[12],     // 48px
    lg: spacing[16],     // 64px
    xl: spacing[24],     // 96px
    '2xl': spacing[32],  // 128px
  },
  // Container max-widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  },
} as const;

// Fluid spacing using clamp() for responsive design
export const fluidSpacing = {
  // Responsive padding that scales with viewport
  section: 'clamp(2rem, 5vw, 6rem)',      // 32px - 96px
  container: 'clamp(1rem, 3vw, 3rem)',     // 16px - 48px
  component: 'clamp(0.5rem, 2vw, 1.5rem)', // 8px - 24px
  inline: 'clamp(0.25rem, 1vw, 1rem)',     // 4px - 16px
} as const;

export type SpacingTokens = typeof spacing & {
  inset: typeof semanticSpacing.inset;
  gap: typeof semanticSpacing.gap;
  layout: typeof semanticSpacing.layout;
  section: typeof semanticSpacing.section;
  container: typeof semanticSpacing.container;
  fluid: typeof fluidSpacing;
};

// Combined export for convenience
export const spacingTokens: SpacingTokens = {
  ...spacing,
  inset: semanticSpacing.inset,
  gap: semanticSpacing.gap,
  layout: semanticSpacing.layout,
  section: semanticSpacing.section,
  container: semanticSpacing.container,
  fluid: fluidSpacing,
} as const;

export type SpacingTokenKey = keyof typeof spacing;
export type SemanticSpacingKey = keyof typeof semanticSpacing;