'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'glass' | 'editorial' | 'brutalist';
export type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  defaultColorScheme?: ColorScheme;
  storageKey?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'glass',
  defaultColorScheme = 'dark',
  storageKey = 'ag-theme',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(defaultColorScheme);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and system preference
  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    // Read from localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { theme: storedTheme, colorScheme: storedScheme } = JSON.parse(stored);
        if (storedTheme) setThemeState(storedTheme);
        if (storedScheme) setColorSchemeState(storedScheme);
      } catch {
        // Ignore parse errors
      }
    } else if (enableSystem) {
      // Check system preference for color scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorSchemeState(prefersDark ? 'dark' : 'light');
    }

    // Apply initial theme
    applyTheme(theme, colorScheme);
  }, [storageKey, enableSystem]);

  // Listen for system color scheme changes
  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setColorSchemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystem, storageKey]);

  // Apply theme to document
  const applyTheme = (t: ThemeMode, scheme: ColorScheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    root.setAttribute('data-color-scheme', scheme);

    // Update CSS variables from design tokens
    // This would typically import from @ag/design-tokens
    // For now, we rely on the CSS variables defined in globals.css
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme, colorScheme);

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...data, theme: newTheme }));
    }
  };

  const setColorScheme = (newScheme: ColorScheme) => {
    setColorSchemeState(newScheme);
    applyTheme(theme, newScheme);

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...data, colorScheme: newScheme }));
    }
  };

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const { theme: storedTheme, colorScheme: storedScheme } = JSON.parse(e.newValue);
          if (storedTheme) setThemeState(storedTheme);
          if (storedScheme) setColorSchemeState(storedScheme);
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: defaultTheme,
          colorScheme: defaultColorScheme,
          setTheme: () => {},
          setColorScheme: () => {},
          toggleColorScheme: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        setTheme,
        setColorScheme,
        toggleColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}