import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesManager } from "@/components/admin/services-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";

export const metadata: Metadata = { title: "Online services" };

export default function ServicesAdminPage() {
  return (
    <>
      <PageHeader
        title="Online services"
        description="Systems listed on the homepage and at /services. Mark up to four to show as quick links in the hero."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Loader />
      </Suspense>
    </>
  );
}

async function Loader() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("*").order("sort_order").order("title");
  return <ServicesManager services={(data ?? []) as Service[]} />;
}
