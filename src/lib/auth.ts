import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Staff } from "@/lib/types";

/** The signed-in, active staff member — or null. Reads cookies: use inside <Suspense> or actions. */
export const getCurrentStaff = cache(async (): Promise<Staff | null> => {
  // Session checks read the clock (token expiry), so mark this as request-time work.
  await connection();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return (data as Staff) ?? null;
});

export async function requireStaff(): Promise<Staff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=not_invited");
  return staff;
}

export async function requireAdmin(): Promise<Staff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?denied=1");
  return staff;
}
