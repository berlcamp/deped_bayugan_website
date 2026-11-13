import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/page-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Page } from "@/lib/types";

export const metadata: Metadata = { title: "Edit page" };

export default function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
      <Loader params={params} />
    </Suspense>
  );
}

async function Loader({ params }: { params: PageProps<"/admin/pages/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <PageEditor key={data.id} page={data as Page} />;
}
