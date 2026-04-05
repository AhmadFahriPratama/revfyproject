"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BookmarkDrawer } from "@/components/bookmark-drawer";
import { ThemeToggle } from "@/components/theme-toggle";

const mobileLinks = [
  { href: "/", label: "Home" },
  { href: "/materi", label: "Materi" },
  { href: "/tryout", label: "Tryout" },
  { href: "/dashboard", label: "Dashboard" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrbitDock() {
  const pathname = usePathname();

  return (
    <div className="orbit-dock">
      <div className="orbit-dock__panel orbit-dock__panel--desktop">
        <div className="orbit-dock__group">
          <span className="orbit-dock__label">Tema</span>
          <ThemeToggle />
        </div>
        <div className="orbit-dock__group orbit-dock__group--actions">
          <Link href={pathname === "/dashboard" ? "/tryout" : "/dashboard"} className="orbit-dock__button orbit-dock__button--link">
            <span>{pathname === "/dashboard" ? "Tryout" : "Dashboard"}</span>
          </Link>
          <BookmarkDrawer />
        </div>
      </div>

      <div className="orbit-dock__panel orbit-dock__panel--mobile">
        <nav className="orbit-dock__nav" aria-label="Quick navigation">
          {mobileLinks.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "orbit-dock__nav-link orbit-dock__nav-link--active" : "orbit-dock__nav-link"}>
              {link.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
        <BookmarkDrawer compact />
      </div>
    </div>
  );
}
