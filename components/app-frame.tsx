"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BackgroundScene } from "@/components/background-scene";
import { CommandPalette } from "@/components/command-palette";
import { DepthButton } from "@/components/depth-button";
import { LogoMark } from "@/components/logo-mark";
import { OrbitDock } from "@/components/orbit-dock";
import { ReadingProgressBar } from "@/components/reading-progress-bar";
import { useAuth } from "@/lib/auth";

const navSections = [
  {
    label: "Menu utama",
    links: [
      { href: "/", label: "Home" },
      { href: "/materi", label: "Materi" },
      { href: "/tryout", label: "Tryout" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    label: "Eksplorasi",
    links: [
      { href: "/latihan-soal", label: "Latihan Soal" },
      { href: "/soal-asli", label: "Soal Asli" },
      { href: "/subscription", label: "Subscription" },
    ],
  },
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
  const [navOpen, setNavOpen] = useState(false);

  const sections = session?.role === "admin" ? [...navSections, { label: "Workspace", links: [{ href: "/admin", label: "Admin" }] }] : navSections;

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      <BackgroundScene />
      <div className="app-chrome">
        <ReadingProgressBar />
        <header className="site-header">
          <div className="site-header__row">
            <LogoMark href="/" compact subtitle="Belajar lebih fokus" />
            <div className="site-header__controls">
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
              <button
                type="button"
                className={navOpen ? "mobile-nav-toggle mobile-nav-toggle--active" : "mobile-nav-toggle"}
                onClick={() => setNavOpen((current) => !current)}
                aria-expanded={navOpen}
                aria-controls="site-nav"
              >
                {navOpen ? "Tutup" : "Menu"}
              </button>
            </div>
          </div>
          <nav id="site-nav" className={navOpen ? "site-nav site-nav--open" : "site-nav"} aria-label="Main navigation">
            {sections.map((section) => (
              <div key={section.label} className="site-nav__section">
                <span className="site-nav__eyebrow">{section.label}</span>
                <div className="site-nav__group">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={isActive(pathname, link.href) ? "nav-pill nav-pill--active" : "nav-pill"}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
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
