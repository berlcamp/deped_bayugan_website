"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteArticle } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ArticleRowActions({
  id,
  title,
  publicHref,
  canDelete,
}: {
  id: string;
  title: string;
  publicHref: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title="Delete this post?"
      description={
        <>
          “{title || "Untitled post"}” will be permanently deleted{publicHref ? " and removed from the website" : ""}. This can’t be undone.
        </>
      }
      onConfirm={async () => {
        const res = await deleteArticle(id);
        if (!res.ok) {
          toast.error(res.error);
          return false;
        }
        toast.success("Post deleted");
        router.refresh();
      }}
      trigger={(open) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label={`Actions for ${title || "untitled post"}`} />}>
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem render={<Link href={`/admin/articles/${id}`} />}>
              <Pencil /> Edit
            </DropdownMenuItem>
            {publicHref && (
              <DropdownMenuItem render={<a href={publicHref} target="_blank" rel="noopener noreferrer" />}>
                <ExternalLink /> View on site
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={open}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
