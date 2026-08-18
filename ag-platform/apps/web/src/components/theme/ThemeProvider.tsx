'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ThemeMode } from '../../styles/tokens';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'glass',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  defaultTheme = 'glass',
}: {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    const importMap: Record<ThemeMode, string | null> = {
      glass: null, // already loaded via index.css
      editorial: '/src/styles/ag-editorial.css',
      brutalist: null,
    };

    const existing = document.querySelector('link[data-theme-css]');
    if (existing) existing.remove();

    const href = importMap[theme];
    if (href) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-theme-css', theme);
      document.head.appendChild(link);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
