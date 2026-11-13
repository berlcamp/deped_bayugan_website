import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "@/components/site/icons";
import { PageHero } from "@/components/site/page-hero";
import { getServices } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Online Services",
  description: "Online systems of the Schools Division of Bayugan City for personnel, schools and applicants.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <main id="main">
      <PageHero
        title="Online Services"
        lead="Systems used by personnel, schools and applicants of the Schools Division of Bayugan City."
        crumbs={[{ label: "Online Services" }]}
      />
      <div className="container list-wrap">
        {services.length === 0 ? (
          <div className="empty-state">
            <h2>No services listed yet</h2>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((s) => {
              const external = /^https?:\/\//.test(s.url);
              return (
                <article key={s.id} className="service">
                  <span className="s-icon">
                    <ServiceIcon name={s.icon} />
                  </span>
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 18 }}>
                    {external ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ position: "static" }} className="svc-a">
                        {s.title}
                      </a>
                    ) : (
                      <Link href={s.url} className="svc-a">
                        {s.title}
                      </Link>
                    )}
                    {s.badge && <span className="pill">{s.badge}</span>}
                  </h2>
                  {s.description && <p>{s.description}</p>}
                  <span className="go" aria-hidden="true">
                    {external ? "Open system" : "Open"} <ArrowRight className="i" />
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
