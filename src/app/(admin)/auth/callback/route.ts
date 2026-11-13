import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Staff } from "@/lib/types";

// Google redirects here. Exchange the code, then make sure this Google account
// was invited (claim_staff_access links it to its invite). Anyone else is signed out.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/admin") ? nextParam : "/admin";
  const fail = (error: string) => NextResponse.redirect(`${origin}/login?error=${error}`);

  if (!code) return fail("auth_failed");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("auth_failed");

  const { data } = await supabase.rpc("claim_staff_access");
  const staff = (data as Staff[] | null)?.[0];

  if (!staff || staff.status !== "active") {
    // Only end this app's session; the user may be signed in to other apps on the shared project.
    await supabase.auth.signOut({ scope: "local" });
    return fail(staff?.status === "disabled" ? "disabled" : "not_invited");
  }

  return NextResponse.redirect(`${origin}${next}`);
}
