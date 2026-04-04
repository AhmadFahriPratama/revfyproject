"use client";

import { usePerformance } from "@/lib/performance";

const options = [
  { key: "auto", label: "Auto" },
  { key: "high", label: "High" },
  { key: "medium", label: "Balanced" },
  { key: "lite", label: "Lite" },
] as const;

export function QualityToggle() {
  const { preference, setPreference } = usePerformance();

  return (
    <div className="quality-toggle" aria-label="Visual quality mode">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={preference === option.key ? "quality-toggle__item quality-toggle__item--active" : "quality-toggle__item"}
          onClick={() => setPreference(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
