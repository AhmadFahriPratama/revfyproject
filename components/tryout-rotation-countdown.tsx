"use client";

import { useEffect, useMemo, useState } from "react";

function formatRemaining(totalMs: number) {
  const safeMs = Math.max(totalMs, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function TryoutRotationCountdown({ nextRefreshAt }: { nextRefreshAt: string }) {
  const target = useMemo(() => new Date(nextRefreshAt).getTime(), [nextRefreshAt]);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(target - Date.now(), 0));

  useEffect(() => {
    setRemainingMs(Math.max(target - Date.now(), 0));

    const interval = window.setInterval(() => {
      setRemainingMs(Math.max(target - Date.now(), 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [target]);

  return (
    <div className="rotation-countdown glass-inset" aria-live="polite">
      <span className="rotation-countdown__label">Cooldown lineup</span>
      <strong>{formatRemaining(remainingMs)}</strong>
      <p>Reset setiap hari pukul 00.00 WIB.</p>
    </div>
  );
}
