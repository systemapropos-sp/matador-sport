import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { lighten, darken } from "@/lib/utils";

interface ThemeContextType {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  gradientStart: string;
  gradientEnd: string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: "#5cb85c",
  setPrimaryColor: () => {},
  gradientStart: "#80c880",
  gradientEnd: "#3d8b3d",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState("#5cb85c");
  const gradientStart = useMemo(() => lighten(primaryColor, 0.2), [primaryColor]);
  const gradientEnd = useMemo(() => darken(primaryColor, 0.2), [primaryColor]);

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorState(color);
  }, []);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, gradientStart, gradientEnd }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
