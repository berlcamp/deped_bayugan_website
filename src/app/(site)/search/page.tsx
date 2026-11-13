import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocRow, StoryCard } from "@/components/site/cards";
import { PageHero } from "@/components/site/page-hero";
import { searchSite } from "@/lib/data/public";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main id="main">
      <PageHero title="Search" lead="Find memoranda, advisories, news and pages." crumbs={[{ label: "Search" }]}>
        <Suspense fallback={<SearchForm q="" />}>
          <SearchFormFromParams searchParams={searchParams} />
        </Suspense>
      </PageHero>
      <div className="container list-wrap">
        <Suspense fallback={<div className="skel" style={{ height: 240, borderRadius: 22 }} />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

function SearchForm({ q }: { q: string }) {
  return (
    <form action="/search" role="search" className="search-form">
      <label htmlFor="q" className="sr-only">
        Search
      </label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. DM No. 001, enrollment, bids" />
      <button className="btn btn-gold" type="submit">
        Search
      </button>
    </form>
  );
}

async function SearchFormFromParams({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  return <SearchForm q={typeof sp.q === "string" ? sp.q : ""} />;
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  if (!q) return <p style={{ color: "var(--muted)" }}>Type a word, title or memorandum number above.</p>;
  const { posts, pages } = await searchSite(q);
  const docs = posts.filter((p) => p.category?.layout === "documents");
  const stories = posts.filter((p) => p.category?.layout !== "documents");

  if (posts.length === 0 && pages.length === 0) {
    return (
      <div className="empty-state">
        <h2>No results for “{q}”</h2>
        <p>Try fewer or different words, or browse the menu.</p>
      </div>
    );
  }
  return (
    <>
      {pages.length > 0 && (
        <section className="result-group" aria-labelledby="r-pages">
          <h2 id="r-pages">Pages</h2>
          <ul className="page-results">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`}>
                  <b>{p.title}</b>
                  {p.excerpt && <small>{p.excerpt}</small>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {docs.length > 0 && (
        <section className="result-group" aria-labelledby="r-docs">
          <h2 id="r-docs">Issuances</h2>
          <div className="panel">
            <ul className="doc-list">
              {docs.map((d) => (
                <DocRow key={d.id} a={d} />
              ))}
            </ul>
          </div>
        </section>
      )}
      {stories.length > 0 && (
        <section className="result-group" aria-labelledby="r-news">
          <h2 id="r-news">News & announcements</h2>
          <div className="grid-cards">
            {stories.map((s) => (
              <StoryCard key={s.id} a={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
