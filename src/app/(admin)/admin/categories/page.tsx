import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Sections" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Sections" description="Sections group posts — for example News & Stories, Division Memoranda or Bids & Awards. Each section has its own page at /its-address." />
      <Suspense fallback={<Skeleton className="h-80 rounded-2xl" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("articles").select("category_id"),
  ]);
  const usage: Record<string, number> = {};
  for (const r of counts ?? []) if (r.category_id) usage[r.category_id] = (usage[r.category_id] ?? 0) + 1;
  return <CategoriesManager categories={(categories ?? []) as Category[]} usage={usage} />;
}
