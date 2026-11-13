export type Role = "admin" | "editor";
export type StaffStatus = "invited" | "active" | "disabled";
export type ArticleStatus = "draft" | "pending" | "published" | "rejected";
export type PageStatus = "draft" | "published";
export type CategoryLayout = "stories" | "documents";

export type Staff = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  is_super_admin: boolean;
  status: StaffStatus;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  last_sign_in_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  layout: CategoryLayout;
  sort_order: number;
  show_in_nav: boolean;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_caption: string | null;
  reference_no: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  category_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  is_breaking: boolean;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  reading_minutes: number;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleWithCategory = Article & { category: Pick<Category, "name" | "slug" | "layout"> | null };

/** Lightweight shape used for lists and cards on the public site. */
export type ArticleCard = Pick<
  Article,
  | "id" | "title" | "slug" | "excerpt" | "cover_image_url" | "cover_image_alt" | "reference_no" | "attachment_url"
  | "author_name" | "published_at" | "reading_minutes" | "is_breaking" | "is_featured"
> & { category: Pick<Category, "name" | "slug" | "layout"> | null };

export type Page = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: PageStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  parent_id: string | null;
  label: string;
  url: string | null;
  description: string | null;
  open_new_tab: boolean;
  is_visible: boolean;
  sort_order: number;
};
export type MenuNode = MenuItem & { children: MenuItem[] };

export type Service = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  icon: string;
  badge: string | null;
  is_featured: boolean;
  is_visible: boolean;
  sort_order: number;
};

export type Highlight = { title: string; text: string };

export type Settings = {
  site_name: string;
  tagline: string;
  description: string;
  auto_approve_editor_posts: boolean;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  office_hours: string | null;
  map_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  hero_eyebrow: string;
  hero_title: string;
  hero_highlight: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  hero_primary_label: string | null;
  hero_primary_url: string | null;
  hero_secondary_label: string | null;
  hero_secondary_url: string | null;
  sds_name: string | null;
  sds_title: string | null;
  sds_photo_url: string | null;
  sds_message: string | null;
  mission: string | null;
  vision: string | null;
  core_values: string | null;
  highlights: Highlight[];
  updated_at: string;
};
