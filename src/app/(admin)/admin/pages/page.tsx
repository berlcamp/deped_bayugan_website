import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FilePlus2, Files } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { RelTime } from "@/components/site/rel-time";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Page } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pages" };

export default function PagesPage() {
  return (
    <>
      <PageHeader
        title="Pages"
        description="Standalone pages such as About Us, Mission & Vision or the Citizen’s Charter. Link them from the header under Menu."
        actions={
          <Link href="/admin/pages/new" className={cn(buttonVariants(), "h-10 gap-2 rounded-xl px-4")}>
            <FilePlus2 className="size-4" /> New page
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select("id,title,slug,status,updated_at").order("title");
  const pages = (data ?? []) as Pick<Page, "id" | "title" | "slug" | "status" | "updated_at">[];
  if (error) return <p className="text-sm text-destructive">Couldn’t load pages: {error.message}</p>;
  if (pages.length === 0)
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <Files className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-semibold">No pages yet</p>
      </div>
    );
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <ul className="divide-y">
        {pages.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 sm:px-5">
            <Link href={`/admin/pages/${p.id}`} className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{p.title}</span>
              <span className="block truncate text-sm text-muted-foreground">
                /{p.slug} · edited <RelTime iso={p.updated_at} />
              </span>
            </Link>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                p.status === "published" ? "bg-success-tint text-success" : "bg-muted text-muted-foreground",
              )}
            >
              {p.status === "published" ? "Published" : "Draft"}
            </span>
            {p.status === "published" && (
              <a
                href={`/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-9 place-items-center rounded-lg hover:bg-muted"
                aria-label={`View ${p.title}`}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
