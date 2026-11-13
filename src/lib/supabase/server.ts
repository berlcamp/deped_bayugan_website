import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "./config";

// Request-scoped client that acts as the signed-in user (RLS applies).
// Reads cookies, so only call it inside <Suspense>, route handlers or server actions.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: DB_SCHEMA },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}
