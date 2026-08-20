/**
 * Tailwind CSS Configuration for @ag/design-tokens
 *
 * This config maps design tokens to Tailwind utilities.
 * Import this in your app's tailwind.config.js to use the design system tokens.
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // This package doesn't have components, but consumers should add their paths
  ],
  theme: {
    extend: {
      // Color palette mapped from design tokens
      colors: {
        // Semantic background colors
        background: {
          primary: 'var(--ag-color-background-primary)',
          secondary: 'var(--ag-color-background-secondary)',
          tertiary: 'var(--ag-color-background-tertiary)',
          inverse: 'var(--ag-color-background-inverse)',
          overlay: 'var(--ag-color-background-overlay)',
        },
        // Semantic surface colors
        surface: {
          primary: 'var(--ag-color-surface-primary)',
          secondary: 'var(--ag-color-surface-secondary)',
          tertiary: 'var(--ag-color-surface-tertiary)',
          raised: 'var(--ag-color-surface-raised)',
          sunken: 'var(--ag-color-surface-sunken)',
        },
        // Semantic border colors
        border: {
          primary: 'var(--ag-color-border-primary)',
          secondary: 'var(--ag-color-border-secondary)',
          tertiary: 'var(--ag-color-border-tertiary)',
          focus: 'var(--ag-color-border-focus)',
          error: 'var(--ag-color-border-error)',
        },
        // Semantic text colors
        text: {
          primary: 'var(--ag-color-text-primary)',
          secondary: 'var(--ag-color-text-secondary)',
          tertiary: 'var(--ag-color-text-tertiary)',
          inverse: 'var(--ag-color-text-inverse)',
          disabled: 'var(--ag-color-text-disabled)',
          link: 'var(--ag-color-text-link)',
          linkHover: 'var(--ag-color-text-link-hover)',
        },
        // Semantic interactive colors
        interactive: {
          primary: 'var(--ag-color-interactive-primary)',
          primaryHover: 'var(--ag-color-interactive-primary-hover)',
          primaryActive: 'var(--ag-color-interactive-primary-active)',
          primaryDisabled: 'var(--ag-color-interactive-primary-disabled)',
          secondary: 'var(--ag-color-interactive-secondary)',
          secondaryHover: 'var(--ag-color-interactive-secondary-hover)',
          secondaryActive: 'var(--ag-color-interactive-secondary-active)',
          secondaryDisabled: 'var(--ag-color-interactive-secondary-disabled)',
          accent: 'var(--ag-color-interactive-accent)',
          accentHover: 'var(--ag-color-interactive-accent-hover)',
          accentActive: 'var(--ag-color-interactive-accent-active)',
          accentDisabled: 'var(--ag-color-interactive-accent-disabled)',
        },
        // Status colors (color.role.state pattern)
        status: {
          success: {
            bg: 'var(--ag-color-status-success-bg)',
            text: 'var(--ag-color-status-success-text)',
            border: 'var(--ag-color-status-success-border)',
            icon: 'var(--ag-color-status-success-icon)',
          },
          warning: {
            bg: 'var(--ag-color-status-warning-bg)',
            text: 'var(--ag-color-status-warning-text)',
            border: 'var(--ag-color-status-warning-border)',
            icon: 'var(--ag-color-status-warning-icon)',
          },
          error: {
            bg: 'var(--ag-color-status-error-bg)',
            text: 'var(--ag-color-status-error-text)',
            border: 'var(--ag-color-status-error-border)',
            icon: 'var(--ag-color-status-error-icon)',
          },
          info: {
            bg: 'var(--ag-color-status-info-bg)',
            text: 'var(--ag-color-status-info-text)',
            border: 'var(--ag-color-status-info-border)',
            icon: 'var(--ag-color-status-info-icon)',
          },
          pending: {
            bg: 'var(--ag-color-status-pending-bg)',
            text: 'var(--ag-color-status-pending-text)',
            border: 'var(--ag-color-status-pending-border)',
            icon: 'var(--ag-color-status-pending-icon)',
          },
          active: {
            bg: 'var(--ag-color-status-active-bg)',
            text: 'var(--ag-color-status-active-text)',
            border: 'var(--ag-color-status-active-border)',
            icon: 'var(--ag-color-status-active-icon)',
          },
          completed: {
            bg: 'var(--ag-color-status-completed-bg)',
            text: 'var(--ag-color-status-completed-text)',
            border: 'var(--ag-color-status-completed-border)',
            icon: 'var(--ag-color-status-completed-icon)',
          },
          neutral: {
            bg: 'var(--ag-color-status-neutral-bg)',
            text: 'var(--ag-color-status-neutral-text)',
            border: 'var(--ag-color-status-neutral-border)',
            icon: 'var(--ag-color-status-neutral-icon)',
          },
        },
        // Brand colors
        brand: {
          primary: 'var(--ag-color-brand-primary)',
          primaryLight: 'var(--ag-color-brand-primary-light)',
          primaryDark: 'var(--ag-color-brand-primary-dark)',
          secondary: 'var(--ag-color-brand-secondary)',
          secondaryLight: 'var(--ag-color-brand-secondary-light)',
          secondaryDark: 'var(--ag-color-brand-secondary-dark)',
          accent: 'var(--ag-color-brand-accent)',
          accentLight: 'var(--ag-color-brand-accent-light)',
          accentDark: 'var(--ag-color-brand-accent-dark)',
        },
        // Gradient colors (for bg-gradient utilities)
        gradient: {
          primary: 'var(--ag-color-gradient-primary)',
          secondary: 'var(--ag-color-gradient-secondary)',
          accent: 'var(--ag-color-gradient-accent)',
          mesh: 'var(--ag-color-gradient-mesh)',
        },
      },

      // Spacing
      spacing: {
        // Base scale (0-96)
        0: 'var(--ag-spacing-0)',
        1: 'var(--ag-spacing-1)',
        2: 'var(--ag-spacing-2)',
        3: 'var(--ag-spacing-3)',
        4: 'var(--ag-spacing-4)',
        5: 'var(--ag-spacing-5)',
        6: 'var(--ag-spacing-6)',
        7: 'var(--ag-spacing-7)',
        8: 'var(--ag-spacing-8)',
        9: 'var(--ag-spacing-9)',
        10: 'var(--ag-spacing-10)',
        11: 'var(--ag-spacing-11)',
        12: 'var(--ag-spacing-12)',
        14: 'var(--ag-spacing-14)',
        16: 'var(--ag-spacing-16)',
        20: 'var(--ag-spacing-20)',
        24: 'var(--ag-spacing-24)',
        28: 'var(--ag-spacing-28)',
        32: 'var(--ag-spacing-32)',
        36: 'var(--ag-spacing-36)',
        40: 'var(--ag-spacing-40)',
        44: 'var(--ag-spacing-44)',
        48: 'var(--ag-spacing-48)',
        52: 'var(--ag-spacing-52)',
        56: 'var(--ag-spacing-56)',
        60: 'var(--ag-spacing-60)',
        64: 'var(--ag-spacing-64)',
        72: 'var(--ag-spacing-72)',
        80: 'var(--ag-spacing-80)',
        96: 'var(--ag-spacing-96)',
        // Semantic spacing
        'inset-xs': 'var(--ag-spacing-inset-xs)',
        'inset-sm': 'var(--ag-spacing-inset-sm)',
        'inset-md': 'var(--ag-spacing-inset-md)',
        'inset-lg': 'var(--ag-spacing-inset-lg)',
        'inset-xl': 'var(--ag-spacing-inset-xl)',
        'inset-2xl': 'var(--ag-spacing-inset-2xl)',
        'inset-3xl': 'var(--ag-spacing-inset-3xl)',
        'gap-xs': 'var(--ag-spacing-gap-xs)',
        'gap-sm': 'var(--ag-spacing-gap-sm)',
        'gap-md': 'var(--ag-spacing-gap-md)',
        'gap-lg': 'var(--ag-spacing-gap-lg)',
        'gap-xl': 'var(--ag-spacing-gap-xl)',
        'gap-2xl': 'var(--ag-spacing-gap-2xl)',
        'layout-xs': 'var(--ag-spacing-layout-xs)',
        'layout-sm': 'var(--ag-spacing-layout-sm)',
        'layout-md': 'var(--ag-spacing-layout-md)',
        'layout-lg': 'var(--ag-spacing-layout-lg)',
        'layout-xl': 'var(--ag-spacing-layout-xl)',
        'layout-2xl': 'var(--ag-spacing-layout-2xl)',
        'layout-3xl': 'var(--ag-spacing-layout-3xl)',
        'layout-4xl': 'var(--ag-spacing-layout-4xl)',
        'section-sm': 'var(--ag-spacing-section-sm)',
        'section-md': 'var(--ag-spacing-section-md)',
        'section-lg': 'var(--ag-spacing-section-lg)',
        'section-xl': 'var(--ag-spacing-section-xl)',
        'section-2xl': 'var(--ag-spacing-section-2xl)',
      },

      // Border radius
      borderRadius: {
        none: 'var(--ag-radius-none)',
        xs: 'var(--ag-radius-xs)',
        sm: 'var(--ag-radius-sm)',
        md: 'var(--ag-radius-md)',
        lg: 'var(--ag-radius-lg)',
        xl: 'var(--ag-radius-xl)',
        '2xl': 'var(--ag-radius-2xl)',
        '3xl': 'var(--ag-radius-3xl)',
        '4xl': 'var(--ag-radius-4xl)',
        full: 'var(--ag-radius-full)',
        // Semantic radii
        'button-sm': 'var(--ag-radius-button-sm)',
        'button-md': 'var(--ag-radius-button-md)',
        'button-lg': 'var(--ag-radius-button-lg)',
        'button-xl': 'var(--ag-radius-button-xl)',
        'button-full': 'var(--ag-radius-button-full)',
        'field-sm': 'var(--ag-radius-field-sm)',
        'field-md': 'var(--ag-radius-field-md)',
        'field-lg': 'var(--ag-radius-field-lg)',
        'field-xl': 'var(--ag-radius-field-xl)',
        'card-sm': 'var(--ag-radius-card-sm)',
        'card-md': 'var(--ag-radius-card-md)',
        'card-lg': 'var(--ag-radius-card-lg)',
        'card-xl': 'var(--ag-radius-card-xl)',
        'card-2xl': 'var(--ag-radius-card-2xl)',
        'modal-sm': 'var(--ag-radius-modal-sm)',
        'modal-md': 'var(--ag-radius-modal-md)',
        'modal-lg': 'var(--ag-radius-modal-lg)',
        'modal-xl': 'var(--ag-radius-modal-xl)',
        'badge-sm': 'var(--ag-radius-badge-sm)',
        'badge-md': 'var(--ag-radius-badge-md)',
        'badge-full': 'var(--ag-radius-badge-full)',
      },

      // Box shadow (elevation)
      boxShadow: {
        // Standard elevations
        none: 'var(--ag-elevation-none)',
        subtle: 'var(--ag-elevation-subtle)',
        low: 'var(--ag-elevation-low)',
        medium: 'var(--ag-elevation-medium)',
        high: 'var(--ag-elevation-high)',
        maximum: 'var(--ag-elevation-maximum)',
        overlay: 'var(--ag-elevation-overlay)',
        // Semantic elevations
        'card-rest': 'var(--ag-elevation-card-rest)',
        'card-hover': 'var(--ag-elevation-card-hover)',
        'card-active': 'var(--ag-elevation-card-active)',
        'card-dragged': 'var(--ag-elevation-card-dragged)',
        'button-rest': 'var(--ag-elevation-button-rest)',
        'button-hover': 'var(--ag-elevation-button-hover)',
        'button-active': 'var(--ag-elevation-button-active)',
        'modal-backdrop': 'var(--ag-elevation-modal-backdrop)',
        'modal-content': 'var(--ag-elevation-modal-content)',
        'modal-nested': 'var(--ag-elevation-modal-nested)',
        'popover-sm': 'var(--ag-elevation-popover-sm)',
        'popover-md': 'var(--ag-elevation-popover-md)',
        'popover-lg': 'var(--ag-elevation-popover-lg)',
        'nav-bar': 'var(--ag-elevation-nav-bar)',
        'nav-drawer': 'var(--ag-elevation-nav-drawer)',
        'nav-sticky': 'var(--ag-elevation-nav-sticky)',
        'toast-default': 'var(--ag-elevation-toast-default)',
        'toast-error': 'var(--ag-elevation-toast-error)',
        'toast-success': 'var(--ag-elevation-toast-success)',
        // Focus rings
        'focus-sm': 'var(--ag-elevation-focus-sm)',
        'focus-md': 'var(--ag-elevation-focus-md)',
        'focus-lg': 'var(--ag-elevation-focus-lg)',
        'focus-error-sm': 'var(--ag-elevation-focus-error-sm)',
        'focus-error-md': 'var(--ag-elevation-focus-error-md)',
        'focus-error-lg': 'var(--ag-elevation-focus-error-lg)',
        // Inner shadows
        'inner-sm': 'var(--ag-elevation-inner-sm)',
        'inner-md': 'var(--ag-elevation-inner-md)',
        'inner-lg': 'var(--ag-elevation-inner-lg)',
        // Brand shadows
        'brand-sm': 'var(--ag-elevation-brand-sm)',
        'brand-md': 'var(--ag-elevation-brand-md)',
        'brand-lg': 'var(--ag-elevation-brand-lg)',
        'brand-xl': 'var(--ag-elevation-brand-xl)',
      },

      // Font families
      fontFamily: {
        sans: ['var(--ag-font-sans)'],
        sansDisplay: ['var(--ag-font-sans-display)'],
        serif: ['var(--ag-font-serif)'],
        mono: ['var(--ag-font-mono)'],
        legal: ['var(--ag-font-legal)'],
      },

      // Font sizes
      fontSize: {
        'display-2xl': ['var(--ag-text-display-2xl)', { lineHeight: 'var(--ag-leading-display-2xl)', letterSpacing: '-0.02em' }],
        'display-xl': ['var(--ag-text-display-xl)', { lineHeight: 'var(--ag-leading-display-xl)', letterSpacing: '-0.02em' }],
        'display-lg': ['var(--ag-text-display-lg)', { lineHeight: 'var(--ag-leading-display-lg)', letterSpacing: '-0.01em' }],
        'display-md': ['var(--ag-text-display-md)', { lineHeight: 'var(--ag-leading-display-md)', letterSpacing: '-0.01em' }],
        'display-sm': ['var(--ag-text-display-sm)', { lineHeight: 'var(--ag-leading-display-sm)', letterSpacing: '0' }],
        'display-xs': ['var(--ag-text-display-xs)', { lineHeight: 'var(--ag-leading-display-xs)', letterSpacing: '0' }],
        h1: ['var(--ag-text-h1)', { lineHeight: 'var(--ag-leading-h1)', letterSpacing: '-0.01em' }],
        h2: ['var(--ag-text-h2)', { lineHeight: 'var(--ag-leading-h2)', letterSpacing: '0' }],
        h3: ['var(--ag-text-h3)', { lineHeight: 'var(--ag-leading-h3)', letterSpacing: '0' }],
        h4: ['var(--ag-text-h4)', { lineHeight: 'var(--ag-leading-h4)', letterSpacing: '0' }],
        h5: ['var(--ag-text-h5)', { lineHeight: 'var(--ag-leading-h5)', letterSpacing: '0' }],
        h6: ['var(--ag-text-h6)', { lineHeight: 'var(--ag-leading-h6)', letterSpacing: '0' }],
        'body-xl': ['var(--ag-text-body-xl)', { lineHeight: 'var(--ag-leading-body-xl)', letterSpacing: '0' }],
        'body-lg': ['var(--ag-text-body-lg)', { lineHeight: 'var(--ag-leading-body-lg)', letterSpacing: '0' }],
        'body-md': ['var(--ag-text-body-md)', { lineHeight: 'var(--ag-leading-body-md)', letterSpacing: '0' }],
        'body-sm': ['var(--ag-text-body-sm)', { lineHeight: 'var(--ag-leading-body-sm)', letterSpacing: '0' }],
        'body-xs': ['var(--ag-text-body-xs)', { lineHeight: 'var(--ag-leading-body-xs)', letterSpacing: '0' }],
        'label-lg': ['var(--ag-text-label-lg)', { lineHeight: 'var(--ag-leading-label-lg)', letterSpacing: '0.01em' }],
        'label-md': ['var(--ag-text-label-md)', { lineHeight: 'var(--ag-leading-label-md)', letterSpacing: '0.01em' }],
        'label-sm': ['var(--ag-text-label-sm)', { lineHeight: 'var(--ag-leading-label-sm)', letterSpacing: '0.01em' }],
        'label-xs': ['var(--ag-text-label-xs)', { lineHeight: 'var(--ag-leading-label-xs)', letterSpacing: '0.02em' }],
        caption: ['var(--ag-text-caption)', { lineHeight: 'var(--ag-leading-caption)', letterSpacing: '0.02em' }],
        footnote: ['var(--ag-text-footnote)', { lineHeight: 'var(--ag-leading-footnote)', letterSpacing: '0.02em' }],
        legal: ['var(--ag-text-legal)', { lineHeight: 'var(--ag-leading-legal)', letterSpacing: '0.03em' }],
      },

      // Font weights
      fontWeight: {
        thin: 'var(--ag-font-weight-thin)',
        extralight: 'var(--ag-font-weight-extralight)',
        light: 'var(--ag-font-weight-light)',
        normal: 'var(--ag-font-weight-normal)',
        medium: 'var(--ag-font-weight-medium)',
        semibold: 'var(--ag-font-weight-semibold)',
        bold: 'var(--ag-font-weight-bold)',
        extrabold: 'var(--ag-font-weight-extrabold)',
        black: 'var(--ag-font-weight-black)',
      },

      // Line heights
      lineHeight: {
        none: 'var(--ag-line-height-none)',
        tight: 'var(--ag-line-height-tight)',
        snug: 'var(--ag-line-height-snug)',
        normal: 'var(--ag-line-height-normal)',
        relaxed: 'var(--ag-line-height-relaxed)',
        loose: 'var(--ag-line-height-loose)',
      },

      // Letter spacing
      letterSpacing: {
        tighter: 'var(--ag-letter-spacing-tighter)',
        tight: 'var(--ag-letter-spacing-tight)',
        normal: 'var(--ag-letter-spacing-normal)',
        wide: 'var(--ag-letter-spacing-wide)',
        wider: 'var(--ag-letter-spacing-wider)',
        widest: 'var(--ag-letter-spacing-widest)',
      },

      // Transition durations
      transitionDuration: {
        instant: 'var(--ag-motion-duration-instant)',
        fastest: 'var(--ag-motion-duration-fastest)',
        faster: 'var(--ag-motion-duration-faster)',
        fast: 'var(--ag-motion-duration-fast)',
        normal: 'var(--ag-motion-duration-normal)',
        slow: 'var(--ag-motion-duration-slow)',
        slower: 'var(--ag-motion-duration-slower)',
        slowest: 'var(--ag-motion-duration-slowest)',
        longest: 'var(--ag-motion-duration-longest)',
      },

      // Transition timing functions
      transitionTimingFunction: {
        linear: 'var(--ag-motion-easing-linear)',
        in: 'var(--ag-motion-easing-in)',
        out: 'var(--ag-motion-easing-out)',
        'in-out': 'var(--ag-motion-easing-in-out)',
        bounce: 'var(--ag-motion-easing-bounce)',
        spring: 'var(--ag-motion-easing-spring)',
        smooth: 'var(--ag-motion-easing-smooth)',
        sharp: 'var(--ag-motion-easing-sharp)',
        'brand-enter': 'var(--ag-motion-easing-brand-enter)',
        'brand-exit': 'var(--ag-motion-easing-brand-exit)',
        'brand-emphasis': 'var(--ag-motion-easing-brand-emphasis)',
      },

      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'liquid-border': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'ag-rise': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'ag-rise-lg': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'ag-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ag-pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'ag-draw-line': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },

      // Animation utilities
      animation: {
        'fade-in-fast': 'fade-in var(--ag-motion-duration-fast) var(--ag-motion-easing-out) forwards',
        'fade-in': 'fade-in var(--ag-motion-duration-normal) var(--ag-motion-easing-out) forwards',
        'fade-in-slow': 'fade-in var(--ag-motion-duration-slow) var(--ag-motion-easing-out) forwards',
        'fade-out-fast': 'fade-out var(--ag-motion-duration-fast) var(--ag-motion-easing-in) forwards',
        'fade-out': 'fade-out var(--ag-motion-duration-normal) var(--ag-motion-easing-in) forwards',
        'fade-out-slow': 'fade-out var(--ag-motion-duration-slow) var(--ag-motion-easing-in) forwards',
        'slide-up-fast': 'slide-up var(--ag-motion-duration-fast) var(--ag-motion-easing-out) forwards',
        'slide-up': 'slide-up var(--ag-motion-duration-normal) var(--ag-motion-easing-out) forwards',
        'slide-up-slow': 'slide-up var(--ag-motion-duration-slow) var(--ag-motion-easing-out) forwards',
        'slide-down-fast': 'slide-down var(--ag-motion-duration-fast) var(--ag-motion-easing-out) forwards',
        'slide-down': 'slide-down var(--ag-motion-duration-normal) var(--ag-motion-easing-out) forwards',
        'slide-down-slow': 'slide-down var(--ag-motion-duration-slow) var(--ag-motion-easing-out) forwards',
        'slide-left-fast': 'slide-left var(--ag-motion-duration-fast) var(--ag-motion-easing-out) forwards',
        'slide-left': 'slide-left var(--ag-motion-duration-normal) var(--ag-motion-easing-out) forwards',
        'slide-left-slow': 'slide-left var(--ag-motion-duration-slow) var(--ag-motion-easing-out) forwards',
        'slide-right-fast': 'slide-right var(--ag-motion-duration-fast) var(--ag-motion-easing-out) forwards',
        'slide-right': 'slide-right var(--ag-motion-duration-normal) var(--ag-motion-easing-out) forwards',
        'slide-right-slow': 'slide-right var(--ag-motion-duration-slow) var(--ag-motion-easing-out) forwards',
        'scale-in-fast': 'scale-in var(--ag-motion-duration-fast) var(--ag-motion-easing-spring) forwards',
        'scale-in': 'scale-in var(--ag-motion-duration-normal) var(--ag-motion-easing-spring) forwards',
        'scale-in-slow': 'scale-in var(--ag-motion-duration-slow) var(--ag-motion-easing-spring) forwards',
        'scale-out-fast': 'scale-out var(--ag-motion-duration-fast) var(--ag-motion-easing-in) forwards',
        'scale-out': 'scale-out var(--ag-motion-duration-normal) var(--ag-motion-easing-in) forwards',
        'scale-out-slow': 'scale-out var(--ag-motion-duration-slow) var(--ag-motion-easing-in) forwards',
        'spin-slow': 'spin var(--ag-motion-duration-longest) var(--ag-motion-easing-linear) infinite',
        'spin': 'spin var(--ag-motion-duration-slowest) var(--ag-motion-easing-linear) infinite',
        'spin-fast': 'spin var(--ag-motion-duration-slower) var(--ag-motion-easing-linear) infinite',
        'pulse-slow': 'pulse var(--ag-motion-duration-longest) var(--ag-motion-easing-in-out) infinite',
        'pulse': 'pulse var(--ag-motion-duration-slower) var(--ag-motion-easing-in-out) infinite',
        'pulse-fast': 'pulse var(--ag-motion-duration-slow) var(--ag-motion-easing-in-out) infinite',
        'shimmer-slow': 'shimmer var(--ag-motion-duration-slowest) var(--ag-motion-easing-in-out) infinite',
        'shimmer': 'shimmer var(--ag-motion-duration-slower) var(--ag-motion-easing-in-out) infinite',
        'shimmer-fast': 'shimmer var(--ag-motion-duration-slow) var(--ag-motion-easing-in-out) infinite',
        'bounce-slow': 'bounce var(--ag-motion-duration-longest) var(--ag-motion-easing-bounce) infinite',
        'bounce': 'bounce var(--ag-motion-duration-slower) var(--ag-motion-easing-bounce) infinite',
        'bounce-fast': 'bounce var(--ag-motion-duration-slow) var(--ag-motion-easing-bounce) infinite',
        'float-slow': 'float var(--ag-motion-duration-longest) var(--ag-motion-easing-in-out) infinite',
        'float': 'float var(--ag-motion-duration-slower) var(--ag-motion-easing-in-out) infinite',
        'liquid-border': 'liquid-border 12s ease infinite',
        'ag-rise': 'ag-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'ag-rise-lg': 'ag-rise-lg 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'ag-fade': 'ag-fade 0.55s ease both',
        'ag-pulse-dot': 'ag-pulse-dot 1.5s ease-in-out infinite',
        'ag-draw-line': 'ag-draw-line 0.6s ease-out forwards',
      },

      // Backdrop blur
      backdropBlur: {
        none: 'var(--ag-glass-blur-none)',
        sm: 'var(--ag-glass-blur-sm)',
        md: 'var(--ag-glass-blur-md)',
        lg: 'var(--ag-glass-blur-lg)',
        xl: 'var(--ag-glass-blur-xl)',
        '2xl': 'var(--ag-glass-blur-2xl)',
        '3xl': 'var(--ag-glass-blur-3xl)',
        '4xl': 'var(--ag-glass-blur-4xl)',
        backdrop: 'var(--ag-glass-blur-backdrop)',
        'backdrop-hover': 'var(--ag-glass-blur-backdrop-hover)',
        'backdrop-active': 'var(--ag-glass-blur-backdrop-active)',
        modal: 'var(--ag-glass-blur-modal)',
        tooltip: 'var(--ag-glass-blur-tooltip)',
        nav: 'var(--ag-glass-blur-nav)',
        card: 'var(--ag-glass-blur-card)',
        panel: 'var(--ag-glass-blur-panel)',
      },

      // Background images (gradients)
      backgroundImage: {
        'gradient-primary': 'var(--ag-color-gradient-primary)',
        'gradient-primary-hover': 'var(--ag-color-gradient-primary-hover)',
        'gradient-primary-reverse': 'var(--ag-color-gradient-primary-reverse)',
        'gradient-accent': 'var(--ag-color-gradient-accent)',
        'gradient-accent-hover': 'var(--ag-color-gradient-accent-hover)',
        'gradient-dark': 'var(--ag-color-gradient-dark)',
        'gradient-dark-hover': 'var(--ag-color-gradient-dark-hover)',
        'gradient-mesh': 'var(--ag-color-gradient-mesh)',
        'gradient-mesh-hover': 'var(--ag-color-gradient-mesh-hover)',
        'gradient-noise': 'var(--ag-color-gradient-noise)',
        'gradient-shimmer': 'var(--ag-color-gradient-shimmer)',
        'gradient-button-primary': 'var(--ag-color-gradient-button-primary)',
        'gradient-button-accent': 'var(--ag-color-gradient-button-accent)',
        'gradient-button-ghost': 'var(--ag-color-gradient-button-ghost)',
      },
    },
  },
  plugins: [],
};

export default config;