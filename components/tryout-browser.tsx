"use client";

import { useMemo, useState } from "react";

import { BookmarkToggle } from "@/components/bookmark-toggle";
import { DepthButton } from "@/components/depth-button";

type TryoutItem = {
  id: string;
  href: string;
  accessTier: "gratis" | "berbayar";
  title: string;
  category: string;
  focus: string;
  mode: string;
  itemCount: string;
  duration: string;
};

export function TryoutBrowser({ items, eyebrow, title, sourceLabel }: { items: TryoutItem[]; eyebrow: string; title: string; sourceLabel: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [tier, setTier] = useState("all");
  const modes = useMemo(() => ["all", ...new Set(items.map((item) => item.mode))], [items]);
  const tiers = useMemo(() => ["all", ...new Set(items.map((item) => item.accessTier))], [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesMode = mode === "all" || item.mode === mode;
      const matchesTier = tier === "all" || item.accessTier === tier;
      const matchesQuery = !normalized || [item.title, item.category, item.focus, item.mode].some((field) => field.toLowerCase().includes(normalized));
      return matchesMode && matchesTier && matchesQuery;
    });
  }, [items, mode, query, tier]);

  return (
    <section className="stack-md">
      <div className="browser-toolbar glass-panel">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{sourceLabel}</p>
        </div>
        <div className="browser-toolbar__actions">
          {tiers.length > 2 ? (
            <div className="browser-toolbar__filters" role="tablist" aria-label="Filter akses tryout">
              {tiers.map((entry) => (
                <button key={entry} type="button" className={tier === entry ? "filter-pill filter-pill--active" : "filter-pill"} onClick={() => setTier(entry)}>
                  {entry === "all" ? "Semua akses" : entry === "gratis" ? "Gratis" : "Berbayar"}
                </button>
              ))}
            </div>
          ) : null}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari fokus, judul, mode, atau kategori..." />
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            {modes.map((entry) => (
              <option key={entry} value={entry}>
                {entry === "all" ? "Semua mode" : entry}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="content-grid content-grid--three">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <article key={item.id} className="glass-panel card-surface card-surface--interactive">
              <div className="card-surface__head">
                <div className="card-chip-row">
                  <span className={item.accessTier === "gratis" ? "card-tag card-tag--free" : "card-tag card-tag--premium"}>
                    {item.accessTier === "gratis" ? "Gratis" : "Berbayar"}
                  </span>
                  <span className="card-tag card-tag--muted">{item.mode}</span>
                </div>
                <BookmarkToggle item={{ key: `tryout:${item.href}`, label: item.title, href: item.href }} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.focus}</p>
              <div className="meta-row">
                <span>{item.category}</span>
                <span>{item.itemCount} soal</span>
                <span>{item.duration}</span>
              </div>
              <DepthButton href={item.href} tone="ghost" size="sm">
                Buka detail
              </DepthButton>
            </article>
          ))
        ) : (
          <article className="glass-panel card-surface">
            <span className="card-tag">Tidak ada hasil</span>
            <h3>Filter belum menemukan tryout yang cocok</h3>
            <p>Coba ganti kata kunci atau pilih mode lain untuk melihat lineup tryout yang masih aktif hari ini.</p>
          </article>
        )}
      </div>
    </section>
  );
}
