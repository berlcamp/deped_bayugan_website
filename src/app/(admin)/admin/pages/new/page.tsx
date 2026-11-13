import { Suspense } from "react";
import type { Metadata } from "next";
import { PageEditor } from "@/components/admin/page-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New page" };

export default function NewPagePage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] rounded-2xl" />}>
      <Loader />
    </Suspense>
  );
}

async function Loader() {
  await requireAdmin();
  return <PageEditor page={null} />;
}
