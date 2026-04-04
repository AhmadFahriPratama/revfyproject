"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BookmarkDrawer } from "@/components/bookmark-drawer";
import { QualityToggle } from "@/components/quality-toggle";

export function OrbitDock() {
  const pathname = usePathname();

  return (
    <div className="orbit-dock">
        <div className="orbit-dock__panel">
          <div className="orbit-dock__group">
          <span className="orbit-dock__label">Tampilan</span>
          <QualityToggle />
        </div>
        <div className="orbit-dock__group orbit-dock__group--actions">
          <Link href={pathname === "/dashboard" ? "/tryout/gratis" : "/dashboard"} className="orbit-dock__button orbit-dock__button--link">
            <span>{pathname === "/dashboard" ? "Latihan" : "Dashboard"}</span>
          </Link>
          <BookmarkDrawer />
        </div>
      </div>
    </div>
  );
}
