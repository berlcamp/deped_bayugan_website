import { cn } from "@/lib/utils";
import type { ArticleStatus } from "@/lib/types";

const STYLES: Record<ArticleStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  pending: { label: "In review", className: "bg-warning-tint text-warning" },
  published: { label: "Published", className: "bg-success-tint text-success" },
  rejected: { label: "Needs changes", className: "bg-destructive/10 text-destructive" },
};

/** Status pill — always text + color, never color alone. */
export function StatusBadge({ status, className }: { status: ArticleStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold", s.className, className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export const STATUS_LABEL = Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, v.label])) as Record<ArticleStatus, string>;
