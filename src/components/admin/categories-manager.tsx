"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, EyeOff, FolderPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, moveCategory, saveCategory } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/format";
import type { Category } from "@/lib/types";

type Draft = { id?: string; name: string; slug: string; description: string; layout: "stories" | "documents"; show_in_nav: boolean };
const EMPTY: Draft = { name: "", slug: "", description: "", layout: "stories", show_in_nav: true };

export function CategoriesManager({ categories, usage }: { categories: Category[]; usage: Record<string, number> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const navCount = categories.filter((c) => c.show_in_nav).length;

  const open = (c?: Category) => {
    setError(null);
    setSlugTouched(Boolean(c));
    setDraft(c ? { id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", layout: c.layout, show_in_nav: c.show_in_nav } : EMPTY);
  };

  const save = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveCategory(draft);
      if (!res.ok) return setError(res.error);
      toast.success(draft.id ? "Section updated" : "Section added");
      setDraft(null);
      router.refresh();
    });

  const move = (id: string, dir: "up" | "down") =>
    start(async () => {
      const res = await moveCategory(id, dir);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {categories.length} section{categories.length === 1 ? "" : "s"} · {navCount} in the footer
        </p>
        <Button className="h-10 gap-2 rounded-xl" onClick={() => open()}>
          <FolderPlus className="size-4" /> Add section
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="font-semibold">No sections yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first section so editors can file their posts.</p>
        </div>
      ) : (
        <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className="w-6 text-center font-heading text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  {c.name}
                  {!c.show_in_nav && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <EyeOff className="size-3" /> Hidden from footer
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  /{c.slug} · {c.layout === "documents" ? "Document list" : "Photo cards"} · {usage[c.id] ?? 0} {usage[c.id] === 1 ? "post" : "posts"}
                </p>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="icon-lg" aria-label={`Move ${c.name} up`} disabled={pending || i === 0} onClick={() => move(c.id, "up")}>
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label={`Move ${c.name} down`}
                  disabled={pending || i === categories.length - 1}
                  onClick={() => move(c.id, "down")}
                >
                  <ArrowDown />
                </Button>
                <Button variant="ghost" size="icon-lg" aria-label={`Edit ${c.name}`} onClick={() => open(c)}>
                  <Pencil />
                </Button>
                <ConfirmDialog
                  title={`Delete “${c.name}”?`}
                  description={
                    usage[c.id]
                      ? `${usage[c.id]} ${usage[c.id] === 1 ? "post uses" : "posts use"} this section. They’ll stay published but move to /news until you pick a new section.`
                      : "This section has no posts. It will be removed from the site."
                  }
                  onConfirm={async () => {
                    const res = await deleteCategory(c.id);
                    if (!res.ok) {
                      toast.error(res.error);
                      return false;
                    }
                    toast.success("Section deleted");
                    router.refresh();
                  }}
                  trigger={(openConfirm) => (
                    <Button variant="ghost" size="icon-lg" aria-label={`Delete ${c.name}`} className="text-destructive hover:text-destructive" onClick={openConfirm}>
                      <Trash2 />
                    </Button>
                  )}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && !pending && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit section" : "Add a section"}</DialogTitle>
            <DialogDescription>Sections group posts and appear in each post’s web address.</DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="category-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  autoFocus
                  value={draft.name}
                  maxLength={60}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: slugTouched ? draft.slug : slugify(e.target.value) })}
                  placeholder="e.g. Local News"
                  aria-invalid={!!error && !draft.name.trim()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-slug">Web address</Label>
                <div className="flex items-center rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                  <span className="pl-3 text-sm text-muted-foreground">/</span>
                  <input
                    id="cat-slug"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                    }}
                    className="h-9 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                  />
                </div>
                {draft.id && <p className="text-xs text-muted-foreground">Changing this changes the address of every post in the section.</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">
                  Description <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="cat-desc"
                  rows={2}
                  maxLength={300}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Shown at the top of the section page and to search engines."
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">How posts are listed</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      { v: "stories", t: "Photo cards", d: "News, features, announcements" },
                      { v: "documents", t: "Document list", d: "Memoranda, advisories, bids — shows reference no. & file" },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.v}
                      className={`cursor-pointer rounded-xl border p-3 text-sm transition-colors ${draft.layout === o.v ? "border-ring bg-accent/50" : "hover:bg-muted/50"}`}
                    >
                      <input type="radio" name="layout" value={o.v} checked={draft.layout === o.v} onChange={() => setDraft({ ...draft, layout: o.v })} className="sr-only" />
                      <span className="block font-semibold">{o.t}</span>
                      <span className="text-xs text-muted-foreground">{o.d}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <Label htmlFor="cat-nav">List in the footer</Label>
                  <p className="text-xs text-muted-foreground">Add sections to the header from Menu.</p>
                </div>
                <Switch id="cat-nav" checked={draft.show_in_nav} onCheckedChange={(v) => setDraft({ ...draft, show_in_nav: Boolean(v) })} />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </form>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {draft?.id ? "Save changes" : "Add section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
