"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useExperience } from "@/lib/experience";

export function ReadingProgressBar() {
  const pathname = usePathname();
  const { getRouteProgress, setRouteProgress } = useExperience();
  const [liveProgress, setLiveProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextValue = documentHeight <= 0 ? 0 : Math.round((window.scrollY / documentHeight) * 100);
      setLiveProgress(nextValue);
      setRouteProgress(pathname, nextValue);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname, setRouteProgress]);

  const storedProgress = useMemo(() => getRouteProgress(pathname), [getRouteProgress, pathname]);
  const progress = Math.max(liveProgress, storedProgress);

  return (
    <div className="reading-progress" aria-hidden="true">
      <div className="reading-progress__bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
