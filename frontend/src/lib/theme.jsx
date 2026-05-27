import * as React from 'react';

const STORAGE_KEY = 'pipeline-studio:theme:v1';

const ThemeContext = React.createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

function readStoredTheme() {
  if (typeof window === 'undefined') return 'system';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function resolveTheme(theme) {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function applyHtmlClass(resolved) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

function supportsViewTransitions() {
  return (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function applyHtmlClassWithTransition(resolved, origin) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (!supportsViewTransitions()) {
    applyHtmlClass(resolved);
    return;
  }

  // Stamp the click origin so the CSS clip-path can read it.
  if (origin) {
    root.style.setProperty('--theme-transition-x', `${origin.x}px`);
    root.style.setProperty('--theme-transition-y', `${origin.y}px`);
  } else {
    root.style.setProperty('--theme-transition-x', '50%');
    root.style.setProperty('--theme-transition-y', '50%');
  }

  document.startViewTransition(() => {
    applyHtmlClass(resolved);
  });
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = React.useState(() => readStoredTheme());
  const [resolvedTheme, setResolvedTheme] = React.useState(() =>
    resolveTheme(readStoredTheme()),
  );
  const pendingOriginRef = React.useRef(null);
  const isFirstRunRef = React.useRef(true);

  React.useEffect(() => {
    const next = resolveTheme(theme);
    setResolvedTheme(next);
    if (isFirstRunRef.current) {
      // Skip animation on mount; the html class is already set by the
      // pre-mount script in index.html.
      isFirstRunRef.current = false;
      applyHtmlClass(next);
    } else {
      applyHtmlClassWithTransition(next, pendingOriginRef.current);
      pendingOriginRef.current = null;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  React.useEffect(() => {
    if (theme !== 'system') return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = mql.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      applyHtmlClass(next); // No animation for passive OS changes.
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = React.useCallback((next, origin) => {
    pendingOriginRef.current = origin ?? null;
    setThemeState(next);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
