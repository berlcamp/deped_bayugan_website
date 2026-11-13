"use client";

import { useEffect, useState } from "react";
import { formatDate, timeAgo } from "@/lib/format";

/**
 * Server renders a stable date (so pages stay cacheable); the browser swaps in
 * "12 min ago" after hydration.
 */
export function RelTime({ iso, withTime = false }: { iso: string | null; withTime?: boolean }) {
  const [label, setLabel] = useState(() => formatDate(iso, withTime));
  useEffect(() => {
    const update = () => setLabel(timeAgo(iso, Date.now()));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [iso]);
  if (!iso) return null;
  return (
    <time dateTime={iso} title={formatDate(iso, true)}>
      {label}
    </time>
  );
}
