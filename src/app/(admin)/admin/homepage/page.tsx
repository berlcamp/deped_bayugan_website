import { Suspense } from "react";
import type { Metadata } from "next";
import { HomepageForm } from "@/components/admin/homepage-form";
import { PageHeader } from "@/components/admin/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

export const metadata: Metadata = { title: "Homepage" };

export default function HomepagePage() {
  return (
    <>
      <PageHeader title="Homepage" description="Edit the hero, highlights, superintendent’s message and the vision & mission band." />
      <Suspense fallback={<Skeleton className="h-[640px] rounded-2xl" />}>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").maybeSingle();
  return <HomepageForm settings={{ ...DEFAULT_SETTINGS, ...(data ?? {}) } as Settings} />;
}
