import { Suspense } from "react";
import type { Metadata } from "next";
import { MenuManager } from "@/components/admin/menu-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem } from "@/lib/types";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage() {
  return (
    <>
      <PageHeader title="Menu" description="The links in the website header. Changes appear on the site right away." />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: items }, { data: pages }, { data: categories }, { data: services }] = await Promise.all([
    supabase.from("menu_items").select("*").order("sort_order").order("label"),
    supabase.from("pages").select("title,slug").order("title"),
    supabase.from("categories").select("name,slug").order("sort_order"),
    supabase.from("services").select("title,url").order("sort_order"),
  ]);
  const all = (items ?? []) as MenuItem[];
  const menu = all.filter((i) => !i.parent_id).map((t) => ({ ...t, children: all.filter((c) => c.parent_id === t.id) }));
  const links = [
    { label: "Home", url: "/", group: "Site" },
    { label: "Online services", url: "/services", group: "Site" },
    { label: "Search", url: "/search", group: "Site" },
    ...(pages ?? []).map((p) => ({ label: p.title as string, url: `/${p.slug}`, group: "Pages" })),
    ...(categories ?? []).map((c) => ({ label: c.name as string, url: `/${c.slug}`, group: "Sections" })),
    ...(services ?? []).filter((s) => /^https?:/.test(s.url)).map((s) => ({ label: s.title as string, url: s.url as string, group: "Online services" })),
  ];
  // Option values must be unique.
  const seen = new Set<string>();
  const unique = links.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
  return <MenuManager menu={menu} links={unique} />;
}
