import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileText, PenSquare, Search, Star, Zap } from "lucide-react";
import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RelTime } from "@/components/site/rel-time";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Posts" };

const PER_PAGE = 20;
const TABS: { value: ArticleStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending", label: "In review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Needs changes" },
];

type SP = PageProps<"/admin/articles">["searchParams"];

export default function ArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ArticlesList searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function ArticlesList({ searchParams }: { searchParams: SP }) {
  const [me, sp] = await Promise.all([requireStaff(), searchParams]);
  const isAdmin = me.role === "admin";
  const status = (TABS.some((t) => t.value === one(sp.status)) ? one(sp.status) : "all") as ArticleStatus | "all";
  const q = one(sp.q).trim();
  const page = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("id,title,slug,status,is_featured,is_breaking,author_name,author_id,updated_at,published_at,review_note,category:categories(name,slug)", {
      count: "exact",
    })
    .order(status === "pending" ? "submitted_at" : "updated_at", { ascending: status === "pending" })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (!isAdmin) query = query.eq("author_id", me.id);
  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`);

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as {
    id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    is_featured: boolean;
    is_breaking: boolean;
    author_name: string | null;
    author_id: string | null;
    updated_at: string;
    published_at: string | null;
    review_note: string | null;
    category: { name: string; slug: string } | null;
  }[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PER_PAGE));
  const href = (patch: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: status === "all" ? undefined : status, q: q || undefined, page: undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && v !== "all") p.set(k, String(v));
    const s = p.toString();
    return `/admin/articles${s ? `?${s}` : ""}`;
  };

  const title = status === "pending" && isAdmin ? "Review queue" : isAdmin ? "All posts" : "My posts";

  return (
    <>
      <PageHeader
        title={title}
        description={
          status === "pending" && isAdmin
            ? "Posts editors have submitted. Open one to approve it or send it back with notes."
            : isAdmin
              ? "Every post in the website, newest first."
              : "Drafts, submissions and published posts you’ve written."
        }
        actions={
          <Link href="/admin/articles/new" className={cn(buttonVariants(), "h-10 gap-2 rounded-xl px-4")}>
            <PenSquare className="size-4" /> New post
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={href({ status: t.value })}
              aria-current={status === t.value ? "page" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors hover:bg-muted",
                status === t.value && "border-foreground bg-foreground text-background hover:bg-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/articles" className="relative md:w-72" role="search">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="article-search" className="sr-only">
            Search posts by title
          </label>
          <input
            id="article-search"
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </form>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn’t load posts: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold">{q ? `No posts match “${q}”` : status === "pending" ? "Nothing waiting for review" : "No posts here yet"}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {q ? "Try a different word from the title." : "New posts start as drafts. Submit one when it’s ready."}
          </p>
          {!q && (
            <Link href="/admin/articles/new" className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-10 rounded-xl")}>
              Write a post
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <ul className="divide-y">
            {rows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-5">
                <Link href={`/admin/articles/${a.id}`} className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{a.title || "Untitled post"}</span>
                    {a.is_featured && <Star className="size-3.5 shrink-0 fill-brand text-brand" aria-label="Featured" />}
                    {a.is_breaking && <Zap className="size-3.5 shrink-0 fill-brand text-brand" aria-label="In announcement bar" />}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {a.category?.name ?? "No section"}
                    {isAdmin && a.author_name ? ` · ${a.author_name}` : ""} · edited <RelTime iso={a.updated_at} />
                    {a.status === "rejected" && a.review_note ? ` · “${a.review_note}”` : ""}
                  </span>
                </Link>
                <StatusBadge status={a.status} className="hidden sm:inline-flex" />
                <ArticleRowActions
                  id={a.id}
                  title={a.title}
                  publicHref={a.status === "published" ? `/${a.category?.slug ?? "news"}/${a.slug}` : null}
                  canDelete={isAdmin || a.status !== "published"}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-lg")} href={href({ page: page - 1 })}>
              Previous
            </Link>
          )}
          <span className="px-3 text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link className={cn(buttonVariants({ variant: "outline" }), "h-9 rounded-lg")} href={href({ page: page + 1 })}>
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-9 w-52" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-5 space-y-px overflow-hidden rounded-2xl border">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-card px-5 py-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
