"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function FacebookIcon({ className = "i" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }} aria-hidden="true">
      <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="i" viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }} aria-hidden="true">
      <path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.8 2.3h7l4.8 6.4zm-1.2 17.9h1.9L7 4.2H5z" />
    </svg>
  );
}

const popup = (url: string) => window.open(url, "share", "width=620,height=560,noopener");

/** Always shares the canonical URL so Facebook reads that page's Open Graph tags. */
export function facebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="share" aria-label="Share this article">
      <button className="icon-btn fb" aria-label="Share on Facebook" onClick={() => popup(facebookShareUrl(url))}>
        <FacebookIcon />
      </button>
      <button
        className="icon-btn"
        aria-label="Share on X"
        onClick={() => popup(`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`)}
      >
        <XIcon />
      </button>
      <button className={`icon-btn${copied ? " copied" : ""}`} aria-label={copied ? "Link copied" : "Copy link"} onClick={copy}>
        {copied ? <Check className="i" /> : <Link2 className="i" />}
      </button>
      <button
        className="icon-btn"
        aria-label="More sharing options"
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({ title, url });
            } catch {}
          } else copy();
        }}
      >
        <Share2 className="i" />
      </button>
    </div>
  );
}

export function FacebookShareLink({ url }: { url: string }) {
  return (
    <a
      className="fb-share"
      href={facebookShareUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        popup(facebookShareUrl(url));
      }}
    >
      <FacebookIcon />
      Share on Facebook
    </a>
  );
}
