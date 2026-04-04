"use client";

import { useExperience } from "@/lib/experience";

export function BookmarkToggle({ item }: { item: { key: string; label: string; href: string } }) {
  const { isBookmarked, toggleBookmark } = useExperience();
  const active = isBookmarked(item.key);

  return (
    <button
      type="button"
      className={active ? "bookmark-toggle bookmark-toggle--active" : "bookmark-toggle"}
      onClick={() => toggleBookmark(item)}
      aria-label={active ? `Hapus bookmark ${item.label}` : `Simpan bookmark ${item.label}`}
    >
      <span>{active ? "Saved" : "Save"}</span>
    </button>
  );
}
