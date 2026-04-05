"use client";

import { usePerformance } from "@/lib/performance";

export function ThemeToggle() {
  const { theme, toggleTheme } = usePerformance();

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}>
      <span className="theme-toggle__icon" aria-hidden="true">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
      <span className="theme-toggle__copy">
        <strong>{theme === "dark" ? "Mode Gelap" : "Mode Terang"}</strong>
        <span>{theme === "dark" ? "Lembut untuk malam" : "Cerah dan ringan"}</span>
      </span>
    </button>
  );
}
