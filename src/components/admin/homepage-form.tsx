"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, Eye, Loader2, MessageSquareQuote, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { updateSettings } from "@/app/(admin)/admin/actions";
import { ImageField } from "@/components/admin/editor/fields";
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Highlight, Settings } from "@/lib/types";

function Section({ id, icon: Icon, title, description, children }: { id: string; icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
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
    <div className="grid gap-1.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function HomepageForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [saving, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    hero_eyebrow: settings.hero_eyebrow ?? "",
    hero_title: settings.hero_title ?? "",
    hero_highlight: settings.hero_highlight ?? "",
    hero_subtitle: settings.hero_subtitle ?? "",
    hero_image_url: settings.hero_image_url ?? "",
    hero_primary_label: settings.hero_primary_label ?? "",
    hero_primary_url: settings.hero_primary_url ?? "",
    hero_secondary_label: settings.hero_secondary_label ?? "",
    hero_secondary_url: settings.hero_secondary_url ?? "",
    sds_name: settings.sds_name ?? "",
    sds_title: settings.sds_title ?? "",
    sds_photo_url: settings.sds_photo_url ?? "",
    sds_message: settings.sds_message ?? "",
    mission: settings.mission ?? "",
    vision: settings.vision ?? "",
    core_values: settings.core_values ?? "",
  });
  const [highlights, setHighlights] = useState<Highlight[]>(settings.highlights ?? []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () =>
    start(async () => {
      setError(null);
      const res = await updateSettings({ ...form, highlights: highlights.filter((h) => h.title.trim()) });
      if (!res.ok) return setError(res.error);
      toast.success("Homepage updated", { action: { label: "View", onClick: () => window.open("/", "_blank") } });
      router.refresh();
    });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Section id="hero" icon={Wand2} title="Hero" description="The large banner at the top of the homepage.">
        <Field id="hero_eyebrow" label="Small label" hint="Shown above the title.">
          <Input id="hero_eyebrow" maxLength={80} value={form.hero_eyebrow} onChange={set("hero_eyebrow")} />
        </Field>
        <Field id="hero_title" label="Title">
          <Textarea id="hero_title" rows={2} required maxLength={140} value={form.hero_title} onChange={set("hero_title")} />
        </Field>
        <Field id="hero_highlight" label="Highlighted words" hint="Shown after the title in gold italics.">
          <Input id="hero_highlight" maxLength={60} value={form.hero_highlight} onChange={set("hero_highlight")} />
        </Field>
        <Field id="hero_subtitle" label="Intro text">
          <Textarea id="hero_subtitle" rows={3} maxLength={400} value={form.hero_subtitle} onChange={set("hero_subtitle")} />
        </Field>
        <Field id="hero_image" label="Background photo" hint="Leave empty to use the default division photo.">
          <ImageField id="hero_image" folder="site" value={form.hero_image_url} onChange={(v) => setVal("hero_image_url", v)} emptyLabel="Upload a background photo" />
        </Field>
        <Field id="hero_primary_label" label="Main button" hint="Label and link. Links can be /a-page, #online-services or https://…">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input id="hero_primary_label" maxLength={40} value={form.hero_primary_label} onChange={set("hero_primary_label")} placeholder="Label" />
            <Input aria-label="Main button link" value={form.hero_primary_url} onChange={set("hero_primary_url")} placeholder="/division-memoranda" />
          </div>
        </Field>
        <Field id="hero_secondary_label" label="Second button">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input id="hero_secondary_label" maxLength={40} value={form.hero_secondary_label} onChange={set("hero_secondary_label")} placeholder="Label" />
            <Input aria-label="Second button link" value={form.hero_secondary_url} onChange={set("hero_secondary_url")} placeholder="/about-us" />
          </div>
        </Field>
        <p className="text-sm text-muted-foreground">
          The card of quick links beside the title lists services marked <b>“Show in hero”</b> under{" "}
          <Link href="/admin/services" className="font-medium text-brand hover:underline">
            Online services
          </Link>
          .
        </p>
      </Section>

      <Section id="highlights" icon={Sparkles} title="Highlights" description="Up to four short points in the white strip under the hero.">
        <ul className="space-y-3">
          {highlights.map((h, i) => (
            <li key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-start">
              <Input
                aria-label={`Highlight ${i + 1} title`}
                maxLength={60}
                value={h.title}
                onChange={(e) => setHighlights((list) => list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                placeholder="Title"
              />
              <Input
                aria-label={`Highlight ${i + 1} text`}
                maxLength={160}
                value={h.text}
                onChange={(e) => setHighlights((list) => list.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                placeholder="One short sentence"
              />
              <Button type="button" variant="ghost" size="icon-lg" aria-label={`Remove highlight ${i + 1}`} onClick={() => setHighlights((list) => list.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
        {highlights.length < 4 && (
          <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl" onClick={() => setHighlights((l) => [...l, { title: "", text: "" }])}>
            <Plus className="size-4" /> Add highlight
          </Button>
        )}
      </Section>

      <Section id="message" icon={MessageSquareQuote} title="Superintendent’s message" description="The navy card beside the latest issuances. Leave the message empty to hide it.">
        <Field id="sds_name" label="Name">
          <Input id="sds_name" maxLength={120} value={form.sds_name} onChange={set("sds_name")} placeholder="e.g. Juan Dela Cruz, CESO VI" />
        </Field>
        <Field id="sds_title" label="Position">
          <Input id="sds_title" maxLength={120} value={form.sds_title} onChange={set("sds_title")} placeholder="Schools Division Superintendent" />
        </Field>
        <Field id="sds_photo" label="Photo" hint="A square portrait works best.">
          <div className="max-w-[200px]">
            <ImageField id="sds_photo" folder="site" aspect="aspect-square" value={form.sds_photo_url} onChange={(v) => setVal("sds_photo_url", v)} emptyLabel="Upload photo" />
          </div>
        </Field>
        <div className="space-y-1.5">
          <span id="sds-msg-label" className="text-sm font-medium">
            Message
          </span>
          <RichTextEditor compact value={form.sds_message} onChange={(v) => setVal("sds_message", v)} labelledBy="sds-msg-label" placeholder="A short welcome message…" />
        </div>
      </Section>

      <Section id="identity" icon={Eye} title="Vision, mission & core values" description="The navy band near the bottom of the homepage.">
        <Field id="vision" label="Vision">
          <Textarea id="vision" rows={4} maxLength={2000} value={form.vision} onChange={set("vision")} />
        </Field>
        <Field id="mission" label="Mission">
          <Textarea id="mission" rows={5} maxLength={2000} value={form.mission} onChange={set("mission")} />
        </Field>
        <Field id="core_values" label="Core values" hint="Separate with commas.">
          <Input id="core_values" maxLength={300} value={form.core_values} onChange={set("core_values")} />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-2xl border bg-card/95 p-3 shadow-[0_8px_24px_rgba(17,19,24,.08)] backdrop-blur">
        {error && (
          <p role="alert" className="mr-auto text-sm text-destructive">
            {error}
          </p>
        )}
        <a href="/" target="_blank" rel="noopener noreferrer" className="hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted sm:flex">
          <ExternalLink className="size-4" /> View homepage
        </a>
        <Button type="submit" className="h-10 rounded-lg px-5" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save homepage
        </Button>
      </div>
    </form>
  );
}
