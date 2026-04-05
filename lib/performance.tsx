"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Quality = "high" | "medium" | "lite";
type ThemeMode = "dark" | "light";

type PerformanceContextValue = {
  ready: boolean;
  quality: Quality;
  theme: ThemeMode;
  enable3d: boolean;
  reducedMotion: boolean;
  compactUi: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const PerformanceContext = createContext<PerformanceContextValue | null>(null);
const storageKey = "revfy.appearance.theme.v1";

function resolveQuality(width: number, reducedMotion: boolean): Quality {
  if (reducedMotion || width < 720) {
    return "lite";
  }

  if (width < 1440) {
    return "medium";
  }

  return "high";
}

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [state, setState] = useState<PerformanceContextValue>({
    ready: false,
    quality: "medium",
    theme: "dark",
    enable3d: true,
    reducedMotion: false,
    compactUi: false,
    setTheme: () => undefined,
    toggleTheme: () => undefined,
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const colorSchemeMedia = window.matchMedia("(prefers-color-scheme: light)");
    const storedTheme = window.localStorage.getItem(storageKey) as ThemeMode | null;

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
    } else {
      setThemeState(colorSchemeMedia.matches ? "light" : "dark");
    }

    const update = () => {
      const reducedMotion = media.matches;
      const width = window.innerWidth;
      const quality = resolveQuality(width, reducedMotion);

      document.documentElement.dataset.theme = theme;

      setState({
        ready: true,
        quality,
        theme,
        enable3d: !reducedMotion && quality !== "lite",
        reducedMotion,
        compactUi: width < 960,
        setTheme: (nextTheme) => {
          setThemeState(nextTheme);
          window.localStorage.setItem(storageKey, nextTheme);
        },
        toggleTheme: () => {
          const nextTheme = theme === "dark" ? "light" : "dark";
          setThemeState(nextTheme);
          window.localStorage.setItem(storageKey, nextTheme);
        },
      });
    };

    update();
    media.addEventListener("change", update);
    colorSchemeMedia.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      media.removeEventListener("change", update);
      colorSchemeMedia.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [theme]);

  return <PerformanceContext.Provider value={state}>{children}</PerformanceContext.Provider>;
}

export function usePerformance() {
  const context = useContext(PerformanceContext);

  if (!context) {
    throw new Error("usePerformance must be used within PerformanceProvider");
  }

  return context;
}
