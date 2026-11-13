import "server-only";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Everything the post editor needs besides the story itself. */
export async function getEditorContext() {
  const me = await requireStaff();
  const supabase = await createClient();
  const [{ data: categories }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,layout").order("sort_order").order("name"),
    supabase.from("settings").select("auto_approve_editor_posts,site_name").maybeSingle(),
  ]);
  return {
    me: { id: me.id, role: me.role, name: me.full_name ?? "" },
    categories: (categories ?? []) as { id: string; name: string; slug: string; layout: string }[],
    siteName: settings?.site_name ?? "DepEd Bayugan",
    autoApprove: !!settings?.auto_approve_editor_posts,
    supabase,
  };
}
