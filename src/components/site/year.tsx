import { cacheLife } from "next/cache";

/** Current year for the footer, cached for a day so pages can still be prerendered. */
export async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
