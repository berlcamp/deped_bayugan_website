import type { Metadata } from "next";
import Link from "next/link";
import "./(site)/site.css";

export const metadata: Metadata = { title: "Page not found | DepEd Bayugan", robots: { index: false } };

// Rendered for URLs that neither the site nor the admin layout matches.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="container not-found">
          <h1>Page not found</h1>
          <p>The page you’re looking for doesn’t exist.</p>
          <Link className="btn btn-primary" href="/">
            Go to DepEd Bayugan
          </Link>
        </main>
      </body>
    </html>
  );
}
