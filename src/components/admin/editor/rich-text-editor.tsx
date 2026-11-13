"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { uploadImage } from "./upload-image";

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn("rounded-lg", active && "bg-accent text-accent-foreground hover:bg-accent")}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const active = useEditorState({ editor, selector: (s) => s.editor.isActive("link") });

  const apply = () => {
    const value = url.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!value) chain.unsetLink().run();
    else chain.setLink({ href: /^(https?:|mailto:|\/)/.test(value) ? value : `https://${value}` }).run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setUrl(editor.getAttributes("link").href ?? "");
      }}
      trigger={
        <Button type="button" variant="ghost" size="icon-lg" aria-label="Link" aria-pressed={active} className={cn("rounded-lg", active && "bg-accent text-accent-foreground")}>
          <Link2 />
        </Button>
      }
    >
      <form
        className="flex w-72 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <label htmlFor="link-url" className="sr-only">
          Link address
        </label>
        <Input id="link-url" autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-9" />
        <Button type="submit" className="h-9">
          {url.trim() ? "Apply" : "Remove"}
        </Button>
      </form>
    </Popover>
  );
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-[118px] z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b bg-card/95 px-2 py-1.5 backdrop-blur lg:top-[61px]"
    >
      <ToolButton label="Bold" shortcut="⌘B" active={s.bold} onClick={() => c().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="Italic" shortcut="⌘I" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <LinkButton editor={editor} />
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <ToolButton label="Heading" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolButton>
      <ToolButton label="Subheading" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolButton>
      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <ToolButton label="Divider" onClick={() => c().setHorizontalRule().run()}>
        <Minus />
      </ToolButton>
      <ToolButton label="Insert image" onClick={onImage} disabled={uploading}>
        {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
      </ToolButton>
      <span className="ml-auto flex">
        <ToolButton label="Undo" shortcut="⌘Z" disabled={!s.canUndo} onClick={() => c().undo().run()}>
          <Undo2 />
        </ToolButton>
        <ToolButton label="Redo" shortcut="⇧⌘Z" disabled={!s.canRedo} onClick={() => c().redo().run()}>
          <Redo2 />
        </ToolButton>
      </span>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  editable = true,
  labelledBy,
  placeholder = "Write here… Use the toolbar for headings, quotes and images.",
  compact = false,
}: {
  value: string;
  onChange: (html: string) => void;
  editable?: boolean;
  labelledBy?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: compact ? "px-4 py-4 sm:px-5 min-h-[180px]!" : "px-5 py-6 sm:px-8",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const insertImage = async (file: File) => {
    if (!editor) return;
    setUploading(true);
    try {
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src, alt: "" }).run();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="editor-content rounded-2xl border bg-card">
      {editor && editable && <Toolbar editor={editor} onImage={() => fileInput.current?.click()} uploading={uploading} />}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-[420px] px-5 py-6 text-muted-foreground sm:px-8">Loading editor…</div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) insertImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
