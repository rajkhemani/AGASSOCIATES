/**
 * Motion Tokens — Animation and transition system
 *
 * Provides a consistent motion system with durations, easings, and
 * semantic animation tokens for common UI patterns.
 */

// Base duration scale (in ms)
export const duration = {
  instant: '0ms',
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
  longest: '1000ms',
} as const;

// Easing functions
export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Expressive easings
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

  // Brand-specific easings
  brand: {
    enter: 'cubic-bezier(0.22, 1, 0.36, 1)',    // ag-rise
    exit: 'cubic-bezier(0.55, 0, 0.68, 0.19)',
    emphasis: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },

  // Editorial theme easings
  editorial: {
    rise: 'cubic-bezier(0.22, 1, 0.36, 1)',
    riseLg: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fade: 'ease',
    pulse: 'ease-in-out',
    drawLine: 'linear',
  },

  // Brutalist theme easings (snappy, minimal)
  brutalist: {
    instant: 'linear',
    snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Semantic transition tokens for common patterns
export const transition = {
  // All properties
  all: {
    fastest: `${duration.fastest} ${easing.easeOut}`,
    faster: `${duration.faster} ${easing.easeOut}`,
    fast: `${duration.fast} ${easing.easeOut}`,
    normal: `${duration.normal} ${easing.easeOut}`,
    slow: `${duration.slow} ${easing.easeOut}`,
    slower: `${duration.slower} ${easing.easeOut}`,
  },
  // Colors only
  colors: {
    fast: `${duration.fast} ${easing.easeOut}`,
    normal: `${duration.normal} ${easing.easeOut}`,
    slow: `${duration.slow} ${easing.easeOut}`,
  },
  // Transform only
  transform: {
    fastest: `${duration.fastest} ${easing.easeOut}`,
    faster: `${duration.faster} ${easing.spring}`,
    fast: `${duration.fast} ${easing.spring}`,
    normal: `${duration.normal} ${easing.spring}`,
    slow: `${duration.slow} ${easing.spring}`,
  },
  // Opacity only
  opacity: {
    fastest: `${duration.fastest} ${easing.easeOut}`,
    fast: `${duration.fast} ${easing.easeOut}`,
    normal: `${duration.normal} ${easing.easeOut}`,
    slow: `${duration.slow} ${easing.easeOut}`,
  },
  // Shadow only
  shadow: {
    fast: `${duration.fast} ${easing.easeOut}`,
    normal: `${duration.normal} ${easing.easeOut}`,
    slow: `${duration.slow} ${easing.easeOut}`,
  },
  // Width/height
  dimensions: {
    fast: `${duration.fast} ${easing.easeOut}`,
    normal: `${duration.normal} ${easing.easeOut}`,
    slow: `${duration.slow} ${easing.easeOut}`,
  },
} as const;

// Semantic animation tokens for common UI patterns
export const animation = {
  // Fade animations
  fade: {
    in: {
      fast: `fade-in ${duration.fast} ${easing.easeOut} forwards`,
      normal: `fade-in ${duration.normal} ${easing.easeOut} forwards`,
      slow: `fade-in ${duration.slow} ${easing.easeOut} forwards`,
    },
    out: {
      fast: `fade-out ${duration.fast} ${easing.easeIn} forwards`,
      normal: `fade-out ${duration.normal} ${easing.easeIn} forwards`,
      slow: `fade-out ${duration.slow} ${easing.easeIn} forwards`,
    },
  },
  // Slide animations
  slide: {
    up: {
      fast: `slide-up ${duration.fast} ${easing.easeOut} forwards`,
      normal: `slide-up ${duration.normal} ${easing.easeOut} forwards`,
      slow: `slide-up ${duration.slow} ${easing.easeOut} forwards`,
    },
    down: {
      fast: `slide-down ${duration.fast} ${easing.easeOut} forwards`,
      normal: `slide-down ${duration.normal} ${easing.easeOut} forwards`,
      slow: `slide-down ${duration.slow} ${easing.easeOut} forwards`,
    },
    left: {
      fast: `slide-left ${duration.fast} ${easing.easeOut} forwards`,
      normal: `slide-left ${duration.normal} ${easing.easeOut} forwards`,
      slow: `slide-left ${duration.slow} ${easing.easeOut} forwards`,
    },
    right: {
      fast: `slide-right ${duration.fast} ${easing.easeOut} forwards`,
      normal: `slide-right ${duration.normal} ${easing.easeOut} forwards`,
      slow: `slide-right ${duration.slow} ${easing.easeOut} forwards`,
    },
  },
  // Scale animations
  scale: {
    in: {
      fast: `scale-in ${duration.fast} ${easing.spring} forwards`,
      normal: `scale-in ${duration.normal} ${easing.spring} forwards`,
      slow: `scale-in ${duration.slow} ${easing.spring} forwards`,
    },
    out: {
      fast: `scale-out ${duration.fast} ${easing.easeIn} forwards`,
      normal: `scale-out ${duration.normal} ${easing.easeIn} forwards`,
      slow: `scale-out ${duration.slow} ${easing.easeIn} forwards`,
    },
  },
  // Spin/rotate
  spin: {
    slow: `spin ${duration.longest} ${easing.linear} infinite`,
    normal: `spin ${duration.slowest} ${easing.linear} infinite`,
    fast: `spin ${duration.slower} ${easing.linear} infinite`,
  },
  // Pulse
  pulse: {
    slow: `pulse ${duration.longest} ${easing.easeInOut} infinite`,
    normal: `pulse ${duration.slower} ${easing.easeInOut} infinite`,
    fast: `pulse ${duration.slow} ${easing.easeInOut} infinite`,
  },
  // Shimmer (loading)
  shimmer: {
    slow: `shimmer ${duration.slowest} ${easing.easeInOut} infinite`,
    normal: `shimmer ${duration.slower} ${easing.easeInOut} infinite`,
    fast: `shimmer ${duration.slow} ${easing.easeInOut} infinite`,
  },
  // Bounce
  bounce: {
    slow: `bounce ${duration.longest} ${easing.bounce} infinite`,
    normal: `bounce ${duration.slower} ${easing.bounce} infinite`,
    fast: `bounce ${duration.slow} ${easing.bounce} infinite`,
  },
  // Float
  float: {
    slow: `float ${duration.longest} ${easing.easeInOut} infinite`,
    normal: `float ${duration.slower} ${easing.easeInOut} infinite`,
  },
} as const;

// Keyframe definitions (for CSS injection)
export const keyframes = {
  'fade-in': `
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  'fade-out': `
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  'slide-up': `
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  'slide-down': `
    @keyframes slide-down {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  'slide-left': `
    @keyframes slide-left {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  'slide-right': `
    @keyframes slide-right {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `,
  'scale-in': `
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  'scale-out': `
    @keyframes scale-out {
      from { opacity: 1; transform: scale(1); }
      to { opacity: 0; transform: scale(0.95); }
    }
  `,
  'spin': `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  'pulse': `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  'shimmer': `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  'bounce': `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
  'float': `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
  // Liquid border animation
  'liquid-border': `
    @keyframes liquid-border {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
  // Editorial rise animation
  'ag-rise': `
    @keyframes ag-rise {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: none; }
    }
  `,
  'ag-rise-lg': `
    @keyframes ag-rise-lg {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: none; }
    }
  `,
  'ag-fade': `
    @keyframes ag-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  'ag-pulse-dot': `
    @keyframes ag-pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `,
  'ag-draw-line': `
    @keyframes ag-draw-line {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
  `,
} as const;

// Reduced motion variants (respects prefers-reduced-motion)
export const reducedMotion = {
  duration: '0.01ms',
  transition: 'none',
  animation: 'none',
} as const;

export type MotionTokens = {
  duration: typeof duration;
  easing: typeof easing;
  transition: typeof transition;
  animation: typeof animation;
  keyframes: typeof keyframes;
  reducedMotion: typeof reducedMotion;
};

export const motionTokens: MotionTokens = {
  duration,
  easing,
  transition,
  animation,
  keyframes,
  reducedMotion,
} as const;

export type DurationKey = keyof typeof duration;
export type EasingKey = keyof typeof easing;
export type TransitionCategory = keyof typeof transition;
export type AnimationCategory = keyof typeof animation;