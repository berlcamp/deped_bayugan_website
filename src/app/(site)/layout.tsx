import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Fraunces, Public_Sans } from "next/font/google";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/site/brand";
import { SiteHeader, SiteHeaderStatic, TopBar } from "@/components/site/site-header";
import { FacebookIcon } from "@/components/site/share-buttons";
import { Year } from "@/components/site/year";
import { getCategories, getMenu, getServices, getSettings } from "@/lib/data/public";
import { SITE_URL } from "@/lib/supabase/config";
import "./site.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", weight: ["400", "500", "600", "700", "800"] });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", style: ["normal", "italic"], axes: ["opsz"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.site_name} — ${s.tagline}`, template: `%s | ${s.site_name}` },
    description: s.description,
    applicationName: s.site_name,
    robots: { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      siteName: s.site_name,
      type: "website",
      locale: "en_PH",
      title: `${s.site_name} — ${s.tagline}`,
      description: s.description,
      images: [{ url: s.hero_image_url || "/cover.jpg", alt: s.site_name }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a2a5e" },
    { media: "(prefers-color-scheme: dark)", color: "#061a3a" },
  ],
};

// Applies a saved theme before first paint (no flash). Without one, the system setting applies via CSS.
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [menu, settings, categories, services] = await Promise.all([getMenu(), getSettings(), getCategories(), getServices()]);
  const aboutLinks = menu.find((m) => /about/i.test(m.label))?.children ?? [];

  return (
    <html lang="en" className={`${publicSans.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <TopBar facebookUrl={settings.facebook_url} />
        <Suspense fallback={<SiteHeaderStatic menu={menu} brand={<Brand name={settings.site_name} tagline={settings.tagline} />} />}>
          <SiteHeader menu={menu} brand={<Brand name={settings.site_name} tagline={settings.tagline} />} />
        </Suspense>
        {children}

        <footer className="site-footer">
          <div className="container f-top">
            <div>
              <div className="brand">
                <span className="brand-logos" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/deped.png" alt="" width={46} height={46} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logos/bayugan.png" alt="" width={46} height={46} />
                </span>
                <span className="brand-text">
                  <small>Department of Education</small>
                  <strong>{settings.site_name}</strong>
                  <span>{settings.tagline}</span>
                </span>
              </div>
              <p className="about">{settings.description}</p>
              {(settings.facebook_url || settings.youtube_url) && (
                <div className="socials">
                  {settings.facebook_url && (
                    <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook page">
                      <FacebookIcon />
                    </a>
                  )}
                  {settings.youtube_url && (
                    <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube channel">
                      <svg className="i" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <nav aria-labelledby="f-about">
              <h2 id="f-about">The Division</h2>
              <ul>
                {aboutLinks.map((l) => (
                  <li key={l.id}>
                    <Link href={l.url ?? "/"}>{l.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/search">Search the site</Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="f-issuances">
              <h2 id="f-issuances">Posts & issuances</h2>
              <ul>
                {categories.filter((c) => c.show_in_nav).map((c) => (
                  <li key={c.id}>
                    <Link href={`/${c.slug}`}>{c.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2>Contact</h2>
              <ul>
                {settings.address && (
                  <li style={{ display: "flex", gap: 10 }}>
                    <MapPin className="i" aria-hidden="true" style={{ marginTop: 4 }} />
                    <span>{settings.address}</span>
                  </li>
                )}
                {settings.contact_phone && (
                  <li style={{ display: "flex", gap: 10 }}>
                    <Phone className="i" aria-hidden="true" style={{ marginTop: 6 }} />
                    <a href={`tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`}>{settings.contact_phone}</a>
                  </li>
                )}
                {settings.contact_email && (
                  <li style={{ display: "flex", gap: 10 }}>
                    <Mail className="i" aria-hidden="true" style={{ marginTop: 6 }} />
                    <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>
                  </li>
                )}
                {settings.office_hours && (
                  <li style={{ display: "flex", gap: 10 }}>
                    <Clock className="i" aria-hidden="true" style={{ marginTop: 4 }} />
                    <span>{settings.office_hours}</span>
                  </li>
                )}
              </ul>
              {services.length > 0 && (
                <p style={{ marginTop: 16 }}>
                  <Link href="/services">All online services →</Link>
                </p>
              )}
            </div>
          </div>
          <div className="container f-bottom">
            <span>
              © <Year /> {settings.site_name} · {settings.tagline}
            </span>
            <span>
              <Link href="/data-privacy">Data privacy</Link> · <Link href="/login">Staff sign in</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
