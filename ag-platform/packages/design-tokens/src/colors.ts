/**
 * Semantic Color Tokens — color.role.state pattern
 *
 * This module defines all color tokens using a semantic naming convention:
 * - color.role.state (e.g., color.status.success.bg, color.interactive.primary.hover)
 * - Organized by functional role rather than primitive values
 * - Supports both light and dark color schemes
 */

// ============================================
// Primitive Color Values (raw hex/rgb values)
// ============================================

export const primitiveColors = {
  // Glass theme primitives (dark)
  glass: {
    violet: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
      1000: '#000000',
    },
  },

  // Editorial theme primitives (light)
  editorial: {
    cream: {
      50: '#fdfbf5',
      100: '#faf6e8',
      200: '#f5f1e8',
      300: '#f0ead9',
      400: '#e8e1c8',
      500: '#e0d8b8',
      600: '#c9bf9a',
      700: '#a89f7a',
      800: '#8a8262',
      900: '#6b6557',
      950: '#3a372c',
    },
    gold: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
    },
    deepGold: {
      50: '#fdf6e3',
      100: '#fae8b7',
      200: '#f5d685',
      300: '#f0c250',
      400: '#eaaa24',
      500: '#e0930f',
      600: '#c6780e',
      700: '#9a5c0d',
      800: '#7a4a11',
      900: '#633d11',
      950: '#351e05',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    ink: {
      50: '#f0f1f4',
      100: '#e1e3e8',
      200: '#c3c7d0',
      300: '#a5abbd',
      400: '#8890a8',
      500: '#6a7494',
      600: '#4e5980',
      700: '#3a446b',
      800: '#2a3152',
      900: '#1a1f3a',
      950: '#0d1023',
    },
  },

  // Brutalist theme primitives
  brutalist: {
    mono: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
      1000: '#000000',
    },
    yellow: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
      950: '#422006',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
} as const;

// ============================================
// Semantic Color Tokens (color.role.state)
// ============================================

/**
 * Creates semantic color tokens for a given color scheme and theme mode
 */
export function createSemanticColors(
  scheme: 'light' | 'dark',
  mode: 'glass' | 'editorial' | 'brutalist'
): SemanticColorTokens {
  const g = primitiveColors.glass;
  const e = primitiveColors.editorial;
  const b = primitiveColors.brutalist;

  // Glass theme (dark by default)
  if (mode === 'glass') {
    return {
      background: {
        primary: g.neutral[950],        // #0a0a0a
        secondary: g.slate[950],         // #020617
        tertiary: g.slate[900],          // #0f172a
        inverse: g.neutral[50],          // #fafafa
        overlay: 'rgba(2, 6, 23, 0.8)',  // rgba(slate-950, 0.8)
      },
      surface: {
        primary: 'rgba(255, 255, 255, 0.03)',   // glass-bg
        secondary: 'rgba(255, 255, 255, 0.05)', // glass-bg-hover
        tertiary: 'rgba(255, 255, 255, 0.08)',
        raised: 'rgba(10, 10, 30, 0.8)',        // glass-modal
        sunken: 'rgba(255, 255, 255, 0.02)',
      },
      border: {
        primary: 'rgba(255, 255, 255, 0.08)',   // glass-border
        secondary: 'rgba(255, 255, 255, 0.15)', // glass-border-hover
        tertiary: 'rgba(255, 255, 255, 0.05)',
        focus: g.violet[500],                    // #7c3aed
        error: g.red[500],                       // #ef4444
      },
      text: {
        primary: g.neutral[0],                   // #ffffff
        secondary: 'rgba(255, 255, 255, 0.7)',   // text-secondary
        tertiary: 'rgba(255, 255, 255, 0.5)',    // text-muted
        inverse: g.neutral[950],                 // #0a0a0a
        disabled: 'rgba(255, 255, 255, 0.3)',
        link: g.violet[400],                     // #a78bfa
        linkHover: g.violet[300],                // #c4b5fd
      },
      interactive: {
        primary: g.violet[600],                  // #7c3aed
        primaryHover: g.violet[500],             // #8b5cf6
        primaryActive: g.violet[700],            // #6d28d9
        primaryDisabled: 'rgba(124, 58, 237, 0.4)',
        secondary: g.slate[700],                 // #334155
        secondaryHover: g.slate[600],            // #475569
        secondaryActive: g.slate[800],           // #1e293b
        secondaryDisabled: 'rgba(51, 65, 85, 0.4)',
        accent: g.cyan[500],                     // #06b6d4
        accentHover: g.cyan[400],                // #22d3ee
        accentActive: g.cyan[600],               // #0891b2
        accentDisabled: 'rgba(6, 182, 212, 0.4)',
      },
      status: {
        success: {
          bg: 'rgba(16, 185, 129, 0.15)',
          text: g.emerald[400],                  // #34d399
          border: 'rgba(16, 185, 129, 0.3)',
          icon: g.emerald[500],                  // #10b981
        },
        warning: {
          bg: 'rgba(245, 158, 11, 0.15)',
          text: g.amber[400],                    // #fbbf24
          border: 'rgba(245, 158, 11, 0.3)',
          icon: g.amber[500],                    // #f59e0b
        },
        error: {
          bg: 'rgba(239, 68, 68, 0.15)',
          text: g.red[400],                      // #f87171
          border: 'rgba(239, 68, 68, 0.3)',
          icon: g.red[500],                      // #ef4444
        },
        info: {
          bg: 'rgba(59, 130, 246, 0.15)',
          text: g.blue[400],                     // #60a5fa
          border: 'rgba(59, 130, 246, 0.3)',
          icon: g.blue[500],                     // #3b82f6
        },
        pending: {
          bg: 'rgba(245, 158, 11, 0.15)',
          text: g.amber[400],                    // #fbbf24
          border: 'rgba(245, 158, 11, 0.3)',
          icon: g.amber[500],
        },
        active: {
          bg: 'rgba(16, 185, 129, 0.15)',
          text: g.emerald[400],                  // #34d399
          border: 'rgba(16, 185, 129, 0.3)',
          icon: g.emerald[500],
        },
        completed: {
          bg: 'rgba(59, 130, 246, 0.15)',
          text: g.blue[400],                     // #60a5fa
          border: 'rgba(59, 130, 246, 0.3)',
          icon: g.blue[500],
        },
        neutral: {
          bg: 'rgba(148, 163, 184, 0.15)',
          text: g.slate[400],                    // #94a3b8
          border: 'rgba(148, 163, 184, 0.3)',
          icon: g.slate[500],
        },
      },
      brand: {
        primary: g.violet[600],                  // #7c3aed
        primaryLight: g.violet[400],             // #a78bfa
        primaryDark: g.violet[800],              // #5b21b6
        secondary: g.indigo[600],                // #4f46e5
        secondaryLight: g.indigo[400],           // #818cf8
        secondaryDark: g.indigo[800],            // #3730a3
        accent: g.cyan[500],                     // #06b6d4
        accentLight: g.cyan[400],                // #22d3ee
        accentDark: g.cyan[600],                 // #0891b2
      },
      gradient: {
        primary: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
        secondary: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        accent: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
        mesh: 'radial-gradient(at 40% 20%, hsla(250,60%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(200,60%,50%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270,60%,50%,0.1) 0px, transparent 50%)',
      },
    };
  }

  // Editorial theme (light by default)
  if (mode === 'editorial') {
    const isDark = scheme === 'dark';

    if (isDark) {
      // Blueprint variant (dark editorial)
      return {
        background: {
          primary: '#05070d',
          secondary: '#0a0d1a',
          tertiary: '#111522',
          inverse: e.cream[50],
          overlay: 'rgba(5, 7, 13, 0.8)',
        },
        surface: {
          primary: 'rgba(91, 141, 239, 0.05)',
          secondary: 'rgba(91, 141, 239, 0.08)',
          tertiary: 'rgba(155, 126, 255, 0.05)',
          raised: 'rgba(5, 7, 13, 0.9)',
          sunken: 'rgba(91, 141, 239, 0.02)',
        },
        border: {
          primary: 'rgba(120, 160, 220, 0.10)',
          secondary: 'rgba(120, 160, 220, 0.20)',
          tertiary: 'rgba(120, 160, 220, 0.05)',
          focus: '#5b8def',
          error: '#ef4444',
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
        interactive: {
          primary: '#5b8def',
          primaryHover: '#7a9eff',
          primaryActive: '#4a7bd9',
          primaryDisabled: 'rgba(91, 141, 239, 0.4)',
          secondary: '#7c8295',
          secondaryHover: '#9ca3af',
          secondaryActive: '#6b7280',
          secondaryDisabled: 'rgba(124, 130, 149, 0.4)',
          accent: '#d4a017',
          accentHover: '#e0b843',
          accentActive: '#b88c12',
          accentDisabled: 'rgba(212, 160, 23, 0.4)',
        },
        status: {
          success: {
            bg: 'rgba(34, 197, 94, 0.15)',
            text: '#4ade80',
            border: 'rgba(34, 197, 94, 0.3)',
            icon: '#22c55e',
          },
          warning: {
            bg: 'rgba(245, 158, 11, 0.15)',
            text: '#fbbf24',
            border: 'rgba(245, 158, 11, 0.3)',
            icon: '#f59e0b',
          },
          error: {
            bg: 'rgba(239, 68, 68, 0.15)',
            text: '#f87171',
            border: 'rgba(239, 68, 68, 0.3)',
            icon: '#ef4444',
          },
          info: {
            bg: 'rgba(91, 141, 239, 0.15)',
            text: '#93c5fd',
            border: 'rgba(91, 141, 239, 0.3)',
            icon: '#5b8def',
          },
          pending: {
            bg: 'rgba(245, 158, 11, 0.15)',
            text: '#fbbf24',
            border: 'rgba(245, 158, 11, 0.3)',
            icon: '#f59e0b',
          },
          active: {
            bg: 'rgba(34, 197, 94, 0.15)',
            text: '#4ade80',
            border: 'rgba(34, 197, 94, 0.3)',
            icon: '#22c55e',
          },
          completed: {
            bg: 'rgba(91, 141, 239, 0.15)',
            text: '#93c5fd',
            border: 'rgba(91, 141, 239, 0.3)',
            icon: '#5b8def',
          },
          neutral: {
            bg: 'rgba(124, 130, 149, 0.15)',
            text: '#9ca3af',
            border: 'rgba(124, 130, 149, 0.3)',
            icon: '#7c8295',
          },
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
        gradient: {
          primary: 'radial-gradient(1200px 700px at 80% -10%, rgba(155, 126, 255, 0.10), transparent 60%), radial-gradient(900px 600px at 0% 10%, rgba(91, 141, 239, 0.10), transparent 60%), #05070d',
          secondary: 'linear-gradient(135deg, #5b8def 0%, #9b7eff 100%)',
          accent: 'linear-gradient(135deg, #d4a017 0%, #5b8def 100%)',
          mesh: 'radial-gradient(at 40% 20%, hsla(270, 60%, 60%, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(220, 60%, 50%, 0.1) 0px, transparent 50%)',
        },
      };
    }

    // Default editorial (light)
    return {
      background: {
        primary: e.cream[200],        // #f5f1e8
        secondary: e.cream[300],      // #f0ead9
        tertiary: e.cream[100],       // #faf6e8
        inverse: e.ink[900],          // #1a1f2e
        overlay: 'rgba(26, 31, 46, 0.7)',
      },
      surface: {
        primary: e.cream[100],        // #fbf8f0 (paper)
        secondary: e.cream[200],      // #f5f1e8
        tertiary: e.cream[300],       // #f0ead9
        raised: e.cream[50],          // #fdfbf5
        sunken: e.cream[400],         // #e8e1c8
      },
      border: {
        primary: 'rgba(26, 31, 46, 0.12)',   // --line
        secondary: 'rgba(26, 31, 46, 0.25)', // --line-strong
        tertiary: 'rgba(26, 31, 46, 0.06)',
        focus: e.deepGold[700],               // #9a6b1e
        error: e.cream[950],                  // #a8392b
      },
      text: {
        primary: e.ink[900],          // #1a1f2e
        secondary: e.ink[800],        // #2a3142
        tertiary: e.cream[900],       // #6b6557 (muted)
        inverse: e.cream[50],         // #fdfbf5
        disabled: e.cream[600],       // #c9bf9a
        link: e.deepGold[700],        // #9a6b1e
        linkHover: e.deepGold[600],   // #ca8a04
      },
      interactive: {
        primary: e.deepGold[700],     // #9a6b1e
        primaryHover: e.deepGold[600], // #ca8a04
        primaryActive: e.deepGold[800], // #7a4a11
        primaryDisabled: 'rgba(154, 107, 30, 0.4)',
        secondary: e.ink[600],        // #4e5980
        secondaryHover: e.ink[700],   // #3a446b
        secondaryActive: e.ink[800],  // #2a3152
        secondaryDisabled: 'rgba(78, 89, 128, 0.4)',
        accent: e.cream[800],         // #3a5b8a
        accentHover: e.cream[700],    // #4a6fc8
        accentActive: e.cream[900],   // #2a4a7a
        accentDisabled: 'rgba(58, 91, 138, 0.4)',
      },
      status: {
        success: {
          bg: 'rgba(61, 122, 74, 0.12)',
          text: '#3d7a4a',
          border: 'rgba(61, 122, 74, 0.25)',
          icon: '#3d7a4a',
        },
        warning: {
          bg: 'rgba(168, 57, 43, 0.1)',
          text: '#a8392b',
          border: 'rgba(168, 57, 43, 0.2)',
          icon: '#a8392b',
        },
        error: {
          bg: 'rgba(168, 57, 43, 0.1)',
          text: '#a8392b',
          border: 'rgba(168, 57, 43, 0.2)',
          icon: '#a8392b',
        },
        info: {
          bg: 'rgba(58, 91, 138, 0.1)',
          text: '#3a5b8a',
          border: 'rgba(58, 91, 138, 0.2)',
          icon: '#3a5b8a',
        },
        pending: {
          bg: 'rgba(168, 57, 43, 0.1)',
          text: '#a8392b',
          border: 'rgba(168, 57, 43, 0.2)',
          icon: '#a8392b',
        },
        active: {
          bg: 'rgba(61, 122, 74, 0.12)',
          text: '#3d7a4a',
          border: 'rgba(61, 122, 74, 0.25)',
          icon: '#3d7a4a',
        },
        completed: {
          bg: 'rgba(58, 91, 138, 0.1)',
          text: '#3a5b8a',
          border: 'rgba(58, 91, 138, 0.2)',
          icon: '#3a5b8a',
        },
        neutral: {
          bg: 'rgba(107, 101, 87, 0.1)',
          text: '#6b6557',
          border: 'rgba(107, 101, 87, 0.2)',
          icon: '#6b6557',
        },
      },
      brand: {
        primary: e.deepGold[700],     // #9a6b1e
        primaryLight: e.deepGold[500], // #e0930f
        primaryDark: e.deepGold[800],  // #7a4a11
        secondary: e.cream[800],       // #3a5b8a
        secondaryLight: e.cream[700],  // #4a6fc8
        secondaryDark: e.cream[900],   // #2a4a7a
        accent: e.gold[600],           // #ca8a04
        accentLight: e.gold[500],      // #eab308
        accentDark: e.gold[700],       // #a16207
      },
      gradient: {
        primary: 'radial-gradient(800px 600px at 90% 10%, rgba(154, 107, 30, 0.07), transparent 60%), #f5f1e8',
        secondary: 'linear-gradient(135deg, #9a6b1e 0%, #3a5b8a 100%)',
        accent: 'linear-gradient(135deg, #ca8a04 0%, #9a6b1e 100%)',
        mesh: 'linear-gradient(rgba(26, 31, 46, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26, 31, 46, 0.04) 1px, transparent 1px)',
      },
    };
  }

  // Brutalist theme
  return {
    background: {
      primary: b.mono[100],      // #f4f4ec
      secondary: b.mono[200],    // #efefe5
      tertiary: b.mono[300],     // #e4e4d8
      inverse: b.mono[950],      // #0a0a0a
      overlay: 'rgba(10, 10, 10, 0.7)',
    },
    surface: {
      primary: b.mono[100],      // #efefe5 (paper)
      secondary: b.mono[200],    // #e4e4d8 (paper-2)
      tertiary: b.mono[300],
      raised: b.mono[50],
      sunken: b.mono[400],
    },
    border: {
      primary: b.mono[1000],     // #0a0a0a
      secondary: b.mono[1000],   // #0a0a0a
      tertiary: b.mono[900],
      focus: b.mono[1000],
      error: b.red[700],
    },
    text: {
      primary: b.mono[1000],     // #0a0a0a
      secondary: b.mono[800],    // #2a2a2a
      tertiary: b.mono[600],     // #666666
      inverse: b.mono[0],        // #ffffff
      disabled: b.mono[500],
      link: b.mono[1000],
      linkHover: b.mono[800],
    },
    interactive: {
      primary: b.mono[1000],     // #0a0a0a
      primaryHover: b.mono[900],
      primaryActive: b.mono[1000],
      primaryDisabled: 'rgba(10, 10, 10, 0.4)',
      secondary: b.yellow[500],  // #eab308
      secondaryHover: b.yellow[400],
      secondaryActive: b.yellow[600],
      secondaryDisabled: 'rgba(234, 179, 8, 0.4)',
      accent: b.red[700],        // #cc2a1a
      accentHover: b.red[600],
      accentActive: b.red[800],
      accentDisabled: 'rgba(204, 42, 26, 0.4)',
    },
    status: {
      success: {
        bg: 'rgba(42, 122, 58, 0.12)',
        text: '#2a7a3a',
        border: '#2a7a3a',
        icon: '#2a7a3a',
      },
      warning: {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: '#eab308',
        border: '#eab308',
        icon: '#eab308',
      },
      error: {
        bg: 'rgba(204, 42, 26, 0.15)',
        text: '#cc2a1a',
        border: '#cc2a1a',
        icon: '#cc2a1a',
      },
      info: {
        bg: 'rgba(42, 74, 122, 0.12)',
        text: '#2a4a7a',
        border: '#2a4a7a',
        icon: '#2a4a7a',
      },
      pending: {
        bg: 'rgba(234, 179, 8, 0.15)',
        text: '#eab308',
        border: '#eab308',
        icon: '#eab308',
      },
      active: {
        bg: 'rgba(42, 122, 58, 0.12)',
        text: '#2a7a3a',
        border: '#2a7a3a',
        icon: '#2a7a3a',
      },
      completed: {
        bg: 'rgba(42, 74, 122, 0.12)',
        text: '#2a4a7a',
        border: '#2a4a7a',
        icon: '#2a4a7a',
      },
      neutral: {
        bg: 'rgba(102, 102, 102, 0.12)',
        text: '#666666',
        border: '#666666',
        icon: '#666666',
      },
    },
    brand: {
      primary: b.yellow[500],    // #e9ff32
      primaryLight: b.yellow[400],
      primaryDark: b.yellow[600],
      secondary: b.mono[1000],
      secondaryLight: b.mono[900],
      secondaryDark: b.mono[1000],
      accent: b.orange[500],     // #ff4d2e
      accentLight: b.orange[400],
      accentDark: b.orange[600],
    },
    gradient: {
      primary: 'linear-gradient(135deg, #e9ff32 0%, #0a0a0a 100%)',
      secondary: 'linear-gradient(135deg, #0a0a0a 0%, #e9ff32 100%)',
      accent: 'linear-gradient(135deg, #ff4d2e 0%, #e9ff32 100%)',
      mesh: 'none',
    },
  };
}

// Export type
export type SemanticColorTokens = ReturnType<typeof createSemanticColors>;