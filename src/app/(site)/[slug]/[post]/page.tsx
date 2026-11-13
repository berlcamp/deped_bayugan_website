import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, FileText, Hash, UserRound } from "lucide-react";
import { DocRow, StoryCard } from "@/components/site/cards";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { ShareButtons } from "@/components/site/share-buttons";
import { Thumb } from "@/components/site/thumb";
import { ViewTracker } from "@/components/site/view-tracker";
import { getArticle, getRelated, getSettings } from "@/lib/data/public";
import { absoluteUrl, articlePath, formatDate } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { SITE_URL } from "@/lib/supabase/config";

type Props = PageProps<"/[slug]/[post]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, post } = await params;
  const a = await getArticle(slug, post);
  if (!a) return { title: "Post not found", robots: { index: false } };
  const title = a.seo_title || a.title;
  const description = a.seo_description || a.excerpt || undefined;
  const path = articlePath(a);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title,
      description,
      publishedTime: a.published_at ?? undefined,
      modifiedTime: a.updated_at,
      section: a.category?.name,
      images: a.cover_image_url ? [a.cover_image_url] : ["/cover.jpg"],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function PostPage({ params }: Props) {
  return (
    <main id="main">
      <Suspense
        fallback={
          <section className="page-hero">
            <div className="container">
              <div className="skel" style={{ height: 48, width: "min(620px, 85%)", opacity: 0.3 }} />
            </div>
          </section>
        }
      >
        <PostBody params={params} />
      </Suspense>
    </main>
  );
}

async function PostBody({ params }: { params: Props["params"] }) {
  const { slug, post } = await params;
  const a = await getArticle(slug, post);
  if (!a) notFound();
  const settings = await getSettings();
  const url = absoluteUrl(articlePath(a));
  const html = sanitizeArticleHtml(a.content);
  const isDoc = a.category?.layout === "documents";

  return (
    <>
      <ViewTracker articleId={a.id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": isDoc ? "Article" : "NewsArticle",
          mainEntityOfPage: url,
          headline: a.title.slice(0, 110),
          description: a.seo_description || a.excerpt || undefined,
          image: [a.cover_image_url ?? absoluteUrl("/cover.jpg")],
          datePublished: a.published_at,
          dateModified: a.updated_at,
          articleSection: a.category?.name,
          publisher: { "@type": "GovernmentOrganization", name: settings.site_name, url: `${SITE_URL}/`, logo: `${SITE_URL}/logos/deped.png` },
        }}
      />
      <PageHero
        title={a.title}
        lead={a.excerpt}
        crumbs={[...(a.category ? [{ label: a.category.name, href: `/${a.category.slug}` }] : []), { label: isDoc ? a.reference_no || "Issuance" : "Story" }]}
      >
        <p className="post-meta">
          {a.reference_no && (
            <span>
              <Hash className="i" aria-hidden="true" /> {a.reference_no}
            </span>
          )}
          <span>
            <CalendarDays className="i" aria-hidden="true" />
            <time dateTime={a.published_at ?? undefined}>{formatDate(a.published_at)}</time>
          </span>
          {a.author_name && (
            <span>
              <UserRound className="i" aria-hidden="true" /> {a.author_name}
            </span>
          )}
        </p>
      </PageHero>

      <div className="container content-wrap">
        <article className="article-card">
          {a.cover_image_url && (
            <figure className="figure">
              <Thumb src={a.cover_image_url} alt={a.cover_image_alt} sizes="(max-width: 1024px) 100vw, 800px" priority />
              {a.cover_caption && <figcaption>{a.cover_caption}</figcaption>}
            </figure>
          )}
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

          {a.attachment_url && (
            <div className="attachment">
              <span className="a-icon">
                <FileText className="i" aria-hidden="true" />
              </span>
              <span className="txt">
                <b>{a.attachment_name || "Attached document"}</b>
                <small>Official copy · opens in a new tab</small>
              </span>
              <a className="btn btn-primary" href={a.attachment_url} target="_blank" rel="noopener noreferrer">
                <Download className="i" aria-hidden="true" /> Download
              </a>
            </div>
          )}

          <div className="share-row">
            <div className="topics" aria-label="Topics">
              {a.tags
                .filter((t) => t !== "sample")
                .map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}>
                    {t}
                  </Link>
                ))}
            </div>
            <ShareButtons url={url} title={a.title} />
          </div>
        </article>

        <aside className="side" aria-label="Related">
          <Suspense fallback={null}>
            <Related categoryId={a.category_id} excludeId={a.id} name={a.category?.name} slug={a.category?.slug} isDoc={isDoc} />
          </Suspense>
        </aside>
      </div>
    </>
  );
}

async function Related({ categoryId, excludeId, name, slug, isDoc }: { categoryId: string | null; excludeId: string; name?: string; slug?: string; isDoc: boolean }) {
  const items = await getRelated(categoryId, excludeId);
  if (items.length === 0) return null;
  return (
    <section className="side-card" aria-labelledby="rel-h" style={isDoc ? { padding: 0, overflow: "hidden" } : undefined}>
      <h2 id="rel-h" style={isDoc ? { padding: "20px 22px 4px" } : undefined}>
        More in {name ?? "this section"}
      </h2>
      {isDoc ? (
        <ul className="doc-list">
          {items.map((r) => (
            <DocRow key={r.id} a={r} showSection={false} />
          ))}
        </ul>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
          {items.map((r) => (
            <StoryCard key={r.id} a={r} />
          ))}
        </div>
      )}
      {slug && (
        <p style={isDoc ? { padding: "8px 22px 18px" } : { marginTop: 14 }}>
          <Link className="more-link" href={`/${slug}`}>
            View all →
          </Link>
        </p>
      )}
    </section>
  );
}
