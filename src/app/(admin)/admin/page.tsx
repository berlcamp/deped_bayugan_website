import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Eye, FilePen, Files, Home, LayoutGrid, ListTree, Newspaper, PenSquare, Zap } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { RelTime } from "@/components/site/rel-time";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const [me, sp] = await Promise.all([requireStaff(), searchParams]);
  const supabase = await createClient();
  const isAdmin = me.role === "admin";

  // Editors only see their own numbers; admins see the whole website.
  const countQuery = (status: ArticleStatus) => {
    const q = supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", status);
    return isAdmin ? q : q.eq("author_id", me.id);
  };
  const recentQuery = () => {
    const q = supabase.from("articles").select("id,title,status,updated_at,review_note");
    return (isAdmin ? q : q.eq("author_id", me.id)).order("updated_at", { ascending: false }).limit(6);
  };

  const [published, pending, drafts, rejected, settings, views, needsReview, recent] = await Promise.all([
    countQuery("published"),
    countQuery("pending"),
    countQuery("draft"),
    countQuery("rejected"),
    supabase.from("settings").select("auto_approve_editor_posts").maybeSingle(),
    supabase.from("article_views").select("views"),
    isAdmin
      ? supabase
          .from("articles")
          .select("id,title,author_name,submitted_at,category:categories(name)")
          .eq("status", "pending")
          .order("submitted_at", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] as never[] }),
    recentQuery(),
  ]);

  const totalViews = (views.data ?? []).reduce((sum, r) => sum + Number(r.views ?? 0), 0);
  const autoApprove = !!settings.data?.auto_approve_editor_posts;
  const recentRows = (recent.data ?? []) as { id: string; title: string; status: ArticleStatus; updated_at: string; review_note: string | null }[];
  const reviewRows = (needsReview.data ?? []) as unknown as { id: string; title: string; author_name: string | null; submitted_at: string | null; category: { name: string } | null }[];
  const firstName = (me.full_name ?? "").split(" ")[0];

  const stats = [
    { label: isAdmin ? "Published" : "My published", value: published.count ?? 0, icon: Newspaper, href: "/admin/articles?status=published", tone: "text-success bg-success-tint" },
    { label: "In review", value: pending.count ?? 0, icon: Clock, href: "/admin/articles?status=pending", tone: "text-warning bg-warning-tint" },
    { label: isAdmin ? "Drafts" : "My drafts", value: drafts.count ?? 0, icon: FilePen, href: "/admin/articles?status=draft", tone: "text-muted-foreground bg-muted" },
    { label: "Total reads", value: totalViews, icon: Eye, href: "/", tone: "text-brand bg-brand-tint" },
  ];

  return (
    <>
      {sp.denied && (
        <div role="alert" className="mb-6 rounded-xl border border-warning/30 bg-warning-tint px-4 py-3 text-sm text-warning">
          That page is for admins only.
        </div>
      )}
      <PageHeader
        title={firstName ? `Hi, ${firstName}` : "Welcome"}
        description={isAdmin ? "Here’s what’s happening on the DepEd Bayugan website." : "Write, submit and track your posts."}
        actions={
          <Link href="/admin/articles/new" className={cn(buttonVariants(), "h-10 gap-2 rounded-xl px-4")}>
            <PenSquare className="size-4" /> New post
          </Link>
        }
      />

      <PublishingModeBanner autoApprove={autoApprove} isAdmin={isAdmin} />

      <section aria-label="Stats" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl border bg-card p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(17,19,24,.07)] sm:p-5">
            <span className={cn("grid size-9 place-items-center rounded-xl", s.tone)}>
              <s.icon className="size-[18px]" aria-hidden="true" />
            </span>
            <p className="mt-4 font-heading text-3xl font-extrabold tabular-nums tracking-tight">{s.value.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </section>

      {isAdmin && (
        <section aria-labelledby="manage-h" className="mt-8">
          <h2 id="manage-h" className="mb-3 text-lg font-bold">Manage the website</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { href: "/admin/homepage", label: "Homepage", body: "Hero, highlights, message, mission & vision", icon: Home },
              { href: "/admin/pages", label: "Pages", body: "About us, Citizen’s Charter and other pages", icon: Files },
              { href: "/admin/menu", label: "Menu", body: "Header links and dropdowns", icon: ListTree },
              { href: "/admin/services", label: "Online services", body: "PRIME-HRM, SMS and other systems", icon: LayoutGrid },
            ].map((m) => (
              <Link key={m.href} href={m.href} className="flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-ring">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                  <m.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="text-sm text-muted-foreground">{m.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className={cn("mt-8 grid gap-6", isAdmin && "lg:grid-cols-2")}>
        {isAdmin && (
          <section className="rounded-2xl border bg-card" aria-labelledby="review-h">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 id="review-h" className="text-lg font-bold">Waiting for review</h2>
              <Link href="/admin/articles?status=pending" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Review queue <ArrowRight className="size-4" />
              </Link>
            </div>
            {reviewRows.length === 0 ? (
              <EmptyRow icon={CheckCircle2} title="All caught up" body="New submissions from editors will show up here." />
            ) : (
              <ul className="divide-y">
                {reviewRows.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/articles/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{a.title || "Untitled post"}</span>
                        <span className="text-sm text-muted-foreground">
                          {a.author_name ?? "Unknown"} · {a.category?.name ?? "No section"} · submitted <RelTime iso={a.submitted_at} />
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="rounded-2xl border bg-card" aria-labelledby="recent-h">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 id="recent-h" className="text-lg font-bold">{isAdmin ? "Recently updated" : "My recent posts"}</h2>
            <Link href="/admin/articles" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              All posts <ArrowRight className="size-4" />
            </Link>
          </div>
          {recentRows.length === 0 ? (
            <EmptyRow
              icon={PenSquare}
              title="No posts yet"
              body="Start your first post — it’s saved as a draft until you submit it."
              action={{ href: "/admin/articles/new", label: "Write a post" }}
            />
          ) : (
            <ul className="divide-y">
              {recentRows.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/articles/${a.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.title || "Untitled post"}</span>
                      <span className="text-sm text-muted-foreground">
                        Edited <RelTime iso={a.updated_at} />
                        {a.status === "rejected" && a.review_note ? ` · “${a.review_note.slice(0, 60)}”` : ""}
                      </span>
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!isAdmin && (rejected.count ?? 0) > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {rejected.count} of your posts need changes —{" "}
          <Link className="font-medium text-brand hover:underline" href="/admin/articles?status=rejected">
            see feedback
          </Link>
          .
        </p>
      )}
    </>
  );
}

function PublishingModeBanner({ autoApprove, isAdmin }: { autoApprove: boolean; isAdmin: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
      <span className={cn("grid size-8 place-items-center rounded-lg", autoApprove ? "bg-success-tint text-success" : "bg-warning-tint text-warning")}>
        <Zap className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1">
        <span className="font-semibold">{autoApprove ? "Auto-approve is on." : "Admin review is on."}</span>{" "}
        <span className="text-muted-foreground">
          {autoApprove ? "Posts editors submit go live right away." : "Posts editors submit wait for an admin to approve them."}
        </span>
      </p>
      {isAdmin && (
        <Link href="/admin/settings#publishing" className="font-medium text-brand hover:underline">
          Change
        </Link>
      )}
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action && (
        <Link href={action.href} className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-9 rounded-lg")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-80" />
      <Skeleton className="mt-8 h-14 w-full rounded-2xl" />
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
