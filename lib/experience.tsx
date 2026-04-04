"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BookmarkItem = {
  key: string;
  label: string;
  href: string;
};

type ExperienceContextValue = {
  bookmarks: BookmarkItem[];
  routeProgress: Record<string, number>;
  isBookmarked: (key: string) => boolean;
  toggleBookmark: (item: BookmarkItem) => void;
  setRouteProgress: (pathname: string, progress: number) => void;
  getRouteProgress: (pathname: string) => number;
};

const bookmarksKey = "revfy.bookmarks.v1";
const progressKey = "revfy.route-progress.v1";

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

function readStorage<T>(key: string, fallback: T) {
  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [routeProgress, setRouteProgressState] = useState<Record<string, number>>({});

  useEffect(() => {
    setBookmarks(readStorage<BookmarkItem[]>(bookmarksKey, []));
    setRouteProgressState(readStorage<Record<string, number>>(progressKey, {}));
  }, []);

  const value = useMemo<ExperienceContextValue>(() => ({
    bookmarks,
    routeProgress,
    isBookmarked: (key) => bookmarks.some((item) => item.key === key),
    toggleBookmark: (item) => {
      setBookmarks((current) => {
        const exists = current.some((entry) => entry.key === item.key);
        const next = exists ? current.filter((entry) => entry.key !== item.key) : [item, ...current].slice(0, 16);
        window.localStorage.setItem(bookmarksKey, JSON.stringify(next));
        return next;
      });
    },
    setRouteProgress: (pathname, progress) => {
      setRouteProgressState((current) => {
        const newValue = Math.max(0, Math.min(progress, 100));
        if (current[pathname] === newValue) return current;
        
        const next = { ...current, [pathname]: newValue };
        window.localStorage.setItem(progressKey, JSON.stringify(next));
        return next;
      });
    },
    getRouteProgress: (pathname) => routeProgress[pathname] ?? 0,
  }), [bookmarks, routeProgress]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);

  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }

  return context;
}
