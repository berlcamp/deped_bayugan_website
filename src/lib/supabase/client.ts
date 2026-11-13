import { createBrowserClient } from "@supabase/ssr";
import { DB_SCHEMA, SUPABASE_KEY, SUPABASE_URL } from "./config";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: DB_SCHEMA } });
}
