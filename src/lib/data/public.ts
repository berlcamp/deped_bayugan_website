import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicDb } from "@/lib/supabase/public";
import type { ArticleCard, ArticleWithCategory, Category, MenuItem, MenuNode, Page, Service, Settings } from "@/lib/types";

// Public reads are cached and invalidated by tag from the admin's server actions.
export const TAGS = {
  articles: "articles",
  categories: "categories",
  settings: "settings",
  pages: "pages",
  menu: "menu",
  services: "services",
} as const;

const PUBLIC_ARTICLE =
  "id,title,slug,excerpt,content,cover_image_url,cover_image_alt,cover_caption,reference_no,attachment_url,attachment_name,category_id,author_name,author_avatar_url,status,is_featured,is_breaking,tags,seo_title,seo_description,reading_minutes,published_at,created_at,updated_at";

const CARD =
  "id,title,slug,excerpt,cover_image_url,cover_image_alt,reference_no,attachment_url,author_name,published_at,reading_minutes,is_breaking,is_featured,category:categories(name,slug,layout)";
const CARD_INNER = CARD.replace("categories(", "categories!inner(");


export const DEFAULT_SETTINGS: Settings = {
  site_name: "DepEd Bayugan",
  tagline: "Schools Division of Bayugan City",
  description: "The official website of the Department of Education – Schools Division of Bayugan City, Caraga Region.",
  auto_approve_editor_posts: false,
  address: null,
  contact_email: null,
  contact_phone: null,
  office_hours: null,
  map_url: null,
  facebook_url: null,
  youtube_url: null,
  hero_eyebrow: "Schools Division of Bayugan City",
  hero_title: "Quality, accessible education for every learner of",
  hero_highlight: "Bayugan City",
  hero_subtitle: "",
  hero_image_url: null,
  hero_primary_label: null,
  hero_primary_url: null,
  hero_secondary_label: null,
  hero_secondary_url: null,
  sds_name: null,
  sds_title: null,
  sds_photo_url: null,
  sds_message: null,
  mission: null,
  vision: null,
  core_values: null,
  highlights: [],
  updated_at: "1970-01-01T00:00:00.000Z",
};

function report(where: string, error: unknown) {
  console.error(`[data] ${where}:`, error);
}

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);
  const { data, error } = await publicDb.from("settings").select("*").maybeSingle();
  if (error) report("getSettings", error);
  const merged = { ...DEFAULT_SETTINGS, ...(data ?? {}) } as Settings;
  if (!Array.isArray(merged.highlights)) merged.highlights = [];
  return merged;
}

export async function getMenu(): Promise<MenuNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.menu);
  const { data, error } = await publicDb.from("menu_items").select("*").eq("is_visible", true).order("sort_order").order("label");
  if (error) report("getMenu", error);
  const items = (data ?? []) as MenuItem[];
  return items
    .filter((i) => !i.parent_id)
    .map((top) => ({ ...top, children: items.filter((c) => c.parent_id === top.id) }));
}

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.services);
  const { data, error } = await publicDb.from("services").select("*").eq("is_visible", true).order("sort_order").order("title");
  if (error) report("getServices", error);
  return (data ?? []) as Service[];
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories);
  const { data, error } = await publicDb.from("categories").select("*").order("sort_order").order("name");
  if (error) report("getCategories", error);
  return (data ?? []) as Category[];
}

export async function getCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories);
  const { data, error } = await publicDb.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) report("getCategory", error);
  return (data as Category) ?? null;
}

export async function getPage(slug: string): Promise<Page | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages, `page:${slug}`);
  const { data, error } = await publicDb.from("pages").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) report("getPage", error);
  return (data as Page) ?? null;
}

export async function getPublishedPages(): Promise<Pick<Page, "slug" | "updated_at">[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages);
  const { data, error } = await publicDb.from("pages").select("slug,updated_at").eq("status", "published");
  if (error) report("getPublishedPages", error);
  return (data ?? []) as Pick<Page, "slug" | "updated_at">[];
}

/** Everything the homepage shows from posts, in one cached call. */
export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.articles, TAGS.categories);

  const [stories, documents, featured, announcements] = await Promise.all([
    publicDb.from("articles").select(CARD_INNER).eq("status", "published").eq("category.layout", "stories").order("published_at", { ascending: false }).limit(7),
    publicDb.from("articles").select(CARD_INNER).eq("status", "published").eq("category.layout", "documents").order("published_at", { ascending: false }).limit(6),
    publicDb.from("articles").select(CARD).eq("status", "published").eq("is_featured", true).order("published_at", { ascending: false }).limit(1),
    publicDb.from("articles").select(CARD).eq("status", "published").eq("is_breaking", true).order("published_at", { ascending: false }).limit(3),
  ]);
  for (const r of [stories, documents, featured, announcements]) if (r.error) report("getHomeData", r.error);

  const storyList = (stories.data ?? []) as unknown as ArticleCard[];
  const lead = ((featured.data ?? [])[0] as unknown as ArticleCard | undefined) ?? storyList[0] ?? null;
  return {
    lead,
    stories: storyList.filter((s) => s.id !== lead?.id).slice(0, 4),
    documents: (documents.data ?? []) as unknown as ArticleCard[],
    announcements: (announcements.data ?? []) as unknown as ArticleCard[],
  };
}

export async function getArticle(categorySlug: string, slug: string): Promise<ArticleWithCategory | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.articles, `article:${slug}`);
  const { data, error } = await publicDb.from("articles").select(`${PUBLIC_ARTICLE},category:categories(name,slug,layout)`).eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load post: ${error.message}`);
  const article = data as ArticleWithCategory | null;
  // The section in the URL must match, so each post has exactly one URL.
  if (!article || (article.category?.slug ?? "news") !== categorySlug) return null;
  return article;
}

export async function getRelated(categoryId: string | null, excludeId: string): Promise<ArticleCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.articles);
  let q = publicDb.from("articles").select(CARD).eq("status", "published").neq("id", excludeId).order("published_at", { ascending: false }).limit(3);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) report("getRelated", error);
  return (data ?? []) as unknown as ArticleCard[];
}

export async function getCategoryPage(slug: string, page: number, perPage = 12) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.articles, TAGS.categories);
  const from = (page - 1) * perPage;
  const { data, error, count } = await publicDb.from("articles").select(CARD_INNER, { count: "exact" }).eq("status", "published")
    .eq("category.slug", slug)
    .order("published_at", { ascending: false })
    .range(from, from + perPage - 1);
  if (error) report("getCategoryPage", error);
  return { items: (data ?? []) as unknown as ArticleCard[], total: count ?? 0, perPage };
}

/** Everything published, newest first — for sitemap.xml. */
export async function getAllPublished(limit = 5000) {
  "use cache";
  cacheLife("minutes");
  cacheTag(TAGS.articles);
  const { data, error } = await publicDb.from("articles").select("slug,updated_at,cover_image_url,category:categories(slug)").eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) report("getAllPublished", error);
  return (data ?? []) as unknown as Array<{ slug: string; updated_at: string; cover_image_url: string | null; category: { slug: string } | null }>;
}

/** Not cached: search results depend on the query and are cheap to compute. */
export async function searchSite(query: string) {
  const q = query.trim().slice(0, 120);
  if (!q) return { posts: [] as ArticleCard[], pages: [] as Pick<Page, "title" | "slug" | "excerpt">[] };
  const like = `%${q.replace(/[%_,()]/g, " ")}%`;
  const [posts, pages] = await Promise.all([
    publicDb.from("articles").select(CARD).eq("status", "published")
      .textSearch("search", q, { type: "websearch", config: "english" })
      .order("published_at", { ascending: false })
      .limit(30),
    publicDb.from("pages").select("title,slug,excerpt").eq("status", "published").or(`title.ilike.${like},excerpt.ilike.${like}`).limit(8),
  ]);
  if (posts.error) report("searchSite", posts.error);
  if (pages.error) report("searchSite", pages.error);
  return {
    posts: (posts.data ?? []) as unknown as ArticleCard[],
    pages: (pages.data ?? []) as Pick<Page, "title" | "slug" | "excerpt">[],
  };
}
