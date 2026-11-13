"use server";

import { publicDb } from "@/lib/supabase/public";

export async function recordView(articleId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(articleId)) return;
  await publicDb.rpc("record_view", { p_article_id: articleId });
}
