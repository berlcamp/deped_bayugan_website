import Link from "next/link";

export function PageHero({
  title,
  lead,
  crumbs = [],
  image,
  children,
}: {
  title: string;
  lead?: string | null;
  crumbs?: { label: string; href?: string }[];
  image?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="hero-bg" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || "/cover.jpg"} alt="" />
      </div>
      <div className="container">
        <nav aria-label="Breadcrumb">
          <ol className="crumbs">
            <li>
              <Link href="/">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
            ))}
          </ol>
        </nav>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
