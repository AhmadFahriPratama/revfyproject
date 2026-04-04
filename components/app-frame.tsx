"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BackgroundScene } from "@/components/background-scene";
import { CommandPalette } from "@/components/command-palette";
import { DepthButton } from "@/components/depth-button";
import { LogoMark } from "@/components/logo-mark";
import { OrbitDock } from "@/components/orbit-dock";
import { ReadingProgressBar } from "@/components/reading-progress-bar";
import { useAuth } from "@/lib/auth";

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/materi", label: "Materi" },
  { href: "/latihan-soal", label: "Latihan Soal" },
  { href: "/soal-asli", label: "Soal Asli" },
  { href: "/tryout/gratis", label: "Tryout Gratis" },
  { href: "/tryout/berbayar", label: "Tryout Berbayar" },
  { href: "/subscription", label: "Subscription" },
  { href: "/dashboard", label: "Dashboard" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useAuth();

  const links = session?.role === "admin" ? [...baseLinks, { href: "/admin", label: "Admin" }] : baseLinks;

  return (
    <div className="app-shell">
      <BackgroundScene />
      <div className="app-chrome">
        <ReadingProgressBar />
        <header className="site-header">
          <LogoMark href="/" compact subtitle="Belajar lebih fokus" />
          <nav className="site-nav" aria-label="Main navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(pathname, link.href) ? "nav-pill nav-pill--active" : "nav-pill"}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <CommandPalette />
            {session ? (
              <div className="session-chip">
                <span>{session.username}</span>
                <strong>{session.plan.toUpperCase()}</strong>
              </div>
            ) : null}
            {session ? (
              <DepthButton tone="ghost" size="sm" onClick={() => void logout()}>
                Keluar
              </DepthButton>
            ) : (
              <DepthButton href="/login" tone="cyan" size="sm">
                Login
              </DepthButton>
            )}
          </div>
        </header>
        <main className="page-shell">{children}</main>
        <footer className="site-footer">
          <div className="site-footer__group">
            <LogoMark compact subtitle="Latihan, materi, dan tryout" />
            <p>Revfy membantu pengguna belajar lebih terarah lewat materi, tryout, dashboard, dan bookmark dalam satu alur.</p>
          </div>
          <div className="site-footer__group site-footer__group--right">
            <p>Ctrl/Cmd + K membuka akses cepat.</p>
            <p>Gunakan menu utama untuk berpindah cepat antar halaman penting.</p>
          </div>
        </footer>
        <OrbitDock />
      </div>
    </div>
  );
}
