// All CMS tables live in this schema; the Supabase project is shared with other apps.
export const DB_SCHEMA = "deped_bayugan" as const;
export const MEDIA_BUCKET = "deped_bayugan_public";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
