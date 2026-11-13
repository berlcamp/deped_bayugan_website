import { Suspense } from "react";
import type { Metadata } from "next";
import { ArticleEditor } from "@/components/admin/editor/article-editor";
import { SITE_URL } from "@/lib/supabase/config";
import { getEditorContext } from "../editor-data";
import { EditorSkeleton } from "../editor-skeleton";

export const metadata: Metadata = { title: "New post" };

export default function NewArticlePage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewArticle />
    </Suspense>
  );
}

async function NewArticle() {
  const { me, categories, autoApprove, siteName } = await getEditorContext();
  return <ArticleEditor article={null} categories={categories} me={me} autoApprove={autoApprove} siteUrl={SITE_URL}
      siteName={siteName} />;
}
