import Link from "next/link";
import { Download } from "lucide-react";
import { Thumb } from "@/components/site/thumb";
import { articlePath, formatDate } from "@/lib/format";
import type { ArticleCard } from "@/lib/types";

type H = 2 | 3;

export function StoryCard({ a, variant = "grid", heading = 3, priority }: { a: ArticleCard; variant?: "grid" | "lead" | "row"; heading?: H; priority?: boolean }) {
  const Heading = `h${heading}` as const;
  const cls = variant === "lead" ? "story story-lead" : variant === "row" ? "story story-row" : "story";
  return (
    <article className={cls}>
      <Thumb
        src={a.cover_image_url}
        alt={a.cover_image_alt}
        priority={priority}
        sizes={variant === "lead" ? "(max-width: 1024px) 100vw, 640px" : variant === "row" ? "200px" : "(max-width: 700px) 100vw, 380px"}
      />
      <div className="body">
        {a.category && <span className="tag">{a.category.name}</span>}
        <Heading>
          <Link href={articlePath(a)}>{a.title}</Link>
        </Heading>
        {a.excerpt && <p className="ex">{a.excerpt}</p>}
        <p className="meta">
          <time dateTime={a.published_at ?? undefined}>{formatDate(a.published_at)}</time>
        </p>
      </div>
    </article>
  );
}

export function DocRow({ a, heading = 3, showSection = true }: { a: ArticleCard; heading?: H; showSection?: boolean }) {
  const Heading = `h${heading}` as const;
  const d = a.published_at ? new Date(a.published_at) : null;
  return (
    <li className="doc-row">
      <span className="doc-date" aria-hidden="true">
        <span>
          <b>{d ? d.toLocaleDateString("en-US", { day: "2-digit", timeZone: "Asia/Manila" }) : "—"}</b>
          <small>{d ? d.toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Manila" }) : ""}</small>
        </span>
      </span>
      <div style={{ minWidth: 0 }}>
        <p className="doc-meta">
          {a.reference_no && <span className="ref">{a.reference_no}</span>}
          {showSection && a.category && <span>{a.category.name}</span>}
          <time dateTime={a.published_at ?? undefined}>{formatDate(a.published_at)}</time>
        </p>
        <Heading>
          <Link href={articlePath(a)}>{a.title}</Link>
        </Heading>
      </div>
      {a.attachment_url && (
        <a className="file" href={a.attachment_url} target="_blank" rel="noopener noreferrer" aria-label={`Download file for ${a.title}`}>
          <Download className="i" aria-hidden="true" /> File
        </a>
      )}
    </li>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid-cards" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel" style={{ height: 320, borderRadius: 14 }} />
      ))}
    </div>
  );
}
