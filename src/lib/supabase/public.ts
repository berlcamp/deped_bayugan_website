import "server-only";
import { createClient } from "@supabase/supabase-js";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "./config";

// Cookie-less, anonymous client for public reads. Safe to use inside "use cache"
// functions because it never touches the request.
export const publicDb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: DB_SCHEMA },
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
