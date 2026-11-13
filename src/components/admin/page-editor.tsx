"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { deletePage, savePage } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageField } from "@/components/admin/editor/fields";
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, slugify } from "@/lib/format";
import type { Page, PageStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  seo_title: string;
  seo_description: string;
};

const toForm = (p: Page | null): Form => ({
  title: p?.title ?? "",
  slug: p?.slug ?? "",
  excerpt: p?.excerpt ?? "",
  content: p?.content ?? "",
  cover_image_url: p?.cover_image_url ?? "",
  seo_title: p?.seo_title ?? "",
  seo_description: p?.seo_description ?? "",
});

function SideCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label={title}>
      <h2 className="text-[15px] font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );
}

export function PageEditor({ page }: { page: Page | null }) {
  const router = useRouter();
  const [id, setId] = useState(page?.id);
  const [status, setStatus] = useState<PageStatus>(page?.status ?? "draft");
  const [form, setForm] = useState<Form>(() => toForm(page));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(page)));
  const [savedAt, setSavedAt] = useState<string | null>(page?.updated_at ?? null);
  const [slugTouched, setSlugTouched] = useState(Boolean(page?.slug));
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(form) !== saved;
  const set = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v })), []);
  const path = `/${slugify(form.slug || form.title) || "your-page"}`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const run = useCallback(
    (nextStatus: PageStatus) =>
      start(async () => {
        const res = await savePage({ ...form, id, status: nextStatus });
        if (!res.ok) return void toast.error(res.error);
        const next = { ...form, slug: res.slug };
        setForm(next);
        setSaved(JSON.stringify(next));
        setSlugTouched(true);
        setStatus(nextStatus);
        setSavedAt(new Date().toISOString());
        toast.success(nextStatus === "published" ? (status === "published" ? "Changes are live" : "Page published") : "Draft saved");
        if (!id) router.replace(`/admin/pages/${res.id}`);
        else router.refresh();
        setId(res.id);
      }),
    [form, id, router, status],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!pending) run(status);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, run, status]);

  return (
    <div className="-mt-6 lg:-mt-10">
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <Link href="/admin/pages" className="flex items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Pages
        </Link>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", status === "published" ? "bg-success-tint text-success" : "bg-muted text-muted-foreground")}>
          {status === "published" ? "Published" : "Draft"}
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline" aria-live="polite">
          {pending ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${formatDate(savedAt, true)}` : "Not saved yet"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {status === "published" && id && (
            <a href={path} target="_blank" rel="noopener noreferrer" className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted sm:flex">
              <ExternalLink className="size-4" /> View
            </a>
          )}
          {status === "published" ? (
            <Button variant="outline" className="h-9 rounded-lg" disabled={pending} onClick={() => run("draft")}>
              <Undo2 /> Unpublish
            </Button>
          ) : (
            <Button variant="outline" className="h-9 rounded-lg" disabled={pending} onClick={() => run("draft")}>
              Save draft
            </Button>
          )}
          <Button className="h-9 rounded-lg" disabled={pending} onClick={() => run("published")}>
            {pending ? <Loader2 className="animate-spin" /> : status === "published" ? <Check /> : <Send />}
            {status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="page-title" className="sr-only">
              Page title
            </label>
            <textarea
              id="page-title"
              rows={1}
              autoFocus={!page}
              value={form.title}
              maxLength={200}
              onChange={(e) => {
                set("title", e.target.value.replace(/\n/g, " "));
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              placeholder="Page title"
              className="w-full resize-none bg-transparent font-heading text-3xl font-extrabold leading-tight tracking-tight outline-none [field-sizing:content] placeholder:text-muted-foreground/60 sm:text-[40px]"
            />
            <label htmlFor="page-excerpt" className="sr-only">
              Intro
            </label>
            <textarea
              id="page-excerpt"
              rows={2}
              value={form.excerpt}
              maxLength={400}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="A one-line intro shown in the page banner and in search results."
              className="mt-2 w-full resize-none bg-transparent text-lg leading-relaxed text-muted-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/60"
            />
          </div>
          <span id="page-body-label" className="sr-only">
            Page content
          </span>
          <RichTextEditor value={form.content} onChange={(v) => set("content", v)} labelledBy="page-body-label" placeholder="Write the page… Use the toolbar for headings, lists, links and images." />
        </div>

        <aside className="space-y-4">
          <SideCard title="Web address">
            <div className="flex items-center rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
              <span className="pl-3 text-sm text-muted-foreground">/</span>
              <input
                id="page-slug"
                aria-label="Web address"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
                onBlur={() => set("slug", slugify(form.slug || form.title))}
                className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
              />
            </div>
            {status === "published" && page?.slug && form.slug !== page.slug && (
              <p className="text-xs text-warning">Changing the address breaks existing links — update the Menu too.</p>
            )}
          </SideCard>

          <SideCard title="Banner image" description="Optional. Shown faintly behind the page title.">
            <ImageField id="page-banner" folder="pages" value={form.cover_image_url} onChange={(v) => set("cover_image_url", v)} emptyLabel="Upload a banner" />
          </SideCard>

          <SideCard title="Search & social">
            <div className="space-y-1.5">
              <Label htmlFor="page-seo-title">Search title</Label>
              <Input id="page-seo-title" maxLength={120} value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder={form.title || "Defaults to the title"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="page-seo-desc">Search description</Label>
              <Textarea id="page-seo-desc" rows={3} maxLength={300} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} placeholder={form.excerpt || "Defaults to the intro"} />
            </div>
          </SideCard>

          {id && (
            <ConfirmDialog
              title="Delete this page?"
              description={`“${form.title || "Untitled page"}” will be permanently deleted. Menu links to ${path} will stop working.`}
              onConfirm={async () => {
                const res = await deletePage(id);
                if (!res.ok) {
                  toast.error(res.error);
                  return false;
                }
                setSaved(JSON.stringify(form));
                toast.success("Page deleted");
                router.push("/admin/pages");
              }}
              trigger={(open) => (
                <Button variant="ghost" className="h-10 w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={open}>
                  <Trash2 className="size-4" /> Delete page
                </Button>
              )}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
