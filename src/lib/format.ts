import { SITE_URL } from "./supabase/config";

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function readingMinutes(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "12 min ago", "3 hrs ago", or a date once it's older than a week. */
export function timeAgo(iso: string | null, now: number) {
  if (!iso) return "";
  const diff = (new Date(iso).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(iso);
}

export function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function articlePath(a: { slug: string; category: { slug: string } | null }) {
  return `/${a.category?.slug ?? "news"}/${a.slug}`;
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
