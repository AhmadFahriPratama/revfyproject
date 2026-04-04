"use client";

import Link from "next/link";
import { useState } from "react";

import { useExperience } from "@/lib/experience";

export function BookmarkDrawer() {
  const { bookmarks, toggleBookmark } = useExperience();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="orbit-dock__button" onClick={() => setOpen((current) => !current)}>
        <span>Tersimpan</span>
        <strong>{bookmarks.length}</strong>
      </button>
      {open ? (
        <div className="bookmark-drawer">
          <div className="bookmark-drawer__panel glass-panel">
            <div className="bookmark-drawer__head">
              <div>
                <span className="eyebrow">Tersimpan</span>
                <h2>Bookmark Anda</h2>
              </div>
              <button type="button" className="command-palette__close" onClick={() => setOpen(false)}>
                Tutup
              </button>
            </div>
            <div className="bookmark-drawer__list">
              {bookmarks.length > 0 ? (
                bookmarks.map((item) => (
                  <div key={item.key} className="bookmark-drawer__item">
                    <Link href={item.href}>
                      <strong>{item.label}</strong>
                      <p>{item.href}</p>
                    </Link>
                    <button type="button" className="bookmark-drawer__remove" onClick={() => toggleBookmark(item)}>
                      Hapus
                    </button>
                  </div>
                ))
              ) : (
                <div className="bookmark-drawer__empty">
                  <strong>Belum ada bookmark</strong>
                  <p>Simpan materi atau tryout yang ingin dibuka lagi dengan cepat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
