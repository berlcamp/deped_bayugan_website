"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, ExternalLink, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMenuItem, moveMenuItem, saveMenuItem } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MenuItem, MenuNode } from "@/lib/types";

type Draft = {
  id?: string;
  parent_id: string;
  label: string;
  url: string;
  description: string;
  open_new_tab: boolean;
  is_visible: boolean;
};

const empty = (parent_id = ""): Draft => ({ parent_id, label: "", url: "", description: "", open_new_tab: false, is_visible: true });

type LinkOption = { label: string; url: string; group: string };

const selectClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function MenuManager({ menu, links }: { menu: MenuNode[]; links: LinkOption[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = (item?: MenuItem, parentId?: string) => {
    setError(null);
    setDraft(
      item
        ? {
            id: item.id,
            parent_id: item.parent_id ?? "",
            label: item.label,
            url: item.url ?? "",
            description: item.description ?? "",
            open_new_tab: item.open_new_tab,
            is_visible: item.is_visible,
          }
        : empty(parentId),
    );
  };

  const save = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveMenuItem(draft);
      if (!res.ok) return setError(res.error);
      toast.success(draft.id ? "Menu item updated" : "Menu item added");
      setDraft(null);
      router.refresh();
    });

  const move = (id: string, dir: "up" | "down") =>
    start(async () => {
      const res = await moveMenuItem(id, dir);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });

  const editingHasChildren = !!draft?.id && menu.some((m) => m.id === draft.id && m.children.length > 0);
  const groups = [...new Set(links.map((l) => l.group))];

  const row = ({ item, index, count, child }: { item: MenuItem; index: number; count: number; child?: boolean }) => (
    <div className={`flex items-center gap-2 px-3 py-2.5 sm:px-4 ${child ? "bg-muted/30 pl-6 sm:pl-10" : ""}`}>
      {child && <CornerDownRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        <p className={`flex flex-wrap items-center gap-2 ${child ? "text-sm font-medium" : "font-semibold"}`}>
          {item.label}
          {!item.is_visible && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <EyeOff className="size-3" /> Hidden
            </span>
          )}
          {item.open_new_tab && <ExternalLink className="size-3.5 text-muted-foreground" aria-label="Opens in a new tab" />}
        </p>
        <p className="truncate text-xs text-muted-foreground">{item.url ?? (child ? "No link" : "Dropdown heading")}</p>
      </div>
      <div className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" aria-label={`Move ${item.label} up`} disabled={pending || index === 0} onClick={() => move(item.id, "up")}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Move ${item.label} down`} disabled={pending || index === count - 1} onClick={() => move(item.id, "down")}>
          <ArrowDown />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Edit ${item.label}`} onClick={() => open(item)}>
          <Pencil />
        </Button>
        <ConfirmDialog
          title={`Delete “${item.label}”?`}
          description={child ? "It will be removed from the menu." : "It and all its sub-items will be removed from the menu. Pages themselves are not deleted."}
          onConfirm={async () => {
            const res = await deleteMenuItem(item.id);
            if (!res.ok) {
              toast.error(res.error);
              return false;
            }
            toast.success("Menu item deleted");
            router.refresh();
          }}
          trigger={(o) => (
            <Button variant="ghost" size="icon" aria-label={`Delete ${item.label}`} className="text-destructive hover:text-destructive" onClick={o}>
              <Trash2 />
            </Button>
          )}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Top-level items without a link open a dropdown of their sub-items.</p>
        <Button className="h-10 shrink-0 gap-2 rounded-xl" onClick={() => open()}>
          <Plus className="size-4" /> Add item
        </Button>
      </div>

      <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
        {menu.map((top, i) => (
          <li key={top.id}>
            {row({ item: top, index: i, count: menu.length })}
            {top.children.length > 0 && (
              <ol className="divide-y border-t">
                {top.children.map((c, j) => (
                  <li key={c.id}>
                    {row({ item: c, index: j, count: top.children.length, child: true })}
                  </li>
                ))}
              </ol>
            )}
            <div className="border-t bg-muted/30 py-1.5 pl-6 sm:pl-10">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => open(undefined, top.id)}>
                <Plus className="size-3.5" /> Add sub-item to {top.label}
              </Button>
            </div>
          </li>
        ))}
        {menu.length === 0 && <li className="px-6 py-14 text-center text-sm text-muted-foreground">The menu is empty. Add the first item.</li>}
      </ol>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && !pending && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit menu item" : "Add a menu item"}</DialogTitle>
            <DialogDescription>Link to a page, a section, or any web address.</DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="menu-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="m-label">Label</Label>
                <Input id="m-label" autoFocus maxLength={60} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Citizen’s Charter" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-parent">Position</Label>
                <select
                  id="m-parent"
                  className={selectClass}
                  value={draft.parent_id}
                  disabled={editingHasChildren}
                  onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
                >
                  <option value="">Top level</option>
                  {menu
                    .filter((m) => m.id !== draft.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        Under “{m.label}”
                      </option>
                    ))}
                </select>
                {editingHasChildren && <p className="text-xs text-muted-foreground">Move or delete its sub-items first to change its position.</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-pick">Link to</Label>
                <select
                  id="m-pick"
                  className={selectClass}
                  value={links.some((l) => l.url === draft.url) ? draft.url : ""}
                  onChange={(e) => {
                    const pick = links.find((l) => l.url === e.target.value);
                    setDraft({ ...draft, url: e.target.value, label: draft.label || pick?.label || "" });
                  }}
                >
                  <option value="">Custom link (type below)</option>
                  {groups.map((g) => (
                    <optgroup key={g} label={g}>
                      {links
                        .filter((l) => l.group === g)
                        .map((l) => (
                          <option key={l.url} value={l.url}>
                            {l.label} — {l.url}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <Input
                  id="m-url"
                  aria-label="Link address"
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder={draft.parent_id ? "/about-us or https://…" : "Leave empty to make a dropdown"}
                />
              </div>
              {draft.parent_id && (
                <div className="space-y-1.5">
                  <Label htmlFor="m-desc">
                    Short description <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input id="m-desc" maxLength={120} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Shown under the label in the dropdown" />
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <Label htmlFor="m-tab">Open in new tab</Label>
                  <Switch id="m-tab" checked={draft.open_new_tab} onCheckedChange={(v) => setDraft({ ...draft, open_new_tab: Boolean(v) })} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <Label htmlFor="m-vis">Visible</Label>
                  <Switch id="m-vis" checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: Boolean(v) })} />
                </div>
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
            <Button type="submit" form="menu-form" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {draft?.id ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
