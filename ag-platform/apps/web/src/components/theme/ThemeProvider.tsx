// Enhanced ThemeProvider with localStorage persistence + cross-tab sync
// Replaces src/components/theme/ThemeProvider.tsx

'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { ThemeMode } from '../../styles/tokens';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  resolvedTheme: ThemeMode; // The actual theme being rendered (after system preference resolution)
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'glass',
  setTheme: () => {},
  resolvedTheme: 'glass',
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

const THEME_STORAGE_KEY = 'luxor-theme';
const THEME_SYSTEM_KEY = 'luxor-theme-system';

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'glass';
  
  // Check for system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // For now, we map dark -> glass, light -> editorial
  // In the future, we could have a 'system' mode that auto-switches
  return prefersDark ? 'glass' : 'editorial';
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'glass';
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['glass', 'editorial', 'brutalist'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch {
    // localStorage not available (e.g., Safari private mode)
  }
  
  return getSystemTheme();
}

export function ThemeProvider({
  children,
  defaultTheme = 'glass',
  enableSystemSync = true,
}: {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  enableSystemSync?: boolean;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [mounted, setMounted] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', newTheme);

    const importMap: Record<ThemeMode, string | null> = {
      glass: null, // already loaded via index.css
      editorial: '/src/styles/ag-editorial.css',
      brutalist: null,
    };

    const existing = document.querySelector('link[data-theme-css]');
    if (existing) existing.remove();

    const href = importMap[newTheme];
    if (href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-theme-css', newTheme);
      document.head.appendChild(link);
    }
  }, []);

  // Handle theme changes
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    const initial = getInitialTheme();
    setThemeState(initial);
    setResolvedTheme(initial);
    applyTheme(initial);
  }, [applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystemSync) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const systemTheme = getSystemTheme();
      // Only auto-switch if user hasn't explicitly set a preference
      const hasExplicitPreference = localStorage.getItem(THEME_SYSTEM_KEY) !== 'false';
      if (hasExplicitPreference) {
        setResolvedTheme(systemTheme);
        applyTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystemSync, applyTheme]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        const newTheme = event.newValue as ThemeMode;
        if (['glass', 'editorial', 'brutalist'].includes(newTheme)) {
          setThemeState(newTheme);
          setResolvedTheme(newTheme);
          applyTheme(newTheme);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [applyTheme]);

  // Apply resolved theme when it changes (from system sync)
  useEffect(() => {
    if (mounted) {
      applyTheme(resolvedTheme);
    }
  }, [resolvedTheme, mounted, applyTheme]);

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: defaultTheme, setTheme: () => {}, resolvedTheme: defaultTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}