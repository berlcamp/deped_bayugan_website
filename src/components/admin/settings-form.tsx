"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgeCheck, Globe, Loader2, MapPin, Share2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "@/app/(admin)/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

function Section({ id, icon: Icon, title, description, children }: { id?: string; icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border bg-card" aria-labelledby={`${id}-h`}>
      <div className="flex items-start gap-3 border-b p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${id}-h`} className="text-lg font-bold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsForm({ settings, pendingCount }: { settings: Settings; pendingCount: number }) {
  const router = useRouter();
  const [autoApprove, setAutoApprove] = useState(settings.auto_approve_editor_posts);
  const [toggling, startToggle] = useTransition();
  const [saving, startSave] = useTransition();
  const [form, setForm] = useState({
    site_name: settings.site_name,
    tagline: settings.tagline,
    description: settings.description,
    address: settings.address ?? "",
    contact_phone: settings.contact_phone ?? "",
    contact_email: settings.contact_email ?? "",
    office_hours: settings.office_hours ?? "",
    map_url: settings.map_url ?? "",
    facebook_url: settings.facebook_url ?? "",
    youtube_url: settings.youtube_url ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  // The publishing toggle saves immediately — it's a single, reversible switch.
  const toggleAutoApprove = (next: boolean) => {
    setAutoApprove(next);
    startToggle(async () => {
      const res = await updateSettings({ auto_approve_editor_posts: next });
      if (!res.ok) {
        setAutoApprove(!next);
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Auto-approve is on" : "Admin review is on", {
        description: next ? "Posts editors submit now go live right away." : "Editor submissions now wait for an admin.",
      });
      router.refresh();
    });
  };

  const save = () =>
    startSave(async () => {
      setError(null);
      const res = await updateSettings(form);
      if (!res.ok) return setError(res.error);
      toast.success("Settings saved");
      router.refresh();
    });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <Section id="publishing" icon={Zap} title="Publishing" description="Decide whether editors’ posts need an admin’s approval.">
        <div className={cn("flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors", autoApprove ? "border-success/30 bg-success-tint/60" : "bg-muted/40")}>
          <div>
            <Label htmlFor="auto-approve" className="text-base font-semibold">
              Auto-approve editor posts
            </Label>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              When on, a post goes live as soon as an editor publishes it, and editors can update their own published posts.
              When off, editors submit posts for review and an admin approves them.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
              {autoApprove ? (
                <>
                  <BadgeCheck className="size-4 text-success" aria-hidden="true" /> Editors publish directly
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4 text-warning" aria-hidden="true" /> Admins review every editor post
                </>
              )}
              {toggling && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />}
            </p>
          </div>
          <Switch id="auto-approve" checked={autoApprove} disabled={toggling} onCheckedChange={(v) => toggleAutoApprove(Boolean(v))} className="mt-1" />
        </div>
        {autoApprove && pendingCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {pendingCount} {pendingCount === 1 ? "post is" : "posts are"} still waiting from before.{" "}
            <Link href="/admin/articles?status=pending" className="font-medium text-brand hover:underline">
              Review them
            </Link>{" "}
            — turning this on doesn’t publish them automatically.
          </p>
        )}
      </Section>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Section id="site" icon={Globe} title="Site identity" description="Used in the header, page titles and search results.">
          <Field id="site_name" label="Site name">
            <Input id="site_name" required maxLength={60} value={form.site_name} onChange={set("site_name")} />
          </Field>
          <Field id="tagline" label="Tagline" hint="Shown under the name in the header.">
            <Input id="tagline" maxLength={120} value={form.tagline} onChange={set("tagline")} />
          </Field>
          <Field id="description" label="Description" hint="What Google shows under the homepage, and the footer blurb.">
            <Textarea id="description" rows={3} maxLength={300} value={form.description} onChange={set("description")} />
          </Field>
        </Section>

        <Section id="contact" icon={MapPin} title="Contact details" description="Shown in the footer and the “Visit or reach us” band on the homepage.">
          <Field id="address" label="Office address">
            <Textarea id="address" rows={2} maxLength={300} value={form.address} onChange={set("address")} />
          </Field>
          <Field id="map_url" label="Map link" hint="Optional Google Maps link for the address.">
            <Input id="map_url" type="url" value={form.map_url} onChange={set("map_url")} placeholder="https://maps.app.goo.gl/…" />
          </Field>
          <Field id="contact_phone" label="Phone">
            <Input id="contact_phone" maxLength={80} value={form.contact_phone} onChange={set("contact_phone")} placeholder="(085) 000 0000" />
          </Field>
          <Field id="contact_email" label="Email">
            <Input id="contact_email" type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="bayugan.city@deped.gov.ph" />
          </Field>
          <Field id="office_hours" label="Office hours">
            <Input id="office_hours" maxLength={120} value={form.office_hours} onChange={set("office_hours")} />
          </Field>
        </Section>

        <Section id="social" icon={Share2} title="Social" description="Linked from the top bar and footer.">
          <Field id="facebook_url" label="Facebook page">
            <Input id="facebook_url" type="url" value={form.facebook_url} onChange={set("facebook_url")} placeholder="https://www.facebook.com/…" />
          </Field>
          <Field id="youtube_url" label="YouTube channel">
            <Input id="youtube_url" type="url" value={form.youtube_url} onChange={set("youtube_url")} placeholder="https://www.youtube.com/@…" />
          </Field>
        </Section>

        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border bg-card/95 p-3 shadow-[0_8px_24px_rgba(17,19,24,.08)] backdrop-blur">
          {error && (
            <p role="alert" className="mr-auto text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="h-10 rounded-lg px-5" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
