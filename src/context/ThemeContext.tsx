import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  gradientStart: string;
  gradientEnd: string;
  lighten: (hex: string, amt: number) => string;
  darken: (hex: string, amt: number) => string;
  hexToRgba: (hex: string, alpha: number) => string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#5cb85c',
  setPrimaryColor: () => {},
  gradientStart: '#9CCC65',
  gradientEnd: '#689F38',
  lighten: () => '#9CCC65',
  darken: () => '#689F38',
  hexToRgba: () => 'rgba(92,184,92,0.2)',
});

// Helper: hex color manipulation
function lighten(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return (
    '#' +
    (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
  );
}

function darken(hex: string, amt: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return (
    '#' +
    (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState('#5cb85c');
  const [gradientStart, setGradientStart] = useState('#9CCC65');
  const [gradientEnd, setGradientEnd] = useState('#689F38');

  const setPrimaryColor = useCallback((c: string) => {
    setPrimaryColorState(c);
    // Compute gradient from the color
    // Simple logic: start = lighten 30%, end = darken 20%
    setGradientStart(lighten(c, 30));
    setGradientEnd(darken(c, 20));
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        setPrimaryColor,
        gradientStart,
        gradientEnd,
        lighten,
        darken,
        hexToRgba,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
