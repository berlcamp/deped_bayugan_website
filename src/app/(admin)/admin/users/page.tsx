import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { TeamManager } from "@/components/admin/team-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/supabase/config";
import type { Staff } from "@/lib/types";

export const metadata: Metadata = { title: "Team" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Team"
        description="Only people on this list can sign in. Invite someone with their Google email, then send them the sign-in link."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Team />
      </Suspense>
    </>
  );
}

async function Team() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("staff").select("*").order("is_super_admin", { ascending: false }).order("created_at");
  return <TeamManager staff={(data ?? []) as Staff[]} meId={me.id} loginUrl={`${SITE_URL}/login`} />;
}
