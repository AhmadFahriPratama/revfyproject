"use client";

import dynamic from "next/dynamic";

import { LogoMark } from "@/components/logo-mark";
import { usePerformance } from "@/lib/performance";

const DynamicHeroCanvas = dynamic(() => import("@/components/hero-model-canvas").then((module) => module.HeroModelCanvas), {
  ssr: false,
});

const variantLabels = {
  core: "Tampilan utama",
  matrix: "Peta materi",
  focus: "Dashboard belajar",
  admin: "Panel admin",
  premium: "Tryout berbayar",
  brand: "Halaman utama",
};

type VariantName = keyof typeof variantLabels;

export function HeroModel({ variant = "core", label }: { variant?: VariantName; label?: string }) {
  const { enable3d, quality, theme } = usePerformance();

  return (
    <div className="model-card">
      {enable3d ? (
        <DynamicHeroCanvas variant={variant} quality={quality} theme={theme} />
      ) : (
        <div className="model-card__fallback">
          <LogoMark subtitle="Tampilan ringan" />
        </div>
      )}
      <div className="model-card__overlay">
        <span>{theme === "dark" ? "Visual gelap interaktif" : "Visual terang interaktif"}</span>
        <strong>{label ?? variantLabels[variant]}</strong>
      </div>
    </div>
  );
}
