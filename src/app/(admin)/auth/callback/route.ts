import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Staff } from "@/lib/types";

// Google redirects here. Exchange the code, then make sure this Google account
// was invited (claim_staff_access links it to its invite). Anyone else is signed out.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Set by the sign-in button. Only same-site admin paths are allowed (no open redirects).
  const raw = request.cookies.get("auth_next")?.value ?? searchParams.get("next");
  let nextParam = raw;
  try {
    nextParam = raw ? decodeURIComponent(raw) : null;
  } catch {}
  const next = nextParam && /^\/admin(\/|\?|$)/.test(nextParam) ? nextParam : "/admin";
  const done = (url: string) => {
    const res = NextResponse.redirect(url);
    res.cookies.set("auth_next", "", { path: "/auth/callback", maxAge: 0 });
    return res;
  };
  const fail = (error: string) => done(`${origin}/login?error=${error}`);

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

  return done(`${origin}${next}`);
}
