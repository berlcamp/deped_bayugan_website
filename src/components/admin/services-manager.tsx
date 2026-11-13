"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, EyeOff, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteService, moveService, saveService } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { SERVICE_ICONS, ServiceIcon } from "@/components/site/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Draft = { id?: string; title: string; description: string; url: string; icon: string; badge: string; is_featured: boolean; is_visible: boolean };
const EMPTY: Draft = { title: "", description: "", url: "", icon: "globe", badge: "", is_featured: false, is_visible: true };

export function ServicesManager({ services }: { services: Service[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const featured = services.filter((s) => s.is_featured && s.is_visible).length;

  const open = (s?: Service) => {
    setError(null);
    setDraft(
      s
        ? { id: s.id, title: s.title, description: s.description ?? "", url: s.url, icon: s.icon, badge: s.badge ?? "", is_featured: s.is_featured, is_visible: s.is_visible }
        : EMPTY,
    );
  };

  const save = () =>
    start(async () => {
      if (!draft) return;
      const res = await saveService(draft);
      if (!res.ok) return setError(res.error);
      toast.success(draft.id ? "Service updated" : "Service added");
      setDraft(null);
      router.refresh();
    });

  const move = (id: string, dir: "up" | "down") =>
    start(async () => {
      const res = await moveService(id, dir);
      if (!res.ok) toast.error(res.error);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {services.length} service{services.length === 1 ? "" : "s"} · {featured} in the hero card {featured > 4 && "(only the first 4 show)"}
        </p>
        <Button className="h-10 shrink-0 gap-2 rounded-xl" onClick={() => open()}>
          <Plus className="size-4" /> Add service
        </Button>
      </div>

      <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
        {services.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ServiceIcon name={s.icon} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {s.title}
                {s.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                    <Star className="size-3" /> In hero
                  </span>
                )}
                {!s.is_visible && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <EyeOff className="size-3" /> Hidden
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">{s.url}</p>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="icon-lg" aria-label={`Move ${s.title} up`} disabled={pending || i === 0} onClick={() => move(s.id, "up")}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon-lg" aria-label={`Move ${s.title} down`} disabled={pending || i === services.length - 1} onClick={() => move(s.id, "down")}>
                <ArrowDown />
              </Button>
              <Button variant="ghost" size="icon-lg" aria-label={`Edit ${s.title}`} onClick={() => open(s)}>
                <Pencil />
              </Button>
              <ConfirmDialog
                title={`Delete “${s.title}”?`}
                description="It will be removed from the homepage and the services page."
                onConfirm={async () => {
                  const res = await deleteService(s.id);
                  if (!res.ok) {
                    toast.error(res.error);
                    return false;
                  }
                  toast.success("Service deleted");
                  router.refresh();
                }}
                trigger={(o) => (
                  <Button variant="ghost" size="icon-lg" aria-label={`Delete ${s.title}`} className="text-destructive hover:text-destructive" onClick={o}>
                    <Trash2 />
                  </Button>
                )}
              />
            </div>
          </li>
        ))}
        {services.length === 0 && <li className="px-6 py-14 text-center text-sm text-muted-foreground">No services yet.</li>}
      </ol>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && !pending && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit service" : "Add a service"}</DialogTitle>
            <DialogDescription>Online systems such as PRIME-HRM or the School Management System.</DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              id="service-form"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="s-title">Name</Label>
                <Input id="s-title" autoFocus maxLength={80} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-url">Link</Label>
                <Input id="s-url" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://… or /a-page" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-desc">Short description</Label>
                <Textarea id="s-desc" rows={2} maxLength={200} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">Icon</legend>
                <div className="grid grid-cols-8 gap-1.5">
                  {Object.keys(SERVICE_ICONS).map((name) => (
                    <button
                      key={name}
                      type="button"
                      aria-label={name}
                      aria-pressed={draft.icon === name}
                      onClick={() => setDraft({ ...draft, icon: name })}
                      className={cn(
                        "grid aspect-square place-items-center rounded-lg border transition-colors hover:bg-muted",
                        draft.icon === name && "border-ring bg-accent text-accent-foreground",
                      )}
                    >
                      <ServiceIcon name={name} className="size-[18px]" />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="s-badge">
                  Badge <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input id="s-badge" maxLength={20} value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} placeholder="e.g. New, Most used" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <Label htmlFor="s-feat">Show in hero</Label>
                    <p className="text-xs text-muted-foreground">Quick link beside the title</p>
                  </div>
                  <Switch id="s-feat" checked={draft.is_featured} onCheckedChange={(v) => setDraft({ ...draft, is_featured: Boolean(v) })} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <Label htmlFor="s-vis">Visible</Label>
                  <Switch id="s-vis" checked={draft.is_visible} onCheckedChange={(v) => setDraft({ ...draft, is_visible: Boolean(v) })} />
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
            <Button type="submit" form="service-form" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {draft?.id ? "Save changes" : "Add service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
