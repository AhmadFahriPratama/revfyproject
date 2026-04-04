"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Quality = "high" | "medium" | "lite";
type QualityPreference = Quality | "auto";

type PerformanceContextValue = {
  ready: boolean;
  quality: Quality;
  preference: QualityPreference;
  enable3d: boolean;
  reducedMotion: boolean;
  compactUi: boolean;
  setPreference: (preference: QualityPreference) => void;
};

const PerformanceContext = createContext<PerformanceContextValue | null>(null);
const storageKey = "revfy.performance.preference.v1";

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
  const [preference, setPreferenceState] = useState<QualityPreference>("auto");
  const [state, setState] = useState<PerformanceContextValue>({
    ready: false,
    quality: "medium",
    preference: "auto",
    enable3d: true,
    reducedMotion: false,
    compactUi: false,
    setPreference: () => undefined,
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const storedPreference = window.localStorage.getItem(storageKey) as QualityPreference | null;

    if (storedPreference === "auto" || storedPreference === "high" || storedPreference === "medium" || storedPreference === "lite") {
      setPreferenceState(storedPreference);
    }

    const update = () => {
      const reducedMotion = media.matches;
      const width = window.innerWidth;
      const autoQuality = resolveQuality(width, reducedMotion);
      const quality = preference === "auto" ? autoQuality : preference;

      setState({
        ready: true,
        quality,
        preference,
        enable3d: !reducedMotion && quality !== "lite",
        reducedMotion,
        compactUi: width < 960,
        setPreference: (nextPreference) => {
          setPreferenceState(nextPreference);
          window.localStorage.setItem(storageKey, nextPreference);
        },
      });
    };

    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [preference]);

  return <PerformanceContext.Provider value={state}>{children}</PerformanceContext.Provider>;
}

export function usePerformance() {
  const context = useContext(PerformanceContext);

  if (!context) {
    throw new Error("usePerformance must be used within PerformanceProvider");
  }

  return context;
}
