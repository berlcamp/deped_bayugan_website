"use client";

import { useRef, useState } from "react";
import { FileUp, FileText, ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadDocument, uploadImage, type UploadFolder } from "./upload-image";

/** A single uploadable image (banner, hero photo, portrait). */
export function ImageField({
  id,
  value,
  onChange,
  folder,
  aspect = "aspect-video",
  emptyLabel = "Upload an image",
  disabled,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  aspect?: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={`${aspect} w-full object-cover`} />
          {!disabled && (
            <div className="absolute inset-x-2 bottom-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" className="h-8 flex-1 shadow" onClick={() => input.current?.click()} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Replace
              </Button>
              <Button type="button" size="icon-sm" variant="secondary" className="size-8 shadow" aria-label="Remove image" onClick={() => onChange("")}>
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          id={id}
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          className={`flex ${aspect} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-accent/40 disabled:opacity-60`}
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImageUp className="size-6" />}
          <span className="font-medium text-foreground">{busy ? "Uploading…" : emptyLabel}</span>
          <span className="text-xs">JPG, PNG or WebP</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** PDF / Word / Excel attachment with an editable display name. */
export function AttachmentField({
  url,
  name,
  disabled,
  onChange,
}: {
  url: string;
  name: string;
  disabled?: boolean;
  onChange: (patch: { attachment_url?: string; attachment_name?: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await uploadDocument(file);
      onChange({ attachment_url: uploaded, attachment_name: name || file.name });
      toast.success("File attached");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {url ? (
        <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
            {name || "Attached file"}
          </a>
          {!disabled && (
            <>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Replace file" onClick={() => input.current?.click()} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" aria-label="Remove file" onClick={() => onChange({ attachment_url: "", attachment_name: "" })}>
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      ) : (
        <Button type="button" variant="outline" className="h-11 w-full gap-2 rounded-xl" disabled={disabled || busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <FileUp className="size-4" />}
          {busy ? "Uploading…" : "Attach PDF, Word or Excel"}
        </Button>
      )}
      {url && (
        <div className="space-y-1.5">
          <Label htmlFor="attachment-name">File label</Label>
          <Input
            id="attachment-name"
            value={name}
            disabled={disabled}
            maxLength={200}
            onChange={(e) => onChange({ attachment_name: e.target.value })}
            placeholder="e.g. DM No. 001, s. 2026 (signed copy)"
          />
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
