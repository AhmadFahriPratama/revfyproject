"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useExperience } from "@/lib/experience";

type CommandLink = {
  href: string;
  label: string;
  description: string;
};

const defaultLinks: CommandLink[] = [
  { href: "/", label: "Home", description: "Halaman utama" },
  { href: "/materi", label: "Materi", description: "Daftar materi per kategori" },
  { href: "/latihan-soal", label: "Latihan Soal", description: "Drill cepat dan pembahasan" },
  { href: "/soal-asli", label: "Soal Asli", description: "Contoh soal dan pembahasan" },
  { href: "/tryout/gratis", label: "Tryout Gratis", description: "Tryout yang bisa dicoba langsung" },
  { href: "/tryout/berbayar", label: "Tryout Berbayar", description: "Tryout lengkap untuk latihan intensif" },
  { href: "/subscription", label: "Subscription", description: "Pilihan paket belajar" },
  { href: "/dashboard", label: "Dashboard", description: "Ringkasan belajar dan riwayat" },
  { href: "/login", label: "Login", description: "Masuk ke akun" },
];

export function CommandPalette() {
  const pathname = usePathname();
  const { session } = useAuth();
  const { bookmarks } = useExperience();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const grouped = useMemo(() => {
    const enriched = session?.role === "admin" ? [...defaultLinks, { href: "/admin", label: "Admin", description: "Kelola role user, redeem code, dan statistik" }] : defaultLinks;
    const normalized = query.trim().toLowerCase();

    const filterItems = (items: CommandLink[]) =>
      items.filter((item) => {
        if (!normalized) {
          return true;
        }

        return [item.label, item.description, item.href].some((field) => field.toLowerCase().includes(normalized));
      });

    return {
      primary: filterItems(enriched),
      saved: filterItems(bookmarks.map((item) => ({ href: item.href, label: item.label, description: "Halaman tersimpan" }))),
      actions: filterItems([
        { href: session ? "/dashboard" : "/login", label: session ? "Buka Dashboard" : "Buka Login", description: session ? "Lanjut ke halaman pribadi" : "Masuk ke akun Anda" },
        { href: "/subscription", label: "Lihat Paket", description: "Buka pilihan paket belajar" },
      ]),
    };
  }, [bookmarks, query, session?.role]);

  return (
    <>
      <button type="button" className="command-trigger" onClick={() => setOpen(true)}>
        <span>Ctrl K</span>
        <strong>Akses Cepat</strong>
      </button>
      {open ? (
        <div className="command-palette" role="dialog" aria-modal="true">
          <button type="button" className="command-palette__backdrop" onClick={() => setOpen(false)} />
          <div className="command-palette__panel">
            <div className="command-palette__head">
              <span className="eyebrow">Akses Cepat</span>
              <button type="button" className="command-palette__close" onClick={() => setOpen(false)}>
                Tutup
              </button>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="command-palette__input" placeholder="Cari halaman atau bookmark..." autoFocus />
            <div className="command-palette__list">
              {[
                { title: "Menu Utama", items: grouped.primary },
                { title: "Tersimpan", items: grouped.saved },
                { title: "Aksi Cepat", items: grouped.actions },
              ].map((section) => (
                <div key={section.title} className="command-palette__section">
                  <strong className="command-palette__section-title">{section.title}</strong>
                  <div className="command-palette__section-list">
                    {section.items.length > 0 ? (
                      section.items.map((item) => (
                        <Link key={`${section.title}-${item.href}-${item.label}`} href={item.href} className="command-palette__item">
                          <div>
                            <strong>{item.label}</strong>
                            <p>{item.description}</p>
                          </div>
                          <span>{item.href}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="command-palette__empty">Tidak ada hasil pada section ini.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
