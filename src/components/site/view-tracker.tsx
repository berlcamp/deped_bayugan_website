"use client";

import { useEffect } from "react";
import { recordView } from "@/app/(site)/actions";

/** Counts one view per article per browser session (feeds "Most Read"). */
export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `viewed:${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    recordView(articleId).catch(() => {});
  }, [articleId]);
  return null;
}
