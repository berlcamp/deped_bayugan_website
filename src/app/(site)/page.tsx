import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Compass,
  Eye,
  FileText,
  Headset,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Quote,
  Target,
} from "lucide-react";
import { DocRow, StoryCard } from "@/components/site/cards";
import { JsonLd } from "@/components/site/json-ld";
import { ServiceIcon } from "@/components/site/icons";
import { getHomeData, getServices, getSettings } from "@/lib/data/public";
import { articlePath } from "@/lib/format";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { SITE_URL } from "@/lib/supabase/config";

const HIGHLIGHT_ICONS = [Compass, FileText, BadgeCheck, Headset];

const isExternal = (url: string) => /^https?:\/\//.test(url);

function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return isExternal(href) ? (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function HomePage() {
  const [settings, services, home] = await Promise.all([getSettings(), getServices(), getHomeData()]);
  const featuredServices = services.filter((s) => s.is_featured).slice(0, 4);
  const coreValues = (settings.core_values ?? "")
    .split(/[,·•|]/)
    .map((v) => v.trim())
    .filter(Boolean);
  const hasContact = settings.address || settings.contact_phone || settings.contact_email || settings.office_hours;

  return (
    <main id="main">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "GovernmentOrganization",
          name: settings.site_name,
          alternateName: settings.tagline,
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/logos/deped.png`,
          ...(settings.address ? { address: settings.address } : {}),
          ...(settings.contact_email ? { email: settings.contact_email } : {}),
          ...(settings.facebook_url ? { sameAs: [settings.facebook_url] } : {}),
        }}
      />

      {home.announcements.length > 0 && (
        <div className="announce" role="region" aria-label="Announcements">
          <div className="container">
            <span className="label">
              <Megaphone className="i" style={{ width: 13, height: 13 }} aria-hidden="true" /> Advisory
            </span>
            <ul>
              {home.announcements.map((a) => (
                <li key={a.id}>
                  <Link href={articlePath(a)}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" aria-hidden="true">
          {/* The hero photo is the LCP element; served as-is from /public or Supabase storage. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.hero_image_url || "/cover.jpg"} alt="" fetchPriority="high" />
        </div>
        <div className="container hero-inner">
          <div>
            <p className="eyebrow rise">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/deped.png" alt="" width={26} height={26} />
              {settings.hero_eyebrow}
            </p>
            <h1 id="hero-title" className="rise rise-2">
              {settings.hero_title} {settings.hero_highlight && <em>{settings.hero_highlight}</em>}
            </h1>
            {settings.hero_subtitle && <p className="lead rise rise-3">{settings.hero_subtitle}</p>}
            {(settings.hero_primary_label || settings.hero_secondary_label) && (
              <div className="hero-cta rise rise-4">
                {settings.hero_primary_label && settings.hero_primary_url && (
                  <SmartLink href={settings.hero_primary_url} className="btn btn-gold">
                    {settings.hero_primary_label} <ArrowRight className="i" aria-hidden="true" />
                  </SmartLink>
                )}
                {settings.hero_secondary_label && settings.hero_secondary_url && (
                  <SmartLink href={settings.hero_secondary_url} className="btn btn-ghost">
                    {settings.hero_secondary_label}
                  </SmartLink>
                )}
              </div>
            )}
            <div className="hero-seals rise rise-4">
              <span className="seals" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/bagong.png" alt="" width={40} height={40} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/deped.png" alt="" width={40} height={40} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/bayugan.png" alt="" width={40} height={40} />
              </span>
              <span>Bagong Pilipinas · DepEd · City of Bayugan</span>
            </div>
          </div>

          {featuredServices.length > 0 && (
            <aside className="portal-card rise rise-3" aria-labelledby="portal-title">
              <header>
                <div>
                  <p>Online services</p>
                  <h2 id="portal-title">Start a transaction</h2>
                </div>
                <span className="status-dot">Online</span>
              </header>
              {featuredServices.map((s) => (
                <SmartLink key={s.id} href={s.url} className="portal-link">
                  <span className="portal-icon">
                    <ServiceIcon name={s.icon} />
                  </span>
                  <span className="txt">
                    <b>
                      {s.title} {s.badge && <span className="pill">{s.badge}</span>}
                    </b>
                    {s.description && <small>{s.description}</small>}
                  </span>
                  <ArrowRight className="i" aria-hidden="true" style={{ opacity: 0.7 }} />
                </SmartLink>
              ))}
              <Link href="/services" className="portal-all">
                View all online services <ArrowRight className="i" aria-hidden="true" />
              </Link>
            </aside>
          )}
        </div>
      </section>

      {settings.highlights.length > 0 && (
        <div className="container highlights">
          <ul>
            {settings.highlights.slice(0, 4).map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
              return (
                <li key={h.title}>
                  <span className="h-icon">
                    <Icon className="i" aria-hidden="true" />
                  </span>
                  <span>
                    <b>{h.title}</b>
                    <p>{h.text}</p>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Issuances + message */}
      <section className="section" aria-labelledby="iss-title">
        <div className="container">
          <div className="sec-head">
            <div>
              <p className="kicker">Issuances & notices</p>
              <h2 id="iss-title" className="sec-title">
                Latest from the Division Office
              </h2>
              <p className="sec-desc">Memoranda, advisories and procurement postings, newest first. Download the signed copies where attached.</p>
            </div>
            <Link href="/division-memoranda" className="more-link">
              All memoranda <ArrowRight className="i" aria-hidden="true" />
            </Link>
          </div>

          <div className="split">
            <div className="panel">
              <div className="panel-head">
                <h3>Recent issuances</h3>
                <Link className="more-link" href="/search?q=memorandum" style={{ minHeight: 0, fontSize: 14 }}>
                  Search issuances
                </Link>
              </div>
              {home.documents.length > 0 ? (
                <ul className="doc-list">
                  {home.documents.map((d) => (
                    <DocRow key={d.id} a={d} />
                  ))}
                </ul>
              ) : (
                <p style={{ padding: 24, color: "var(--muted)" }}>No issuances posted yet.</p>
              )}
            </div>

            {settings.sds_message && (
              <article className="message" aria-labelledby="msg-title">
                <Quote className="quote" aria-hidden="true" />
                <h3 id="msg-title">A message from the Schools Division Superintendent</h3>
                <div className="body" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(settings.sds_message) }} />
                <div className="signer">
                  {settings.sds_photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.sds_photo_url} alt="" width={56} height={56} />
                  )}
                  <div>
                    <b>{settings.sds_name || "Office of the Schools Division Superintendent"}</b>
                    <small>{settings.sds_title || "Schools Division Superintendent"}</small>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      </section>

      {/* News */}
      {home.lead && (
        <section className="section section-alt" aria-labelledby="news-title">
          <div className="container">
            <div className="sec-head">
              <div>
                <p className="kicker">News & stories</p>
                <h2 id="news-title" className="sec-title">
                  Happenings across our schools
                </h2>
              </div>
              <Link href="/news" className="more-link">
                All stories <ArrowRight className="i" aria-hidden="true" />
              </Link>
            </div>
            <div className="news-grid">
              <StoryCard a={home.lead} variant="lead" />
              {home.stories.length > 0 && (
                <div className="story-stack">
                  {home.stories.slice(0, 3).map((s) => (
                    <StoryCard key={s.id} a={s} variant="row" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="section" id="online-services" aria-labelledby="svc-title">
          <div className="container">
            <div className="sec-head">
              <div>
                <p className="kicker">Online services</p>
                <h2 id="svc-title" className="sec-title">
                  Transact with the Division online
                </h2>
                <p className="sec-desc">Systems used by personnel, schools and applicants of the Schools Division of Bayugan City.</p>
              </div>
            </div>
            <div className="services-grid">
              {services.map((s) => (
                <article key={s.id} className="service">
                  <span className="s-icon">
                    <ServiceIcon name={s.icon} />
                  </span>
                  <h3>
                    <SmartLink href={s.url}>{s.title}</SmartLink>
                    {s.badge && <span className="pill">{s.badge}</span>}
                  </h3>
                  {s.description && <p>{s.description}</p>}
                  <span className="go" aria-hidden="true">
                    {isExternal(s.url) ? "Open system" : "Open"} <ArrowRight className="i" />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission / vision */}
      {(settings.mission || settings.vision) && (
        <section className="section identity" aria-labelledby="mv-title">
          <div className="container">
            <div className="sec-head">
              <div>
                <p className="kicker">Who we are</p>
                <h2 id="mv-title" className="sec-title">
                  Guided by the DepEd vision and mission
                </h2>
              </div>
              <Link href="/mission-vision" className="more-link" style={{ color: "#fff" }}>
                Read more <ArrowRight className="i" aria-hidden="true" />
              </Link>
            </div>
            <div className="mv-grid">
              {settings.vision && (
                <div className="mv">
                  <h3>
                    <Eye className="i" aria-hidden="true" /> Vision
                  </h3>
                  <p>{settings.vision}</p>
                </div>
              )}
              {settings.mission && (
                <div className="mv">
                  <h3>
                    <Target className="i" aria-hidden="true" /> Mission
                  </h3>
                  <p>{settings.mission}</p>
                </div>
              )}
            </div>
            {coreValues.length > 0 && (
              <>
                <h3 className="sr-only">Core values</h3>
                <ul className="values">
                  {coreValues.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {/* Visit */}
      {hasContact && (
        <section className="section" aria-labelledby="visit-title">
          <div className="container">
            <div className="visit">
              <div>
                <p className="kicker">Visit or reach us</p>
                <h2 id="visit-title" style={{ marginTop: 10 }}>
                  Schools Division Office of Bayugan City
                </h2>
                <p className="sec-desc">For requests, queries and documents, visit the office or contact the right unit through our directory.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
                  <Link className="btn btn-primary" href="/contact-us">
                    Contact us
                  </Link>
                  <Link className="btn btn-outline" href="/directory">
                    Office directory
                  </Link>
                </div>
              </div>
              <ul className="facts">
                {settings.address && (
                  <li>
                    <MapPin className="i" aria-hidden="true" />
                    {settings.map_url ? (
                      <a href={settings.map_url} target="_blank" rel="noopener noreferrer">
                        {settings.address}
                      </a>
                    ) : (
                      <span>{settings.address}</span>
                    )}
                  </li>
                )}
                {settings.office_hours && (
                  <li>
                    <Clock className="i" aria-hidden="true" /> <span>{settings.office_hours}</span>
                  </li>
                )}
                {settings.contact_phone && (
                  <li>
                    <Phone className="i" aria-hidden="true" />
                    <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`}>{settings.contact_phone}</a>
                  </li>
                )}
                {settings.contact_email && (
                  <li>
                    <Mail className="i" aria-hidden="true" />
                    <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
