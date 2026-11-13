"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadImage } from "./upload-image";

export function CoverImageField({
  url,
  alt,
  caption,
  disabled,
  onChange,
}: {
  url: string;
  alt: string;
  caption: string;
  disabled?: boolean;
  onChange: (patch: { cover_image_url?: string; cover_image_alt?: string; cover_caption?: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handle = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange({ cover_image_url: await uploadImage(file) });
      toast.success("Cover image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {url ? (
        <div className="group relative overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={alt || "Cover image preview"} className="aspect-video w-full object-cover" />
          {!disabled && (
            <div className="absolute inset-x-2 bottom-2 flex gap-2">
              <Button type="button" size="sm" variant="secondary" className="h-8 flex-1 shadow" onClick={() => input.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Replace
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="size-8 shadow"
                aria-label="Remove cover image"
                onClick={() => onChange({ cover_image_url: "" })}
              >
                <Trash2 />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-accent/40 disabled:pointer-events-none disabled:opacity-60",
            dragging && "border-ring bg-accent/60",
          )}
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImageUp className="size-6" />}
          <span className="font-medium text-foreground">{uploading ? "Uploading…" : "Add a cover image"}</span>
          <span className="text-xs">Drag & drop or click · JPG, PNG, WebP</span>
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
      {url && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="cover-alt">Image description</Label>
            <Input
              id="cover-alt"
              value={alt}
              disabled={disabled}
              onChange={(e) => onChange({ cover_image_alt: e.target.value })}
              placeholder="What’s in the photo? (for screen readers & Google)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover-caption">Caption & credit</Label>
            <Input
              id="cover-caption"
              value={caption}
              disabled={disabled}
              onChange={(e) => onChange({ cover_caption: e.target.value })}
              placeholder="e.g. Crowds at the plaza. Photo: J. Cruz"
            />
          </div>
        </>
      )}
    </div>
  );
}
