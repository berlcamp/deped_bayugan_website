"use client";

import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/supabase/config";

const MAX_SIDE = 2000;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Resizes to at most 2000px and re-encodes as JPEG before uploading, so pages load fast and
 * every cover works in the Facebook share-image renderer (which can't read WebP/AVIF).
 * GIFs are uploaded as-is to keep animation.
 */
async function prepare(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === "image/gif") return { blob: file, ext: "gif", type: file.type };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs get a white background instead of black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/jpeg", 0.85),
  );
  return { blob, ext: "jpg", type: "image/jpeg" };
}

export type UploadFolder = "articles" | "pages" | "site";

export async function uploadImage(file: File, folder: UploadFolder = "articles"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_BYTES * 3) throw new Error("That image is too large (max 30 MB before resizing).");

  const { blob, ext, type } = await prepare(file);
  if (blob.size > MAX_BYTES) throw new Error("That image is still over 10 MB after resizing.");

  const now = new Date();
  const path = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: type, cacheControl: "31536000" });
  if (error) throw new Error(error.message.includes("row-level security") ? "You don't have permission to upload." : error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

const DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};
const MAX_DOC_BYTES = 25 * 1024 * 1024;

/** Uploads a PDF/Word/Excel attachment as-is. Returns its public URL. */
export async function uploadDocument(file: File): Promise<string> {
  const ext = DOC_TYPES[file.type];
  if (!ext) throw new Error("Attach a PDF, Word or Excel file.");
  if (file.size > MAX_DOC_BYTES) throw new Error("That file is over 25 MB.");
  const now = new Date();
  const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";
  const path = `files/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(error.message.includes("row-level security") ? "You don't have permission to upload." : error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
