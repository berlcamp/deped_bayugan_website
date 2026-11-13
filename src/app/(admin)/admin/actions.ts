"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentStaff } from "@/lib/auth";
import { TAGS } from "@/lib/data/public";
import { readingMinutes, slugify } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus, Role, Staff } from "@/lib/types";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function staffOrFail(): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=not_invited");
  return staff;
}

async function adminOrFail(): Promise<Staff | null> {
  const staff = await staffOrFail();
  return staff.role === "admin" ? staff : null;
}

const friendly = (message: string) => {
  if (/row-level security|permission denied|42501/i.test(message)) return "You don't have permission to do that.";
  if (/duplicate key/i.test(message)) return "That already exists.";
  return message;
};

function refreshArticles(...slugs: (string | null | undefined)[]) {
  updateTag(TAGS.articles);
  for (const s of slugs) if (s) updateTag(`article:${s}`);
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

const httpUrl = (message: string) =>
  z.string().trim().url(message).refine((v) => /^https?:\/\//i.test(v), message);

const articleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200),
  slug: z.string().trim().max(90).optional().default(""),
  excerpt: z.string().trim().max(400).nullable().optional(),
  content: z.string().max(400_000),
  cover_image_url: httpUrl("The cover image must be a web link.").nullable().optional().or(z.literal("")),
  cover_image_alt: z.string().trim().max(300).nullable().optional(),
  cover_caption: z.string().trim().max(400).nullable().optional(),
  reference_no: z.string().trim().max(120).nullable().optional(),
  attachment_url: httpUrl("The attachment must be a web link.").nullable().optional().or(z.literal("")),
  attachment_name: z.string().trim().max(200).nullable().optional(),
  category_id: z.string().uuid().nullable().optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  seo_title: z.string().trim().max(120).nullable().optional(),
  seo_description: z.string().trim().max(300).nullable().optional(),
  author_name: z.string().trim().max(120).nullable().optional(),
  is_featured: z.boolean().optional(),
  is_breaking: z.boolean().optional(),
  intent: z.enum(["save", "submit", "publish", "unpublish"]),
});
export type ArticleInput = z.input<typeof articleInput>;

export async function saveArticle(raw: ArticleInput): Promise<ActionResult<{ id: string; slug: string; status: ArticleStatus }>> {
  const staff = await staffOrFail();
  const parsed = articleInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const input = parsed.data;
  const isAdmin = staff.role === "admin";
  const supabase = await createClient();

  const content = sanitizeArticleHtml(input.content);
  const goingLive = input.intent === "submit" || input.intent === "publish";
  if (goingLive) {
    if (!input.title) return { ok: false, error: "Add a title before submitting." };
    if (!input.attachment_url && content.replace(/<[^>]*>/g, "").trim().length < 20)
      return { ok: false, error: "Write the post or attach a file before submitting." };
    if (!input.category_id) return { ok: false, error: "Choose a section for this post." };
  }

  let current: { status: ArticleStatus; slug: string } | null = null;
  if (input.id) {
    const { data } = await supabase.from("articles").select("status, slug, author_id").eq("id", input.id).maybeSingle();
    if (!data) return { ok: false, error: "Post not found, or you can't edit it." };
    if (!isAdmin) {
      if (data.author_id !== staff.id) return { ok: false, error: "You can only edit your own posts." };
      if (data.status === "published") {
        const { data: s } = await supabase.from("settings").select("auto_approve_editor_posts").maybeSingle();
        if (!s?.auto_approve_editor_posts) return { ok: false, error: "This post is live. Ask an admin to make changes." };
      }
    }
    current = data as { status: ArticleStatus; slug: string };
  }

  let status: ArticleStatus = current?.status ?? "draft";
  if (input.intent === "unpublish") status = "draft";
  if (goingLive) status = isAdmin ? "published" : "pending"; // the database applies auto-approve for editors
  if (input.intent === "save" && !isAdmin && current?.status === "rejected") status = "draft";

  const baseSlug = slugify(input.slug || input.title) || `post-${Date.now().toString(36)}`;
  const row = {
    title: input.title,
    excerpt: input.excerpt || null,
    content,
    cover_image_url: input.cover_image_url || null,
    cover_image_alt: input.cover_image_alt || null,
    cover_caption: input.cover_caption || null,
    reference_no: input.reference_no || null,
    attachment_url: input.attachment_url || null,
    attachment_name: input.attachment_name || null,
    category_id: input.category_id || null,
    tags: [...new Set(input.tags)],
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    reading_minutes: readingMinutes(content),
    status,
    // Only admins choose placement or a custom byline; editors always get their own name.
    ...(isAdmin ? { is_featured: !!input.is_featured, is_breaking: !!input.is_breaking, author_name: input.author_name || null } : {}),
  };

  // Retry with a suffix if the slug is taken (editors can't see other people's drafts to check first).
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug.slice(0, 74)}-${Math.random().toString(36).slice(2, 6)}`;
    const query = input.id
      ? supabase.from("articles").update({ ...row, slug }).eq("id", input.id)
      : supabase.from("articles").insert({ ...row, slug });
    const { data, error } = await query.select("id, slug, status").single();

    if (!error && data) {
      if (data.status === "published" || current?.status === "published") refreshArticles(data.slug, current?.slug);
      return { ok: true, id: data.id, slug: data.slug, status: data.status };
    }
    if (error && error.code === "23505" && /slug/.test(error.message)) continue;
    if (error?.code === "PGRST116") return { ok: false, error: "You can't edit this post right now." };
    return { ok: false, error: friendly(error?.message ?? "Could not save.") };
  }
  return { ok: false, error: "Couldn't find a free web address for this post. Try a different slug." };
}

export async function reviewArticle(id: string, decision: "approve" | "reject", note?: string): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can review posts." };
  if (decision === "reject" && !note?.trim()) return { ok: false, error: "Tell the editor what to change." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .update({ status: decision === "approve" ? "published" : "rejected", review_note: decision === "reject" ? note!.trim() : null })
    .eq("id", id)
    .eq("status", "pending")
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, error: friendly(error.message) };
  if (!data) return { ok: false, error: "This post isn't waiting for review anymore." };
  refreshArticles(data.slug);
  return { ok: true };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  await staffOrFail();
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").delete().eq("id", id).select("slug, status");
  if (error) return { ok: false, error: friendly(error.message) };
  if (!data?.length) return { ok: false, error: "You can't delete this post." };
  refreshArticles(data[0].slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sections (categories) — admin only
// ---------------------------------------------------------------------------

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Give the section a name.").max(60),
  slug: z.string().trim().max(60).optional().default(""),
  description: z.string().trim().max(300).nullable().optional(),
  layout: z.enum(["stories", "documents"]).default("stories"),
  show_in_nav: z.boolean().default(true),
});

export async function saveCategory(raw: z.input<typeof categoryInput>): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage sections." };
  const parsed = categoryInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { id, ...c } = parsed.data;
  const slug = slugify(c.slug || c.name);
  if (!slug) return { ok: false, error: "Use letters or numbers in the web address." };

  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("categories").update({ ...c, slug, description: c.description || null }).eq("id", id));
  } else {
    const { data: last } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    ({ error } = await supabase
      .from("categories")
      .insert({ ...c, slug, description: c.description || null, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }));
  }
  if (error) {
    if (error.code === "23505") return { ok: false, error: `The address /${slug} is already used by another section or page.` };
    if (error.code === "23514") return { ok: false, error: `/${slug} is reserved. Pick a different address.` };
    return { ok: false, error: friendly(error.message) };
  }
  updateTag(TAGS.categories);
  updateTag(TAGS.articles);
  return { ok: true };
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage sections." };
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, sort_order").order("sort_order").order("name");
  const list = data ?? [];
  const i = list.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  const results = await Promise.all(
    list.map((c, index) => supabase.from("categories").update({ sort_order: index + 1 }).eq("id", c.id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendly(failed.error.message) };
  updateTag(TAGS.categories);
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage sections." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.categories);
  updateTag(TAGS.articles);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Team — admin only. Invites are an allow-list: no email is sent.
// ---------------------------------------------------------------------------

const inviteInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["admin", "editor"]),
  full_name: z.string().trim().max(120).optional(),
});

export async function inviteStaff(raw: z.input<typeof inviteInput>): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can invite people." };
  const parsed = inviteInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .insert({ email: parsed.data.email, role: parsed.data.role, full_name: parsed.data.full_name || null });
  if (error) {
    if (error.code === "23505") return { ok: false, error: `${parsed.data.email} is already on the team.` };
    return { ok: false, error: friendly(error.message) };
  }
  return { ok: true };
}

export async function updateStaff(id: string, patch: { role?: Role; status?: "active" | "disabled" }): Promise<ActionResult> {
  const me = await adminOrFail();
  if (!me) return { ok: false, error: "Only admins can change roles." };
  if (id === me.id) return { ok: false, error: "You can't change your own role or access." };
  const clean: Record<string, string> = {};
  if (patch.role === "admin" || patch.role === "editor") clean.role = patch.role;
  if (patch.status === "active" || patch.status === "disabled") clean.status = patch.status;
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update(clean).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message.replace(/^.*?: /, "")) };
  return { ok: true };
}

export async function removeStaff(id: string): Promise<ActionResult> {
  const me = await adminOrFail();
  if (!me) return { ok: false, error: "Only admins can remove people." };
  if (id === me.id) return { ok: false, error: "You can't remove yourself." };
  const supabase = await createClient();
  const { error } = await supabase.from("staff").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings — admin only
// ---------------------------------------------------------------------------

const optionalUrl = (msg: string) => httpUrl(msg).nullable().or(z.literal(""));
const linkOrPath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^(\/|#|https?:\/\/)/.test(v), "Links must start with /, # or https://")
  .nullable();

const settingsInput = z
  .object({
    site_name: z.string().trim().min(1).max(60),
    tagline: z.string().trim().max(120),
    description: z.string().trim().max(300),
    auto_approve_editor_posts: z.boolean(),
    address: z.string().trim().max(300).nullable(),
    contact_email: z.string().trim().email("Enter a valid contact email.").nullable().or(z.literal("")),
    contact_phone: z.string().trim().max(80).nullable(),
    office_hours: z.string().trim().max(120).nullable(),
    map_url: optionalUrl("Enter the full map link."),
    facebook_url: optionalUrl("Enter the full Facebook page link."),
    youtube_url: optionalUrl("Enter the full YouTube channel link."),
    hero_eyebrow: z.string().trim().max(80),
    hero_title: z.string().trim().min(1, "The hero needs a title.").max(140),
    hero_highlight: z.string().trim().max(60),
    hero_subtitle: z.string().trim().max(400),
    hero_image_url: optionalUrl("The hero image must be a web link."),
    hero_primary_label: z.string().trim().max(40).nullable(),
    hero_primary_url: linkOrPath,
    hero_secondary_label: z.string().trim().max(40).nullable(),
    hero_secondary_url: linkOrPath,
    sds_name: z.string().trim().max(120).nullable(),
    sds_title: z.string().trim().max(120).nullable(),
    sds_photo_url: optionalUrl("The photo must be a web link."),
    sds_message: z.string().max(20_000).nullable(),
    mission: z.string().trim().max(2000).nullable(),
    vision: z.string().trim().max(2000).nullable(),
    core_values: z.string().trim().max(300).nullable(),
    highlights: z
      .array(z.object({ title: z.string().trim().min(1, "Each highlight needs a title.").max(60), text: z.string().trim().max(160) }))
      .max(4),
  })
  .partial();

export async function updateSettings(raw: z.input<typeof settingsInput>): Promise<ActionResult> {
  const me = await adminOrFail();
  if (!me) return { ok: false, error: "Only admins can change settings." };
  const parsed = settingsInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const patch: Record<string, unknown> = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v]));
  if (typeof patch.sds_message === "string") patch.sds_message = sanitizeArticleHtml(patch.sds_message);
  // Required text columns can't be null.
  for (const k of ["hero_eyebrow", "hero_highlight", "hero_subtitle", "tagline", "description"]) if (patch[k] === null) patch[k] = "";
  const supabase = await createClient();
  const { error } = await supabase.from("settings").update({ ...patch, updated_by: me.id }).eq("id", true);
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.settings);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pages — admin only
// ---------------------------------------------------------------------------

const pageInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Give the page a title.").max(200),
  slug: z.string().trim().max(90).optional().default(""),
  excerpt: z.string().trim().max(400).nullable().optional(),
  content: z.string().max(400_000),
  cover_image_url: httpUrl("The banner image must be a web link.").nullable().optional().or(z.literal("")),
  seo_title: z.string().trim().max(120).nullable().optional(),
  seo_description: z.string().trim().max(300).nullable().optional(),
  status: z.enum(["draft", "published"]),
});
export type PageInput = z.input<typeof pageInput>;

export async function savePage(raw: PageInput): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage pages." };
  const parsed = pageInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { id, ...p } = parsed.data;
  const slug = slugify(p.slug || p.title);
  if (!slug) return { ok: false, error: "Use letters or numbers in the web address." };
  const supabase = await createClient();

  let oldSlug: string | null = null;
  if (id) {
    const { data } = await supabase.from("pages").select("slug").eq("id", id).maybeSingle();
    oldSlug = data?.slug ?? null;
  }
  const row = {
    ...p,
    slug,
    content: sanitizeArticleHtml(p.content),
    excerpt: p.excerpt || null,
    cover_image_url: p.cover_image_url || null,
    seo_title: p.seo_title || null,
    seo_description: p.seo_description || null,
  };
  const { data, error } = await (id ? supabase.from("pages").update(row).eq("id", id) : supabase.from("pages").insert(row))
    .select("id, slug")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, error: `The address /${slug} is already used by another page or section.` };
    if (error.code === "23514") return { ok: false, error: `/${slug} is reserved. Pick a different address.` };
    return { ok: false, error: friendly(error.message) };
  }
  updateTag(TAGS.pages);
  updateTag(`page:${data.slug}`);
  if (oldSlug && oldSlug !== data.slug) updateTag(`page:${oldSlug}`);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function deletePage(id: string): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage pages." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").delete().eq("id", id).select("slug");
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.pages);
  if (data?.[0]) updateTag(`page:${data[0].slug}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Menu — admin only
// ---------------------------------------------------------------------------

const menuInput = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid().nullable().optional().or(z.literal("")),
  label: z.string().trim().min(1, "Give the menu item a label.").max(60),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^(\/|https?:\/\/|mailto:|tel:)/.test(v), "Links must start with /, https://, mailto: or tel:")
    .nullable()
    .optional(),
  description: z.string().trim().max(120).nullable().optional(),
  open_new_tab: z.boolean().default(false),
  is_visible: z.boolean().default(true),
});

export async function saveMenuItem(raw: z.input<typeof menuInput>): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage the menu." };
  const parsed = menuInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { id, ...m } = parsed.data;
  const row = { ...m, parent_id: m.parent_id || null, url: m.url || null, description: m.description || null };
  if (!row.parent_id && !row.url && id === undefined) {
    // A top-level item without a link becomes a dropdown heading — that's fine.
  }
  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("menu_items").update(row).eq("id", id));
  } else {
    let q = supabase.from("menu_items").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    q = row.parent_id ? q.eq("parent_id", row.parent_id) : q.is("parent_id", null);
    const { data: last } = await q;
    ({ error } = await supabase.from("menu_items").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }));
  }
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.menu);
  return { ok: true };
}

export async function moveMenuItem(id: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage the menu." };
  const supabase = await createClient();
  const { data: item } = await supabase.from("menu_items").select("id, parent_id").eq("id", id).maybeSingle();
  if (!item) return { ok: false, error: "Menu item not found." };
  let q = supabase.from("menu_items").select("id, sort_order").order("sort_order").order("label");
  q = item.parent_id ? q.eq("parent_id", item.parent_id) : q.is("parent_id", null);
  const { data } = await q;
  const list = data ?? [];
  const i = list.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  const results = await Promise.all(list.map((c, index) => supabase.from("menu_items").update({ sort_order: index + 1 }).eq("id", c.id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendly(failed.error.message) };
  updateTag(TAGS.menu);
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage the menu." };
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.menu);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Online services — admin only
// ---------------------------------------------------------------------------

const serviceInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Give the service a name.").max(80),
  description: z.string().trim().max(200).nullable().optional(),
  url: z
    .string()
    .trim()
    .min(1, "Add the link to the service.")
    .max(500)
    .refine((v) => /^(\/|https?:\/\/)/.test(v), "Links must start with / or https://"),
  icon: z.string().trim().max(40).default("globe"),
  badge: z.string().trim().max(20).nullable().optional(),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
});

export async function saveService(raw: z.input<typeof serviceInput>): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage services." };
  const parsed = serviceInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const { id, ...v } = parsed.data;
  const row = { ...v, description: v.description || null, badge: v.badge || null };
  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("services").update(row).eq("id", id));
  } else {
    const { data: last } = await supabase.from("services").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    ({ error } = await supabase.from("services").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }));
  }
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.services);
  return { ok: true };
}

export async function moveService(id: string, direction: "up" | "down"): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage services." };
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("id, sort_order").order("sort_order").order("title");
  const list = data ?? [];
  const i = list.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return { ok: true };
  [list[i], list[j]] = [list[j], list[i]];
  const results = await Promise.all(list.map((c, index) => supabase.from("services").update({ sort_order: index + 1 }).eq("id", c.id)));
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: friendly(failed.error.message) };
  updateTag(TAGS.services);
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  if (!(await adminOrFail())) return { ok: false, error: "Only admins can manage services." };
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  updateTag(TAGS.services);
  return { ok: true };
}

// ---------------------------------------------------------------------------

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
