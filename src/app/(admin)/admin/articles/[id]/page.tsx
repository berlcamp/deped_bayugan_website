import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor, type EditorArticle } from "@/components/admin/editor/article-editor";
import { SITE_URL } from "@/lib/supabase/config";
import { getEditorContext } from "../editor-data";
import { EditorSkeleton } from "../editor-skeleton";

export const metadata: Metadata = { title: "Edit post" };

export default function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditArticle params={params} />
    </Suspense>
  );
}

async function EditArticle({ params }: { params: PageProps<"/admin/articles/[id]">["params"] }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { me, categories, autoApprove, siteName, supabase } = await getEditorContext();

  // RLS limits editors to their own posts (plus published ones, which they can't edit).
  const { data } = await supabase.from("articles").select("*, category:categories(name,slug,layout)").eq("id", id).maybeSingle();
  const article = data as EditorArticle | null;
  if (!article || (me.role !== "admin" && article.author_id !== me.id)) notFound();

  return (
    <ArticleEditor
      key={article.id}
      article={article}
      categories={categories}
      me={me}
      autoApprove={autoApprove}
      siteUrl={SITE_URL}
      siteName={siteName}
    />
  );
}
