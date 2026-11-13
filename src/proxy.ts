import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Keeps the Supabase session fresh and sends signed-out visitors from /admin to /login.
// Whether they're actually invited (and their role) is checked on the server in each admin page.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: DB_SCHEMA },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (!signedIn && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
