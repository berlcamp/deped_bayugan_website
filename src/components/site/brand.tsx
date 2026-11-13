import Link from "next/link";

/** DepEd + Bayugan seals with the site name. */
export function Brand({ name, tagline }: { name: string; tagline: string }) {
  return (
    <Link href="/" className="brand" aria-label={`${name} home`}>
      <span className="brand-logos" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/deped.png" alt="" width={46} height={46} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/bayugan.png" alt="" width={46} height={46} />
      </span>
      <span className="brand-text">
        <small>Department of Education</small>
        <strong>{name}</strong>
        <span>{tagline}</span>
      </span>
    </Link>
  );
}
