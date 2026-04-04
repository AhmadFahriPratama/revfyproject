"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

type ExplorerItem = {
  id: string;
  title: string;
  category: string;
  mode: string;
  accessTier: "gratis" | "berbayar";
  itemCount: string;
  itemCountValue: number;
  duration: string;
  path: string;
  href: string;
};

export function AdminDatasetExplorer({ items }: { items: ExplorerItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tier, setTier] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => ["all", ...new Set(items.map((item) => item.category))], [items]);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items
      .filter((item) => (category === "all" ? true : item.category === category))
      .filter((item) => (tier === "all" ? true : item.accessTier === tier))
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return [item.title, item.category, item.mode, item.path].some((field) => field.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => right.itemCountValue - left.itemCountValue)
      .slice(0, 18);
  }, [category, deferredQuery, items, tier]);

  const searching = query !== deferredQuery;

  return (
    <article className="glass-panel card-surface">
      <div className="section-heading">
        <span className="eyebrow">Explorer</span>
        <h2>Search dan filter semua dataset</h2>
      </div>

      <div className="explorer-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul, mode, kategori, atau path..." />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Semua kategori" : option}
            </option>
          ))}
        </select>
        <select value={tier} onChange={(event) => setTier(event.target.value)}>
          <option value="all">Semua tier</option>
          <option value="gratis">Gratis</option>
          <option value="berbayar">Berbayar</option>
        </select>
      </div>

      <div className="meta-row">
        <span>{filtered.length} hasil tampil</span>
        <span>{searching ? "Menyaring..." : "Siap"}</span>
      </div>

      <div className="stack-sm">
        {filtered.map((item) => (
          <Link key={`${item.id}-${item.path}`} href={item.href} className="list-row list-row--link">
            <div>
              <strong>{item.title}</strong>
              <p>
                {item.category} · {item.mode} · {item.duration}
              </p>
              <p className="sub-copy">{item.path}</p>
            </div>
            <span>
              {item.itemCount} item · {item.accessTier}
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}
