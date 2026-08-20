/**
 * Glassmorphism Tokens — Glass-specific design tokens
 *
 * Contains all tokens specific to the glassmorphism theme including
 * blur values, transparency layers, border treatments, and effects.
 */

export const glass = {
  // Blur values
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '40px',
    // Named semantic blurs
    backdrop: '20px',      // Default backdrop blur
    backdropHover: '24px',
    backdropActive: '16px',
    modal: '24px',
    tooltip: '10px',
    nav: '20px',
    card: '20px',
    panel: '20px',
  },

  // Background transparency layers
  background: {
    // Base glass backgrounds
    base: 'rgba(255, 255, 255, 0.03)',
    hover: 'rgba(255, 255, 255, 0.08)',
    active: 'rgba(255, 255, 255, 0.12)',
    disabled: 'rgba(255, 255, 255, 0.02)',
    // Elevated surfaces
    raised: 'rgba(255, 255, 255, 0.05)',
    sunken: 'rgba(255, 255, 255, 0.01)',
    // Modal/overlay backgrounds
    modal: 'rgba(10, 10, 30, 0.8)',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    drawer: 'rgba(10, 10, 30, 0.9)',
    tooltip: 'rgba(10, 10, 30, 0.9)',
    nav: 'rgba(10, 10, 20, 0.6)',
    // Panel/section backgrounds
    panel: 'rgba(255, 255, 255, 0.03)',
    panelHover: 'rgba(255, 255, 255, 0.06)',
  },

  // Border treatments
  border: {
    // Standard glass borders
    base: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.15)',
    active: 'rgba(255, 255, 255, 0.2)',
    focus: 'rgba(124, 58, 237, 0.5)',
    error: 'rgba(239, 68, 68, 0.5)',
    disabled: 'rgba(255, 255, 255, 0.04)',
    // Gradient borders
    gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5, #06b6d4)',
    gradientHover: 'linear-gradient(135deg, #a78bfa, #818cf8, #22d3ee)',
    // Subtle borders
    subtle: 'rgba(255, 255, 255, 0.05)',
    divider: 'rgba(255, 255, 255, 0.06)',
  },

  // Shadow/depth
  shadow: {
    // Card shadows
    card: {
      base: '0 8px 32px rgba(0, 0, 0, 0.3)',
      hover: '0 12px 48px rgba(0, 0, 0, 0.4)',
      active: '0 6px 24px rgba(0, 0, 0, 0.35)',
      focus: '0 0 0 3px rgba(124, 58, 237, 0.3)',
    },
    // Button shadows
    button: {
      base: '0 2px 8px rgba(0, 0, 0, 0.2)',
      hover: '0 8px 24px rgba(124, 58, 237, 0.2)',
      active: '0 2px 8px rgba(0, 0, 0, 0.25)',
      focus: '0 0 0 3px rgba(124, 58, 237, 0.3)',
    },
    // Modal shadows
    modal: {
      base: '0 24px 64px rgba(0, 0, 0, 0.5)',
      nested: '0 16px 48px rgba(0, 0, 0, 0.4)',
    },
    // Dropdown/popover
    popover: {
      base: '0 12px 32px rgba(0, 0, 0, 0.35)',
      large: '0 16px 48px rgba(0, 0, 0, 0.4)',
    },
    // Inner glows
    innerGlow: {
      sm: 'inset 0 0 20px rgba(124, 58, 237, 0.1)',
      md: 'inset 0 0 30px rgba(124, 58, 237, 0.15)',
      lg: 'inset 0 0 40px rgba(124, 58, 237, 0.2)',
    },
    // Outer glows
    outerGlow: {
      sm: '0 0 20px rgba(124, 58, 237, 0.15)',
      md: '0 0 30px rgba(124, 58, 237, 0.2)',
      lg: '0 0 40px rgba(124, 58, 237, 0.25)',
    },
  },

  // Gradients
  gradient: {
    // Primary brand gradient
    primary: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    primaryHover: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    primaryReverse: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    // Accent gradient
    accent: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
    accentHover: 'linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%)',
    // Dark overlay gradient
    dark: 'linear-gradient(180deg, rgba(15, 15, 35, 0.8) 0%, rgba(15, 15, 35, 0.95) 100%)',
    darkHover: 'linear-gradient(180deg, rgba(15, 15, 35, 0.85) 0%, rgba(15, 15, 35, 1) 100%)',
    // Mesh gradient (background atmosphere)
    mesh: 'radial-gradient(at 40% 20%, hsla(250, 60%, 60%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(200, 60%, 50%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270, 60%, 50%, 0.1) 0px, transparent 50%)',
    meshHover: 'radial-gradient(at 40% 20%, hsla(250, 60%, 60%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(200, 60%, 50%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270, 60%, 50%, 0.15) 0px, transparent 50%)',
    // Noise texture overlay
    noise: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
    // Shimmer gradient (loading states)
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
    // Button gradients
    buttonPrimary: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    buttonAccent: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
    buttonGhost: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  },

  // Component-specific token groups
  components: {
    // Card component
    card: {
      background: 'rgba(255, 255, 255, 0.03)',
      backgroundHover: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '1rem',
      borderRadiusHover: '1rem',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      shadowHover: '0 12px 48px rgba(0, 0, 0, 0.4)',
      backdropBlur: '20px',
      padding: '1.5rem',
      gap: '1rem',
    },
    // Button component
    button: {
      background: 'rgba(255, 255, 255, 0.05)',
      backgroundHover: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.15)',
      borderHover: 'rgba(255, 255, 255, 0.25)',
      borderRadius: '0.75rem',
      padding: '0.75rem 1.5rem',
      gap: '0.5rem',
      fontWeight: '500',
      backdropBlur: '20px',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      shadowHover: '0 8px 24px rgba(124, 58, 237, 0.2)',
      transformHover: 'translateY(-2px)',
      transformActive: 'translateY(0)',
    },
    // Input component
    input: {
      background: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
      borderFocus: '#7c3aed',
      borderError: '#ef4444',
      borderRadius: '0.75rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      color: '#ffffff',
      placeholderColor: 'rgba(255, 255, 255, 0.4)',
      backdropBlur: '20px',
      shadowFocus: '0 0 0 3px rgba(124, 58, 237, 0.2)',
      shadowError: '0 0 0 3px rgba(239, 68, 68, 0.2)',
    },
    // Modal component
    modal: {
      background: 'rgba(10, 10, 30, 0.8)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '1.5rem',
      backdropBlur: '24px',
      shadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
      padding: '1.5rem',
      maxWidth: '32rem',
    },
    // Badge component
    badge: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '9999px',
      padding: '0.25rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.8)',
      backdropBlur: '10px',
      gap: '0.25rem',
    },
    // Panel component
    panel: {
      background: 'rgba(255, 255, 255, 0.03)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '1.5rem',
      backdropBlur: '20px',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      padding: '2rem',
    },
    // Tab component
    tab: {
      padding: '0.75rem 1.5rem',
      color: 'rgba(255, 255, 255, 0.6)',
      colorActive: '#ffffff',
      backgroundActive: 'rgba(124, 58, 237, 0.1)',
      borderBottom: '2px solid transparent',
      borderBottomActive: '#7c3aed',
      borderRadius: '0',
      fontWeight: '500',
    },
    // Navigation
    nav: {
      background: 'rgba(10, 10, 20, 0.6)',
      borderBottom: 'rgba(255, 255, 255, 0.08)',
      backdropBlur: '20px',
      linkPadding: '0.5rem 1rem',
      linkBorderRadius: '0.5rem',
      linkColor: 'rgba(255, 255, 255, 0.7)',
      linkColorHover: '#ffffff',
      linkColorActive: '#ffffff',
      linkBackgroundHover: 'rgba(255, 255, 255, 0.05)',
      linkBackgroundActive: 'rgba(124, 58, 237, 0.2)',
    },
    // Tooltip
    tooltip: {
      background: 'rgba(10, 10, 30, 0.9)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      color: '#ffffff',
      backdropBlur: '10px',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: 50,
    },
    // Divider
    divider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
    },
    // Overlay
    overlay: {
      background: 'rgba(10, 10, 30, 0.7)',
      backdropBlur: '10px',
    },
    // Image frame
    imageFrame: {
      padding: '4px',
      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      borderRadius: '0.75rem',
      innerBackground: 'linear-gradient(180deg, rgba(15, 15, 35, 0.8) 0%, rgba(15, 15, 35, 0.95) 100%)',
      innerBorderRadius: '0.5rem',
    },
  },

  // Advanced effects
  effects: {
    // Liquid border animation
    liquidBorder: {
      gradient: 'linear-gradient(45deg, #7c3aed, #4f46e5, #06b6d4, #7c3aed, #4f46e5)',
      backgroundSize: '400% 400%',
      animation: 'liquid-border 12s ease infinite',
      opacity: 0,
      opacityHover: 1,
      transition: 'opacity 200ms ease',
    },
    // Noise texture
    noise: {
      opacity: 0.03,
      blendMode: 'overlay',
    },
    // Inner glow
    innerGlow: {
      sm: 'inset 0 0 20px rgba(124, 58, 237, 0.1)',
      md: 'inset 0 0 30px rgba(124, 58, 237, 0.15)',
      lg: 'inset 0 0 40px rgba(124, 58, 237, 0.2)',
    },
    // Outer glow
    outerGlow: {
      sm: '0 0 20px rgba(124, 58, 237, 0.15)',
      md: '0 0 30px rgba(124, 58, 237, 0.2)',
      lg: '0 0 40px rgba(124, 58, 237, 0.25)',
    },
  },

  // Responsive adjustments
  responsive: {
    mobile: {
      blur: {
        backdrop: '15px',
        card: '15px',
        panel: '15px',
      },
      borderRadius: {
        card: '0.75rem',
        panel: '1rem',
        modal: '1.25rem',
      },
      padding: {
        card: '1rem',
        panel: '1.5rem',
        modal: '1rem',
      },
    },
  },
} as const;

export type GlassTokens = typeof glass;

export const glassTokens: GlassTokens = glass;

export type GlassBlurKey = keyof typeof glass.blur;
export type GlassBackgroundKey = keyof typeof glass.background;
export type GlassBorderKey = keyof typeof glass.border;
export type GlassComponentKey = keyof typeof glass.components;