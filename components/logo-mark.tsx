import Image from "next/image";
import Link from "next/link";

import logoPng from "@/logo.png";

type LogoMarkProps = {
  compact?: boolean;
  href?: string;
  subtitle?: string;
  className?: string;
};

function LogoInner({ compact = false, subtitle = "3D Learning Orbit", className }: Omit<LogoMarkProps, "href">) {
  return (
    <div className={["logo-mark", compact ? "logo-mark--compact" : "", className].filter(Boolean).join(" ")}>
      <div className="logo-mark__visual">
        <Image src={logoPng} alt="Revfy logo" priority sizes={compact ? "56px" : "88px"} className="logo-mark__image" />
      </div>
      <div className="logo-mark__copy">
        <strong>REVFY</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

export function LogoMark({ href, ...props }: LogoMarkProps) {
  if (href) {
    return (
      <Link href={href} className="logo-mark__link">
        <LogoInner {...props} />
      </Link>
    );
  }

  return <LogoInner {...props} />;
}
