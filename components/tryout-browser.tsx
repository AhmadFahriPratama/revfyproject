"use client";

import { useMemo, useState } from "react";

import { BookmarkToggle } from "@/components/bookmark-toggle";
import { DepthButton } from "@/components/depth-button";

type TryoutItem = {
  id: string;
  href: string;
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
  const modes = useMemo(() => ["all", ...new Set(items.map((item) => item.mode))], [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesMode = mode === "all" || item.mode === mode;
      const matchesQuery = !normalized || [item.title, item.category, item.focus, item.mode].some((field) => field.toLowerCase().includes(normalized));
      return matchesMode && matchesQuery;
    });
  }, [items, mode, query]);

  return (
    <section className="stack-md">
      <div className="browser-toolbar glass-panel">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{sourceLabel}</p>
        </div>
        <div className="browser-toolbar__actions">
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
        {filtered.map((item) => (
          <article key={item.id} className="glass-panel card-surface card-surface--interactive">
            <div className="card-surface__head">
              <span className="card-tag">{item.mode}</span>
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
        ))}
      </div>
    </section>
  );
}
