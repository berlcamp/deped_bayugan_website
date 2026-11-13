"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ExternalLink, Menu, Moon, Search, Sun, X } from "lucide-react";
import type { MenuNode } from "@/lib/types";

const isExternal = (url: string) => /^(https?:|mailto:|tel:)/.test(url);

function MenuLink({ href, newTab, className, children, onClick, current }: { href: string; newTab?: boolean; className?: string; children: React.ReactNode; onClick?: () => void; current?: boolean }) {
  if (isExternal(href) || newTab) {
    return (
      <a href={href} className={className} onClick={onClick} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

function isActive(pathname: string, item: MenuNode) {
  const match = (url: string | null) => !!url && !isExternal(url) && (url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`));
  return match(item.url) || item.children.some((c) => match(c.url));
}

function Dropdown({ item, active }: { item: MenuNode; active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const id = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A click on a menu that hover opened should keep it open, not toggle it shut.
  const openedByHover = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (ref.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const enter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) openedByHover.current = true;
    setOpen(true);
  };
  const leave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => {
      openedByHover.current = false;
      setOpen(false);
    }, 140);
  };

  return (
    <li
      ref={ref}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-controls={id}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          // Checked via the ref: hover-open and the click can land before a re-render.
          if (openedByHover.current) {
            openedByHover.current = false;
            setOpen(true);
            return;
          }
          openedByHover.current = false;
          setOpen((o) => !o);
        }}
      >
        {item.label} <ChevronDown className="chev" aria-hidden="true" />
      </button>
      <ul id={id} className={`dropdown${open ? " open" : ""}`}>
        {item.children.map((c) => (
          <li key={c.id}>
            <MenuLink href={c.url ?? "#"} newTab={c.open_new_tab} onClick={() => setOpen(false)}>
              <span>
                <b>
                  {c.label}
                  {c.open_new_tab && <ExternalLink className="ext" aria-label="(opens in a new tab)" />}
                </b>
                {c.description && <small>{c.description}</small>}
              </span>
            </MenuLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

function ThemeToggle() {
  // The icon is switched by CSS (see .on-light/.on-dark), so nothing here depends on the theme at render time.
  const toggle = () => {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  return (
    <button type="button" onClick={toggle} aria-label="Toggle light or dark mode">
      <Moon className="i on-light" aria-hidden="true" />
      <Sun className="i on-dark" aria-hidden="true" />
      <span className="hide-sm">Theme</span>
    </button>
  );
}

export function TopBar({ facebookUrl }: { facebookUrl: string | null }) {
  return (
    <div className="topbar">
      <div className="container">
        <p className="gov">
          <span className="flag" aria-hidden="true" />
          <span>Republic of the Philippines · Department of Education</span>
        </p>
        <div className="tools">
          {facebookUrl && (
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hide-sm">
              Facebook
            </a>
          )}
          <a href="https://www.deped.gov.ph" target="_blank" rel="noopener noreferrer" className="hide-sm">
            deped.gov.ph
          </a>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

type HeaderProps = { menu: MenuNode[]; brand: React.ReactNode };

/** Header that highlights the current section. Needs <Suspense> (reads the URL). */
export function SiteHeader(props: HeaderProps) {
  return <HeaderInner {...props} pathname={usePathname()} />;
}

/** Same header without the active-link highlight — the Suspense fallback during prerendering. */
export function SiteHeaderStatic(props: HeaderProps) {
  return <HeaderInner {...props} pathname="" />;
}

function HeaderInner({ menu, brand, pathname }: HeaderProps & { pathname: string }) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search) searchRef.current?.focus();
  }, [search]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    if (!q) return;
    setSearch(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="site-header">
        <div className="container bar">
          {brand}
          <nav className="main-nav" aria-label="Main">
            <ul>
              {menu.map((item) =>
                item.children.length > 0 ? (
                  <Dropdown key={item.id} item={item} active={isActive(pathname, item)} />
                ) : (
                  <li key={item.id}>
                    <MenuLink href={item.url ?? "/"} newTab={item.open_new_tab} className="nav-link" current={isActive(pathname, item)}>
                      {item.label}
                    </MenuLink>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="header-actions">
            <button type="button" className="icon-btn" aria-label="Search the site" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
              {search ? <X className="i" aria-hidden="true" /> : <Search className="i" aria-hidden="true" />}
            </button>
            <button type="button" className="icon-btn menu-btn" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <Menu className="i" aria-hidden="true" />
            </button>
          </div>
        </div>
        {search && (
          <div className="search-pop">
            <form className="container" role="search" onSubmit={submit}>
              <label htmlFor="site-search" className="sr-only">
                Search memoranda, news and pages
              </label>
              <input ref={searchRef} id="site-search" name="q" type="search" placeholder="Search memoranda, news and pages…" autoComplete="off" />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      <div className={`drawer-backdrop${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside className={`drawer${drawer ? " open" : ""}`} aria-label="Menu" aria-hidden={!drawer} inert={!drawer}>
        <div className="drawer-head">
          <b>Menu</b>
          <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setDrawer(false)}>
            <X className="i" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile">
          <ul>
            {menu.map((item) =>
              item.children.length > 0 ? (
                <li key={item.id}>
                  <details open={isActive(pathname, item)}>
                    <summary>
                      {item.label} <ChevronDown className="i chev" aria-hidden="true" />
                    </summary>
                    <ul>
                      {item.children.map((c) => (
                        <li key={c.id}>
                          <MenuLink href={c.url ?? "#"} newTab={c.open_new_tab} onClick={() => setDrawer(false)}>
                            {c.label}
                          </MenuLink>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ) : (
                <li key={item.id}>
                  <MenuLink href={item.url ?? "/"} newTab={item.open_new_tab} className="d-link" onClick={() => setDrawer(false)}>
                    {item.label}
                  </MenuLink>
                </li>
              ),
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
}
