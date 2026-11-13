import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container not-found">
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or has been moved.</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/">
          Go to the homepage
        </Link>
        <Link className="btn btn-outline" href="/search">
          Search the site
        </Link>
      </div>
    </main>
  );
}
