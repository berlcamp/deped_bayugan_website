"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleCheck,
  ExternalLink,
  Loader2,
  Lock,
  MessageSquareWarning,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteArticle, reviewArticle, saveArticle, type ArticleInput } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, slugify } from "@/lib/format";
import type { Article, ArticleStatus, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CoverImageField } from "./cover-image-field";
import { AttachmentField } from "./fields";
import { RichTextEditor } from "./rich-text-editor";
import { TagsInput } from "./tags-input";

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  cover_image_alt: string;
  cover_caption: string;
  reference_no: string;
  attachment_url: string;
  attachment_name: string;
  category_id: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  author_name: string;
  is_featured: boolean;
  is_breaking: boolean;
};

export type EditorArticle = Article & { category: { slug: string; name: string; layout?: string } | null };

function toForm(a: EditorArticle | null, defaultByline: string): Form {
  return {
    title: a?.title ?? "",
    slug: a?.slug ?? "",
    excerpt: a?.excerpt ?? "",
    content: a?.content ?? "",
    cover_image_url: a?.cover_image_url ?? "",
    cover_image_alt: a?.cover_image_alt ?? "",
    cover_caption: a?.cover_caption ?? "",
    reference_no: a?.reference_no ?? "",
    attachment_url: a?.attachment_url ?? "",
    attachment_name: a?.attachment_name ?? "",
    category_id: a?.category_id ?? "",
    tags: a?.tags ?? [],
    seo_title: a?.seo_title ?? "",
    seo_description: a?.seo_description ?? "",
    author_name: a?.author_name ?? defaultByline,
    is_featured: a?.is_featured ?? false,
    is_breaking: a?.is_breaking ?? false,
  };
}

function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span className={cn("text-xs tabular-nums text-muted-foreground", n > max && "font-semibold text-warning")} aria-live="polite">
      {n}/{max}
    </span>
  );
}

function SideCard({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-2xl border bg-card p-4 sm:p-5" aria-label={title}>
      <h2 className="text-[15px] font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );
}

export function ArticleEditor({
  article,
  categories,
  me,
  autoApprove,
  siteUrl,
  siteName,
}: {
  article: EditorArticle | null;
  categories: { id: string; name: string; slug: string; layout: string }[];
  me: { id: string; role: Role; name: string };
  autoApprove: boolean;
  siteUrl: string;
  siteName: string;
}) {
  const router = useRouter();
  const isAdmin = me.role === "admin";
  const [id, setId] = useState(article?.id);
  const [status, setStatus] = useState<ArticleStatus>(article?.status ?? "draft");
  const [form, setForm] = useState<Form>(() => toForm(article, me.name));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(article, me.name)));
  const [savedAt, setSavedAt] = useState<string | null>(article?.updated_at ?? null);
  const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug));
  const [pending, start] = useTransition();
  const [busyIntent, setBusyIntent] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const dirty = JSON.stringify(form) !== saved;
  const locked = !isAdmin && status === "published" && !autoApprove;
  const category = categories.find((c) => c.id === form.category_id);
  const effectiveSlug = slugify(form.slug || form.title) || "your-post";
  const isDoc = category?.layout === "documents";
  const publicPath = `/${category?.slug ?? "news"}/${effectiveSlug}`;

  const set = useCallback(<K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value })), []);

  useEffect(() => {
    if (!article) titleRef.current?.focus();
  }, [article]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const run = useCallback(
    (intent: ArticleInput["intent"], then?: () => void) => {
      setBusyIntent(intent);
      start(async () => {
        const res = await saveArticle({ ...form, id, intent });
        setBusyIntent(null);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        const nextForm = { ...form, slug: res.slug };
        setForm(nextForm);
        setSaved(JSON.stringify(nextForm));
        setSlugTouched(true);
        setStatus(res.status);
        setSavedAt(new Date().toISOString());

        const messages: Record<ArticleStatus, string> = {
          draft: intent === "unpublish" ? "Moved back to drafts" : "Draft saved",
          pending: intent === "submit" || intent === "publish" ? "Submitted — an admin will review it" : "Changes saved",
          published: intent === "save" ? "Changes are live" : "Published! It’s live on the site.",
          rejected: "Saved",
        };
        toast.success(messages[res.status], res.status === "published" ? { action: { label: "View", onClick: () => window.open(publicPath, "_blank") } } : undefined);

        if (!id) router.replace(`/admin/articles/${res.id}`);
        else router.refresh();
        setId(res.id);
        then?.();
      });
    },
    [form, id, router, publicPath],
  );

  // ⌘S / Ctrl+S saves without changing status.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!locked && !pending) run("save");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, pending, run]);

  const primary = useMemo(() => {
    if (status === "published") return { label: "Update", intent: "save" as const, icon: Check };
    if (isAdmin) return { label: "Publish", intent: "publish" as const, icon: Send };
    if (status === "pending") return { label: "Save changes", intent: "save" as const, icon: Check };
    return autoApprove
      ? { label: "Publish", intent: "submit" as const, icon: Send }
      : { label: "Submit for review", intent: "submit" as const, icon: Send };
  }, [status, isAdmin, autoApprove]);

  const reject = () =>
    start(async () => {
      if (dirty) {
        const saveRes = await saveArticle({ ...form, id, intent: "save" });
        if (!saveRes.ok) return void toast.error(saveRes.error);
      }
      const res = await reviewArticle(id!, "reject", rejectNote);
      if (!res.ok) return void toast.error(res.error);
      setStatus("rejected");
      setSaved(JSON.stringify(form));
      setRejectOpen(false);
      toast.success("Sent back to the editor with your notes");
      router.refresh();
    });

  const seoTitle = form.seo_title || form.title || "Your title";
  const seoDescription = form.seo_description || form.excerpt || "Add a summary so readers know what the post is about.";

  return (
    <div className="-mt-6 lg:-mt-10">
      {/* Action bar */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <Link href="/admin/articles" className="flex items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Posts
        </Link>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <StatusBadge status={status} />
        <span className="hidden text-xs text-muted-foreground sm:inline" aria-live="polite">
          {pending ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${formatDate(savedAt, true)}` : "Not saved yet"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {status === "published" && id && (
            <a
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted sm:flex"
            >
              <ExternalLink className="size-4" /> View
            </a>
          )}
          {!locked && status !== "published" && status !== "pending" && (
            <Button variant="outline" className="h-9 rounded-lg" disabled={pending} onClick={() => run("save")}>
              {busyIntent === "save" && <Loader2 className="animate-spin" />}
              Save draft
            </Button>
          )}
          {!locked && (
            <div className="flex">
              <Button className={cn("h-9 rounded-lg", (status === "published" || status === "pending") && "rounded-r-none")} disabled={pending} onClick={() => run(primary.intent)}>
                {busyIntent === primary.intent ? <Loader2 className="animate-spin" /> : <primary.icon />}
                {primary.label}
              </Button>
              {(status === "published" || status === "pending") && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button className="h-9 rounded-l-none border-l border-primary-foreground/25 px-2" aria-label="More publishing options" disabled={pending} />}
                  >
                    <ChevronDown />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => run("unpublish")}>
                      <Undo2 /> {status === "published" ? "Unpublish (back to draft)" : "Withdraw to drafts"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contextual banners */}
      {locked && (
        <Banner tone="info" icon={Lock} title="This post is live">
          Published posts can only be changed by an admin while admin review is on. Ask an admin if something needs fixing.
        </Banner>
      )}
      {status === "rejected" && article?.review_note && (
        <Banner tone="danger" icon={MessageSquareWarning} title="An admin asked for changes">
          “{article.review_note}” — make the edits, then submit again.
        </Banner>
      )}
      {status === "pending" && !isAdmin && (
        <Banner tone="warning" icon={AlertTriangle} title="Waiting for review">
          An admin will review this post before it goes live. You can keep editing until then.
        </Banner>
      )}
      {status === "pending" && isAdmin && id && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning-tint p-4 sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-warning">Review this submission</p>
            <p className="text-muted-foreground">
              Submitted by {article?.author_name ?? "an editor"}
              {article?.submitted_at ? ` on ${formatDate(article.submitted_at, true)}` : ""}. You can edit it before approving.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10 rounded-lg bg-card" disabled={pending} onClick={() => setRejectOpen(true)}>
              Send back
            </Button>
            <Button className="h-10 rounded-lg" disabled={pending} onClick={() => run("publish")}>
              {busyIntent === "publish" ? <Loader2 className="animate-spin" /> : <CircleCheck />} Approve & publish
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <textarea
              id="title"
              ref={titleRef}
              rows={1}
              value={form.title}
              disabled={locked}
              maxLength={200}
              onChange={(e) => {
                set("title", e.target.value.replace(/\n/g, " "));
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              placeholder="Title"
              className="w-full resize-none bg-transparent font-heading text-3xl font-extrabold leading-tight tracking-tight outline-none [field-sizing:content] placeholder:text-muted-foreground/60 sm:text-[40px]"
            />
            <div className="mt-2 flex items-start gap-2">
              <label htmlFor="excerpt" className="sr-only">
                Summary
              </label>
              <textarea
                id="excerpt"
                rows={2}
                value={form.excerpt}
                disabled={locked}
                maxLength={400}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="One or two sentences that sum up the post. Shown under the title, in lists and when shared on Facebook."
                className="w-full resize-none bg-transparent text-lg leading-relaxed text-muted-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground/60"
              />
              <Counter value={form.excerpt} max={200} />
            </div>
          </div>

          <span id="body-label" className="sr-only">
            Post body
          </span>
          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} editable={!locked} labelledBy="body-label" />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <SideCard title="Section" description="Required before publishing.">
            <Label htmlFor="category" className="sr-only">
              Section
            </Label>
            <Select value={form.category_id || null} onValueChange={(v) => set("category_id", String(v ?? ""))} disabled={locked}>
              <SelectTrigger id="category" className="h-10 w-full rounded-lg">
                <SelectValue placeholder="Choose a section">{(v: string | null) => categories.find((c) => c.id === v)?.name ?? "Choose a section"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SideCard>

          <SideCard
            title="Reference & attachment"
            description={isDoc ? "Issuances show the reference number and a download button." : "Optional. Attach a PDF or document readers can download."}
          >
            <div className="space-y-1.5">
              <Label htmlFor="reference">Reference no.</Label>
              <Input
                id="reference"
                value={form.reference_no}
                disabled={locked}
                maxLength={120}
                onChange={(e) => set("reference_no", e.target.value)}
                placeholder={isDoc ? "e.g. DM No. 045, s. 2026" : "Optional"}
              />
            </div>
            <AttachmentField
              url={form.attachment_url}
              name={form.attachment_name}
              disabled={locked}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          </SideCard>

          <SideCard title="Cover image" description="Shown at the top of the post and in Facebook shares.">
            <CoverImageField
              url={form.cover_image_url}
              alt={form.cover_image_alt}
              caption={form.cover_caption}
              disabled={locked}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
          </SideCard>

          <SideCard title="Byline & tags">
            <div className="space-y-1.5">
              <Label htmlFor="byline">Byline</Label>
              <Input
                id="byline"
                value={form.author_name}
                disabled={locked || !isAdmin}
                onChange={(e) => set("author_name", e.target.value)}
                placeholder="Your name"
                aria-describedby={isAdmin ? undefined : "byline-hint"}
              />
              {!isAdmin && (
                <p id="byline-hint" className="text-xs text-muted-foreground">
                  Posts show your name from your Google account.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <TagsInput id="tags" value={form.tags} onChange={(v) => set("tags", v)} disabled={locked} />
            </div>
          </SideCard>

          {isAdmin && (
            <SideCard title="Homepage placement">
              <ToggleRow
                id="featured"
                label="Feature on the homepage"
                hint="Shows as the big story in News & Stories on the homepage."
                checked={form.is_featured}
                onChange={(v) => set("is_featured", v)}
              />
              <ToggleRow
                id="breaking"
                label="Show in announcement bar"
                hint="Pins the title to the yellow advisory bar at the top of the homepage."
                checked={form.is_breaking}
                onChange={(v) => set("is_breaking", v)}
              />
            </SideCard>
          )}

          <SideCard title="Search & social" description="How the post looks on Google and Facebook.">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Web address</Label>
              <div className="flex items-center rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <span className="truncate pl-3 text-sm text-muted-foreground">/{category?.slug ?? "news"}/</span>
                <input
                  id="slug"
                  value={form.slug}
                  disabled={locked}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                  }}
                  onBlur={() => set("slug", slugify(form.slug || form.title))}
                  className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                />
              </div>
              {status === "published" && article?.slug && form.slug !== article.slug && (
                <p className="text-xs text-warning">Changing the address breaks links people have already shared.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-title">Search title</Label>
                <Counter value={form.seo_title} max={60} />
              </div>
              <Input id="seo-title" value={form.seo_title} disabled={locked} onChange={(e) => set("seo_title", e.target.value)} placeholder={form.title || "Defaults to the title"} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-desc">Search description</Label>
                <Counter value={form.seo_description} max={160} />
              </div>
              <Textarea
                id="seo-desc"
                rows={3}
                value={form.seo_description}
                disabled={locked}
                onChange={(e) => set("seo_description", e.target.value)}
                placeholder={form.excerpt || "Defaults to the summary"}
              />
            </div>

            <div className="rounded-xl border bg-background p-3" aria-label="Google preview">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Google preview</p>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {siteUrl.replace(/^https?:\/\//, "")}
                {publicPath}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[17px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{seoTitle} | {siteName}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{seoDescription}</p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background" aria-label="Facebook preview">
              <p className="px-3 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Facebook preview</p>
              <div className="mt-2 aspect-[1.91/1] bg-muted">
                {form.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image_url} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="bg-muted/60 px-3 py-2.5">
                <p className="text-[11px] uppercase text-muted-foreground">{siteUrl.replace(/^https?:\/\//, "")}</p>
                <p className="line-clamp-2 text-sm font-semibold">{seoTitle}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{seoDescription}</p>
              </div>
            </div>
          </SideCard>

          {id && (isAdmin || status !== "published") && (
            <ConfirmDialog
              title="Delete this post?"
              description={`“${form.title || "Untitled post"}” will be permanently deleted${status === "published" ? " and removed from the website" : ""}. This can’t be undone.`}
              onConfirm={async () => {
                const res = await deleteArticle(id);
                if (!res.ok) {
                  toast.error(res.error);
                  return false;
                }
                setSaved(JSON.stringify(form)); // don't trigger the unsaved-changes warning
                toast.success("Post deleted");
                router.push("/admin/articles");
              }}
              trigger={(open) => (
                <Button variant="ghost" className="h-10 w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={open}>
                  <Trash2 className="size-4" /> Delete post
                </Button>
              )}
            />
          )}
        </aside>
      </div>

      <Dialog open={rejectOpen} onOpenChange={(o) => !pending && setRejectOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back for changes</DialogTitle>
            <DialogDescription>The editor will see your note at the top of the post.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-note">What needs to change?</Label>
            <Textarea
              id="reject-note"
              rows={4}
              autoFocus
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Please attach the signed copy and correct the memorandum number."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={reject} disabled={pending || !rejectNote.trim()}>
              {pending && <Loader2 className="animate-spin" />}
              Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
    </div>
  );
}

function Banner({ tone, icon: Icon, title, children }: { tone: "info" | "warning" | "danger"; icon: React.ElementType; title: string; children: React.ReactNode }) {
  const tones = {
    info: "border-border bg-muted/60",
    warning: "border-warning/30 bg-warning-tint",
    danger: "border-destructive/30 bg-destructive/5",
  };
  const iconTone = { info: "text-muted-foreground", warning: "text-warning", danger: "text-destructive" };
  return (
    <div role="status" className={cn("mb-6 flex gap-3 rounded-2xl border p-4 text-sm", tones[tone])}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconTone[tone])} aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
