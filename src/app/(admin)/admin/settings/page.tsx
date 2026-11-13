import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Publishing rules, site identity and contact details. Homepage content has its own page." />
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        }
      >
        <SettingsLoader />
      </Suspense>
    </>
  );
}

async function SettingsLoader() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: settings }, { count: pendingCount }] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return <SettingsForm settings={settings as Settings} pendingCount={pendingCount ?? 0} />;
}
