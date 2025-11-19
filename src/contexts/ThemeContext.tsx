/**
 * Theme Context
 *
 * Manages light/dark theme switching
 * Replaces the old theme.js with reactive state management
 */

import { createContext, useContext, createSignal, createEffect, JSX, Accessor } from 'solid-js';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Accessor<Theme>;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: { children: JSX.Element }) {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  };

  const [theme, setThemeSignal] = createSignal<Theme>(getInitialTheme());

  // Apply theme to document
  createEffect(() => {
    const currentTheme = theme();
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  });

  // Toggle theme
  const toggleTheme = () => {
    setThemeSignal(theme() === 'light' ? 'dark' : 'light');
  };

  // Set theme directly
  const setTheme = (newTheme: Theme) => {
    setThemeSignal(newTheme);
  };

  // Listen for system theme changes
  createEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a theme
      const storedTheme = localStorage.getItem('theme');
      if (!storedTheme) {
        setThemeSignal(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  });

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
