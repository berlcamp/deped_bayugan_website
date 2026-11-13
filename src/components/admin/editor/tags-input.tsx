"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function TagsInput({ id, value, onChange, disabled }: { id: string; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => t.trim().replace(/\s+/g, " "))
      .filter((t) => t && t.length <= 40);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.some((t) => t.toLowerCase() === p.toLowerCase()) && next.length < 12) next.push(p);
    onChange(next);
    setDraft("");
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
      {value.map((t) => (
        <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full bg-accent pl-2.5 pr-1 text-xs font-medium text-accent-foreground">
          {t}
          {!disabled && (
            <button
              type="button"
              className="grid size-5 place-items-center rounded-full hover:bg-black/10"
              aria-label={`Remove tag ${t}`}
              onClick={() => onChange(value.filter((x) => x !== t))}
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Add topics, press Enter"}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
