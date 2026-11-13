import { Suspense } from "react";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  let pending = 0;
  if (staff.role === "admin") {
    const supabase = await createClient();
    const { count } = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "pending");
    pending = count ?? 0;
  }
  return (
    <AdminChrome
      staff={{ name: staff.full_name ?? staff.email, email: staff.email, avatar: staff.avatar_url, role: staff.role }}
      pendingCount={pending}
    >
      {children}
    </AdminChrome>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
        <Skeleton className="h-8 w-44" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
