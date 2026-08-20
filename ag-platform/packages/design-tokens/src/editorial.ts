/**
 * Editorial Tokens — Editorial theme design tokens
 *
 * Contains all tokens specific to the editorial theme including
 * the three variants: default (light), blueprint (dark), and brutalist.
 */

export const editorial = {
  // Color palette for each variant
  palette: {
    // Default editorial (light, warm)
    default: {
      background: {
        primary: '#f5f1e8',      // --bg
        secondary: '#fbf8f0',    // --paper
        tertiary: '#f0ead9',     // --paper-2
        inverse: '#1a1f2e',      // --ink
        overlay: 'rgba(26, 31, 46, 0.7)',
      },
      text: {
        primary: '#1a1f2e',      // --ink
        secondary: '#2a3142',    // --ink-2
        tertiary: '#6b6557',     // --muted
        inverse: '#f5f1e8',
        disabled: '#c9bf9a',
        link: '#9a6b1e',         // --accent
        linkHover: '#ca8a04',
      },
      border: {
        primary: 'rgba(26, 31, 46, 0.12)',  // --line
        secondary: 'rgba(26, 31, 46, 0.25)', // --line-strong
        tertiary: 'rgba(26, 31, 46, 0.06)',
        focus: '#9a6b1e',
        error: '#a8392b',
      },
      brand: {
        primary: '#9a6b1e',      // --accent (deep gold)
        primaryLight: '#c79a4a',  // --accent-soft
        primaryDark: '#7a4a11',
        secondary: '#3a5b8a',     // --blue
        secondaryLight: '#4a6fc8',
        secondaryDark: '#2a4a7a',
        accent: '#ca8a04',        // --gold-600
        accentLight: '#eab308',
        accentDark: '#a16207',
      },
      status: {
        success: { bg: 'rgba(61, 122, 74, 0.12)', text: '#3d7a4a', border: 'rgba(61, 122, 74, 0.25)', icon: '#3d7a4a' },
        warning: { bg: 'rgba(168, 57, 43, 0.1)', text: '#a8392b', border: 'rgba(168, 57, 43, 0.2)', icon: '#a8392b' },
        error: { bg: 'rgba(168, 57, 43, 0.1)', text: '#a8392b', border: 'rgba(168, 57, 43, 0.2)', icon: '#a8392b' },
        info: { bg: 'rgba(58, 91, 138, 0.1)', text: '#3a5b8a', border: 'rgba(58, 91, 138, 0.2)', icon: '#3a5b8a' },
        pending: { bg: 'rgba(168, 57, 43, 0.1)', text: '#a8392b', border: 'rgba(168, 57, 43, 0.2)', icon: '#a8392b' },
        active: { bg: 'rgba(61, 122, 74, 0.12)', text: '#3d7a4a', border: 'rgba(61, 122, 74, 0.25)', icon: '#3d7a4a' },
        completed: { bg: 'rgba(58, 91, 138, 0.1)', text: '#3a5b8a', border: 'rgba(58, 91, 138, 0.2)', icon: '#3a5b8a' },
        neutral: { bg: 'rgba(107, 101, 87, 0.1)', text: '#6b6557', border: 'rgba(107, 101, 87, 0.2)', icon: '#6b6557' },
      },
      gradient: {
        primary: 'radial-gradient(800px 600px at 90% 10%, rgba(154, 107, 30, 0.07), transparent 60%), #f5f1e8',
        secondary: 'linear-gradient(135deg, #9a6b1e 0%, #3a5b8a 100%)',
        accent: 'linear-gradient(135deg, #ca8a04 0%, #9a6b1e 100%)',
        mesh: 'linear-gradient(rgba(26, 31, 46, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 31, 46, 0.04) 1px, transparent 1px)',
      },
      shadow: {
        card: '0 1px 3px rgba(26, 31, 46, 0.08)',
        cardHover: '0 4px 12px rgba(26, 31, 46, 0.12)',
        button: '0 1px 2px rgba(26, 31, 46, 0.06)',
        buttonHover: '0 2px 8px rgba(154, 107, 30, 0.15)',
        modal: '0 10px 30px rgba(26, 31, 46, 0.15)',
        modalBackdrop: '0 20px 40px rgba(26, 31, 46, 0.3)',
      },
    },

    // Blueprint (dark, tech-forward)
    blueprint: {
      background: {
        primary: '#05070d',
        secondary: '#0a0d1a',
        tertiary: '#111522',
        inverse: '#f1f1f4',
        overlay: 'rgba(5, 7, 13, 0.8)',
      },
      text: {
        primary: '#f1f1f4',
        secondary: '#c8cbd6',
        tertiary: '#7c8295',
        inverse: '#05070d',
        disabled: '#5a6072',
        link: '#9b7eff',
        linkHover: '#b8a0ff',
      },
      border: {
        primary: 'rgba(120, 160, 220, 0.10)',
        secondary: 'rgba(120, 160, 220, 0.20)',
        tertiary: 'rgba(120, 160, 220, 0.05)',
        focus: '#5b8def',
        error: '#ef4444',
      },
      brand: {
        primary: '#d4a017',
        primaryLight: '#e0b843',
        primaryDark: '#a88012',
        secondary: '#5b8def',
        secondaryLight: '#7a9eff',
        secondaryDark: '#4a7bd9',
        accent: '#9b7eff',
        accentLight: '#b8a0ff',
        accentDark: '#7a5ce6',
      },
      status: {
        success: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', icon: '#22c55e' },
        warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b' },
        error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', icon: '#ef4444' },
        info: { bg: 'rgba(91, 141, 239, 0.15)', text: '#93c5fd', border: 'rgba(91, 141, 239, 0.3)', icon: '#5b8def' },
        pending: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b' },
        active: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)', icon: '#22c55e' },
        completed: { bg: 'rgba(91, 141, 239, 0.15)', text: '#93c5fd', border: 'rgba(91, 141, 239, 0.3)', icon: '#5b8def' },
        neutral: { bg: 'rgba(124, 130, 149, 0.15)', text: '#9ca3af', border: 'rgba(124, 130, 149, 0.3)', icon: '#7c8295' },
      },
      gradient: {
        primary: 'radial-gradient(1200px 700px at 80% -10%, rgba(155, 126, 255, 0.10), transparent 60%), radial-gradient(900px 600px at 0% 10%, rgba(91, 141, 239, 0.10), transparent 60%), #05070d',
        secondary: 'linear-gradient(135deg, #5b8def 0%, #9b7eff 100%)',
        accent: 'linear-gradient(135deg, #d4a017 0%, #5b8def 100%)',
        mesh: 'radial-gradient(at 40% 20%, hsla(270, 60%, 60%, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(220, 60%, 50%, 0.1) 0px, transparent 50%)',
      },
      shadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.3)',
        cardHover: '0 4px 16px rgba(0, 0, 0, 0.4)',
        button: '0 1px 3px rgba(0, 0, 0, 0.2)',
        buttonHover: '0 2px 8px rgba(91, 141, 239, 0.2)',
        modal: '0 12px 32px rgba(0, 0, 0, 0.4)',
        modalBackdrop: '0 20px 40px rgba(0, 0, 0, 0.5)',
      },
    },

    // Brutalist (high-contrast mono)
    brutalist: {
      background: {
        primary: '#f4f4ec',
        secondary: '#efefe5',
        tertiary: '#e4e4d8',
        inverse: '#0a0a0a',
        overlay: 'rgba(10, 10, 10, 0.7)',
      },
      text: {
        primary: '#0a0a0a',
        secondary: '#2a2a2a',
        tertiary: '#666666',
        inverse: '#ffffff',
        disabled: '#a3a3a3',
        link: '#0a0a0a',
        linkHover: '#2a2a2a',
      },
      border: {
        primary: '#0a0a0a',
        secondary: '#0a0a0a',
        tertiary: '#262626',
        focus: '#0a0a0a',
        error: '#cc2a1a',
      },
      brand: {
        primary: '#e9ff32',
        primaryLight: '#f0ff66',
        primaryDark: '#ca8a04',
        secondary: '#0a0a0a',
        secondaryLight: '#262626',
        secondaryDark: '#0a0a0a',
        accent: '#ff4d2e',
        accentLight: '#fb923c',
        accentDark: '#c2410c',
      },
      status: {
        success: { bg: 'rgba(42, 122, 58, 0.12)', text: '#2a7a3a', border: '#2a7a3a', icon: '#2a7a3a' },
        warning: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: '#eab308', icon: '#eab308' },
        error: { bg: 'rgba(204, 42, 26, 0.15)', text: '#cc2a1a', border: '#cc2a1a', icon: '#cc2a1a' },
        info: { bg: 'rgba(42, 74, 122, 0.12)', text: '#2a4a7a', border: '#2a4a7a', icon: '#2a4a7a' },
        pending: { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: '#eab308', icon: '#eab308' },
        active: { bg: 'rgba(42, 122, 58, 0.12)', text: '#2a7a3a', border: '#2a7a3a', icon: '#2a7a3a' },
        completed: { bg: 'rgba(42, 74, 122, 0.12)', text: '#2a4a7a', border: '#2a4a7a', icon: '#2a4a7a' },
        neutral: { bg: 'rgba(102, 102, 102, 0.12)', text: '#666666', border: '#666666', icon: '#666666' },
      },
      gradient: {
        primary: 'linear-gradient(135deg, #e9ff32 0%, #0a0a0a 100%)',
        secondary: 'linear-gradient(135deg, #0a0a0a 0%, #e9ff32 100%)',
        accent: 'linear-gradient(135deg, #ff4d2e 0%, #e9ff32 100%)',
        mesh: 'none',
      },
      shadow: {
        card: '4px 4px 0 #0a0a0a',
        cardHover: '6px 6px 0 #0a0a0a',
        button: '3px 3px 0 #0a0a0a',
        buttonHover: '4px 4px 0 #0a0a0a',
        modal: '6px 6px 0 #0a0a0a',
        modalBackdrop: '8px 8px 0 #0a0a0a',
      },
    },
  },

  // Typography per variant
  typography: {
    default: {
      fontFamily: {
        sans: "'IBM Plex Sans', system-ui, sans-serif",
        serif: "'Fraunces', serif",
        mono: "'IBM Plex Mono', monospace",
      },
      fontSize: {
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
    },
    blueprint: {
      fontFamily: {
        sans: "'IBM Plex Sans', system-ui, sans-serif",
        serif: "'Fraunces', serif",
        mono: "'IBM Plex Mono', monospace",
      },
      fontSize: {
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
    },
    brutalist: {
      fontFamily: {
        sans: "'JetBrains Mono', ui-monospace, monospace",
        serif: "'JetBrains Mono', ui-monospace, monospace",
        mono: "'JetBrains Mono', ui-monospace, monospace",
      },
      fontSize: {
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
      },
    },
  },

  // Spacing (consistent across variants)
  spacing: {
    container: '1280px',
    containerPadding: '2rem',
    containerPaddingMobile: '1.25rem',
    sectionGap: '4rem',
    componentGap: '1.5rem',
  },

  // Border radius per variant
  borderRadius: {
    default: {
      sm: '4px',
      md: '6px',
      lg: '12px',
      full: '999px',
    },
    blueprint: {
      sm: '4px',
      md: '6px',
      lg: '12px',
      full: '999px',
    },
    brutalist: {
      sm: '0',
      md: '0',
      lg: '2px',
      full: '4px',
    },
  },

  // Transitions per variant
  transitions: {
    default: {
      fast: '0.15s',
      base: '0.2s',
      slow: '0.55s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    blueprint: {
      fast: '0.15s',
      base: '0.2s',
      slow: '0.55s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    brutalist: {
      fast: '0.05s',
      base: '0.1s',
      slow: '0.2s',
    },
  },

  // Animations (keyframes)
  animations: {
    rise: 'ag-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
    riseLg: 'ag-rise-lg 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
    fade: 'ag-fade 0.55s ease both',
    pulseDot: 'ag-pulse-dot 1.5s ease-in-out infinite',
    drawLine: 'ag-draw-line 0.6s ease-out forwards',
  },

  // Component tokens per variant
  components: {
    default: {
      card: {
        background: '#fbf8f0',
        border: 'rgba(26, 31, 46, 0.12)',
        borderRadius: '6px',
        padding: '1.5rem',
        shadow: '0 1px 3px rgba(26, 31, 46, 0.08)',
      },
      button: {
        primary: {
          background: '#9a6b1e',
          color: '#ffffff',
          border: 'none',
          hoverBackground: '#ca8a04',
        },
        secondary: {
          background: 'transparent',
          color: '#1a1f2e',
          border: '1px solid rgba(26, 31, 46, 0.25)',
          hoverBackground: 'rgba(154, 107, 30, 0.06)',
        },
        ghost: {
          background: 'transparent',
          color: '#6b6557',
          border: 'none',
          hoverBackground: 'rgba(26, 31, 46, 0.04)',
        },
      },
      input: {
        background: '#fbf8f0',
        border: 'rgba(26, 31, 46, 0.12)',
        borderFocus: '#9a6b1e',
        color: '#1a1f2e',
        placeholder: '#6b6557',
        borderRadius: '6px',
      },
      badge: {
        default: 'rgba(26, 31, 46, 0.05)',
        success: 'rgba(61, 122, 74, 0.12)',
        warning: 'rgba(168, 57, 43, 0.1)',
        danger: 'rgba(168, 57, 43, 0.1)',
        info: 'rgba(58, 91, 138, 0.1)',
      },
      modal: {
        background: '#fbf8f0',
        border: 'rgba(26, 31, 46, 0.12)',
        borderRadius: '12px',
        shadow: '0 10px 30px rgba(26, 31, 46, 0.15)',
      },
    },
    blueprint: {
      card: {
        background: 'rgba(91, 141, 239, 0.05)',
        border: 'rgba(120, 160, 220, 0.10)',
        borderRadius: '6px',
        padding: '1.5rem',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      button: {
        primary: {
          background: '#5b8def',
          color: '#ffffff',
          border: 'none',
          hoverBackground: '#7a9eff',
        },
        secondary: {
          background: 'transparent',
          color: '#f1f1f4',
          border: '1px solid rgba(120, 160, 220, 0.20)',
          hoverBackground: 'rgba(91, 141, 239, 0.1)',
        },
        ghost: {
          background: 'transparent',
          color: '#c8cbd6',
          border: 'none',
          hoverBackground: 'rgba(120, 160, 220, 0.05)',
        },
      },
      input: {
        background: 'rgba(91, 141, 239, 0.05)',
        border: 'rgba(120, 160, 220, 0.10)',
        borderFocus: '#5b8def',
        color: '#f1f1f4',
        placeholder: '#7c8295',
        borderRadius: '6px',
      },
      badge: {
        default: 'rgba(120, 160, 220, 0.05)',
        success: 'rgba(34, 197, 94, 0.15)',
        warning: 'rgba(245, 158, 11, 0.15)',
        danger: 'rgba(239, 68, 68, 0.15)',
        info: 'rgba(91, 141, 239, 0.15)',
      },
      modal: {
        background: 'rgba(91, 141, 239, 0.05)',
        border: 'rgba(120, 160, 220, 0.10)',
        borderRadius: '12px',
        shadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
      },
    },
    brutalist: {
      card: {
        background: '#efefe5',
        border: '#0a0a0a',
        borderRadius: '0',
        padding: '1.5rem',
        shadow: '4px 4px 0 #0a0a0a',
      },
      button: {
        primary: {
          background: '#0a0a0a',
          color: '#ffffff',
          border: '2px solid #0a0a0a',
          hoverBackground: '#ffffff',
          hoverColor: '#0a0a0a',
        },
        secondary: {
          background: '#e9ff32',
          color: '#0a0a0a',
          border: '2px solid #0a0a0a',
          hoverBackground: '#ffffff',
        },
        ghost: {
          background: 'transparent',
          color: '#0a0a0a',
          border: '2px solid #0a0a0a',
          hoverBackground: '#0a0a0a',
          hoverColor: '#ffffff',
        },
      },
      input: {
        background: '#efefe5',
        border: '#0a0a0a',
        borderFocus: '#0a0a0a',
        color: '#0a0a0a',
        placeholder: '#666666',
        borderRadius: '0',
      },
      badge: {
        default: '#e4e4d8',
        success: '#2a7a3a',
        warning: '#eab308',
        danger: '#cc2a1a',
        info: '#2a4a7a',
      },
      modal: {
        background: '#efefe5',
        border: '#0a0a0a',
        borderRadius: '0',
        shadow: '6px 6px 0 #0a0a0a',
      },
    },
  },

  // Grid background (for landing pages)
  gridBackground: {
    default: {
      size: '48px',
      color: 'rgba(26, 31, 46, 0.04)',
      mask: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
    },
    blueprint: {
      size: '64px',
      color: 'rgba(91, 141, 239, 0.07)',
      mask: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
    },
    brutalist: {
      enabled: false,
    },
  },

  // Scrollbar styling
  scrollbar: {
    width: '8px',
    track: 'transparent',
    thumb: {
      default: 'rgba(26, 31, 46, 0.15)',
      hover: 'rgba(26, 31, 46, 0.3)',
      blueprint: 'rgba(120, 160, 220, 0.2)',
      blueprintHover: 'rgba(120, 160, 220, 0.4)',
      brutalist: '#0a0a0a',
      brutalistHover: '#0a0a0a',
    },
    borderRadius: '4px',
  },

  // Selection styling
  selection: {
    default: {
      background: '#9a6b1e',
      color: '#ffffff',
    },
    blueprint: {
      background: '#d4a017',
      color: '#ffffff',
    },
    brutalist: {
      background: '#e9ff32',
      color: '#0a0a0a',
    },
  },

  // Focus visible styling
  focusVisible: {
    default: {
      outline: '2px solid #9a6b1e',
      outlineOffset: '2px',
    },
    blueprint: {
      outline: '2px solid #5b8def',
      outlineOffset: '2px',
    },
    brutalist: {
      outline: '2px solid #0a0a0a',
      outlineOffset: '2px',
    },
  },
} as const;

export type EditorialTokens = typeof editorial;

export const editorialTokens: EditorialTokens = editorial;

export type EditorialVariant = keyof typeof editorial.palette;
export type EditorialPaletteKey = keyof typeof editorial.palette.default;