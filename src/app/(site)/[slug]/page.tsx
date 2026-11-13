import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Headset } from "lucide-react";
import { DocRow, GridSkeleton, StoryCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { getCategory, getCategoryPage, getMenu, getPage } from "@/lib/data/public";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import type { Category, MenuNode, Page } from "@/lib/types";

type Props = PageProps<"/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [category, page] = await Promise.all([getCategory(slug), getPage(slug)]);
  if (category) {
    return {
      title: category.name,
      description: category.description ?? undefined,
      alternates: { canonical: `/${category.slug}` },
      openGraph: { url: `/${category.slug}`, title: category.name },
    };
  }
  if (page) {
    const title = page.seo_title || page.title;
    const description = page.seo_description || page.excerpt || undefined;
    return {
      title,
      description,
      alternates: { canonical: `/${page.slug}` },
      openGraph: { url: `/${page.slug}`, title, description, ...(page.cover_image_url ? { images: [page.cover_image_url] } : {}) },
    };
  }
  return { title: "Page not found", robots: { index: false } };
}

export default function SlugPage({ params, searchParams }: Props) {
  return (
    <main id="main">
      <Suspense fallback={<SlugSkeleton />}>
        <SlugContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function SlugSkeleton() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="skel" style={{ height: 14, width: 120, opacity: 0.3 }} />
          <div className="skel" style={{ height: 48, width: "min(520px, 80%)", marginTop: 18, opacity: 0.3 }} />
        </div>
      </section>
      <div className="container list-wrap">
        <GridSkeleton />
      </div>
    </>
  );
}

async function SlugContent({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (category) return <CategoryView category={category} searchParams={searchParams} />;
  const page = await getPage(slug);
  if (page) return <PageView page={page} />;
  notFound();
}

async function CategoryView({ category: c, searchParams }: { category: Category; searchParams: Props["searchParams"] }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(String(sp.page ?? "1"), 10) || 1);
  const docs = c.layout === "documents";
  const { items, total, perPage } = await getCategoryPage(c.slug, page, docs ? 20 : 12);
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <PageHero title={c.name} lead={c.description} crumbs={[{ label: c.name }]} />
      <div className="container list-wrap">
        <div className="toolbar">
          <span>
            {total} {docs ? (total === 1 ? "issuance" : "issuances") : total === 1 ? "post" : "posts"}
            {pages > 1 && ` · Page ${page} of ${pages}`}
          </span>
          <form action="/search" role="search" className="search-form" style={{ marginTop: 0, maxWidth: 420, flex: "1 1 280px" }}>
            <label htmlFor="cat-q" className="sr-only">
              Search {c.name}
            </label>
            <input id="cat-q" name="q" type="search" placeholder={`Search ${c.name.toLowerCase()}…`} />
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <h2>Nothing posted yet</h2>
            <p>New {c.name.toLowerCase()} will appear here as soon as they are published.</p>
          </div>
        ) : docs ? (
          <div className="panel">
            <ul className="doc-list">
              {items.map((a) => (
                <DocRow key={a.id} a={a} heading={2} showSection={false} />
              ))}
            </ul>
          </div>
        ) : (
          <div className="grid-cards">
            {items.map((a, i) => (
              <StoryCard key={a.id} a={a} heading={2} priority={i < 3} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav className="pager" aria-label="Pages">
            {page > 1 && <Link href={`/${c.slug}${page > 2 ? `?page=${page - 1}` : ""}`}>← Newer</Link>}
            <span>
              Page {page} of {pages}
            </span>
            {page < pages && <Link href={`/${c.slug}?page=${page + 1}`}>Older →</Link>}
          </nav>
        )}
      </div>
    </>
  );
}

/** The menu group this page belongs to, so visitors can move between sibling pages. */
function siblingsOf(menu: MenuNode[], slug: string) {
  const path = `/${slug}`;
  for (const top of menu) {
    if (top.children.some((c) => c.url === path)) return { title: top.label, items: top.children };
  }
  return null;
}

async function PageView({ page }: { page: Page }) {
  const menu = await getMenu();
  const group = siblingsOf(menu, page.slug);
  const html = sanitizeArticleHtml(page.content);

  return (
    <>
      <PageHero
        title={page.title}
        lead={page.excerpt}
        image={page.cover_image_url}
        crumbs={[...(group ? [{ label: group.title }] : []), { label: page.title }]}
      />
      <div className="container content-wrap">
        <article className="article-card">
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
        <aside className="side" aria-label="More in this section">
          {group && (
            <nav className="side-card" aria-labelledby="side-h">
              <h2 id="side-h">{group.title}</h2>
              <ul>
                {group.items.map((c) => {
                  const current = c.url === `/${page.slug}`;
                  const external = /^https?:/.test(c.url ?? "");
                  return (
                    <li key={c.id}>
                      {external ? (
                        <a href={c.url!} target="_blank" rel="noopener noreferrer">
                          {c.label} <ChevronRight className="i" aria-hidden="true" />
                        </a>
                      ) : (
                        <Link href={c.url ?? "/"} aria-current={current ? "page" : undefined}>
                          {c.label} <ChevronRight className="i" aria-hidden="true" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
          <div className="side-cta">
            <Headset className="i" aria-hidden="true" style={{ width: 28, height: 28, color: "var(--gold-400)" }} />
            <h2 style={{ marginTop: 12 }}>Need help?</h2>
            <p>Reach the Schools Division Office for queries, requests and documents.</p>
            <Link href="/contact-us" className="btn btn-gold">
              Contact us
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
