import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

export function hexToRgba(hex: string, alpha: number = 1): string {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lighten(hex: string, amount: number = 0.2): string {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function darken(hex: string, amount: number = 0.2): string {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ThemeContextValue {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  hexToRgba: (hex: string, alpha?: number) => string;
  lighten: (hex: string, amount?: number) => string;
  darken: (hex: string, amount?: number) => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState('#5cb85c');

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorState(color);
  }, []);

  const value = useMemo(
    () => ({
      primaryColor,
      setPrimaryColor,
      hexToRgba,
      lighten,
      darken,
    }),
    [primaryColor, setPrimaryColor]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}
