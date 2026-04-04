"use client";

import { useMemo, useState } from "react";

import { BookmarkToggle } from "@/components/bookmark-toggle";
import { DepthButton } from "@/components/depth-button";
import { useExperience } from "@/lib/experience";

type Track = {
  category: string;
  href: string;
  title: string;
  description: string;
  moduleCount: string;
  questionCount: string;
  modes: string;
};

export function MaterialBrowser({ tracks }: { tracks: Track[] }) {
  const { bookmarks, getRouteProgress } = useExperience();
  const [query, setQuery] = useState("");
  const [showSaved, setShowSaved] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return tracks.filter((track) => {
      const matchesSaved = !showSaved || bookmarks.some((item) => item.href === track.href);
      const matchesQuery = !normalized || [track.category, track.title, track.description, track.modes].some((field) => field.toLowerCase().includes(normalized));
      return matchesSaved && matchesQuery;
    });
  }, [bookmarks, query, showSaved, tracks]);

  return (
    <section className="stack-md">
      <div className="browser-toolbar glass-panel">
        <div>
          <span className="eyebrow">Daftar Materi</span>
          <h2>Pilih materi yang paling relevan</h2>
        </div>
        <div className="browser-toolbar__actions">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kategori, mode, atau judul materi..." />
          <button type="button" className={showSaved ? "filter-pill filter-pill--active" : "filter-pill"} onClick={() => setShowSaved((current) => !current)}>
            Tersimpan saja
          </button>
        </div>
      </div>
      <div className="content-grid content-grid--three">
        {filtered.map((track) => {
          const progress = getRouteProgress(track.href);

          return (
            <article key={track.href} className="glass-panel card-surface card-surface--interactive">
              <div className="card-surface__head">
                <span className="card-tag">{track.category}</span>
                <BookmarkToggle item={{ key: `material:${track.href}`, label: track.title, href: track.href }} />
              </div>
              <h3>{track.title}</h3>
              <p>{track.description}</p>
              <div className="meta-row">
                <span>{track.moduleCount} modul</span>
                <span>{track.questionCount} item</span>
              </div>
              <p className="sub-copy">Mode dominan: {track.modes}</p>
              <div className="progress-chip-row">
                <span className="progress-chip">Progres {progress}%</span>
              </div>
              <DepthButton href={track.href} tone="ghost" size="sm">
                Buka materi
              </DepthButton>
            </article>
          );
        })}
      </div>
    </section>
  );
}
