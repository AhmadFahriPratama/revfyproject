import { LogoMark } from "@/components/logo-mark";

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
  return (
    <div className="model-card">
      <div className="model-card__fallback model-card__fallback--static">
        <LogoMark subtitle="Tampilan ringan" />
      </div>
      <div className="model-card__overlay">
        <span>Visual ringan tanpa 3D</span>
        <strong>{label ?? variantLabels[variant]}</strong>
      </div>
    </div>
  );
}
