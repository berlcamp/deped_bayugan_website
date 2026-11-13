-- DepEd Bayugan website CMS — initial schema.
-- Everything lives in the "deped_bayugan" schema because this Supabase project is
-- shared with other apps (SMS, PRIME-HRM, …). Outside this schema it only adds one
-- storage bucket and that bucket's policies, namespaced by bucket id.

create schema if not exists deped_bayugan;
grant usage on schema deped_bayugan to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Staff (CMS users). Invite-only: a row must exist for the Google email first.
-- ---------------------------------------------------------------------------
create table deped_bayugan.staff (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users (id) on delete set null,
  email            text not null check (email = lower(email) and position('@' in email) > 1),
  full_name        text,
  avatar_url       text,
  role             text not null default 'editor' check (role in ('admin', 'editor')),
  is_super_admin   boolean not null default false,
  status           text not null default 'invited' check (status in ('invited', 'active', 'disabled')),
  invited_by       uuid references deped_bayugan.staff (id) on delete set null,
  invited_at       timestamptz not null default now(),
  joined_at        timestamptz,
  last_sign_in_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index staff_email_key on deped_bayugan.staff (email);
create index staff_invited_by_idx on deped_bayugan.staff (invited_by);

-- Paths reserved by the app; pages and sections may not use them.
create or replace function deped_bayugan.is_reserved_slug(p text)
returns boolean language sql immutable set search_path = '' as $$
  select p in ('admin', 'login', 'auth', 'api', 'search', 'services', 'rss.xml', 'sitemap.xml',
               'robots.txt', 'manifest.webmanifest', 'logos', 'cover.jpg', '_next')
$$;

-- ---------------------------------------------------------------------------
-- Sections (post categories). layout = how the section page lists posts:
--   'stories'   → photo cards (news, features)
--   'documents' → a register of issuances with reference no. and attachment
-- ---------------------------------------------------------------------------
create table deped_bayugan.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) between 1 and 60),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and not deped_bayugan.is_reserved_slug(slug)),
  description  text,
  layout       text not null default 'stories' check (layout in ('stories', 'documents')),
  sort_order   int not null default 0,
  show_in_nav  boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Posts (news, memoranda, advisories, bids …). Table is named "articles".
-- ---------------------------------------------------------------------------
create table deped_bayugan.articles (
  id                uuid primary key default gen_random_uuid(),
  title             text not null default '',
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt           text,
  content           text not null default '',
  cover_image_url   text,
  cover_image_alt   text,
  cover_caption     text,
  reference_no      text,
  attachment_url    text,
  attachment_name   text,
  category_id       uuid references deped_bayugan.categories (id) on delete set null,
  author_id         uuid references deped_bayugan.staff (id) on delete set null,
  author_name       text,
  author_avatar_url text,
  status            text not null default 'draft' check (status in ('draft', 'pending', 'published', 'rejected')),
  is_featured       boolean not null default false,
  is_breaking       boolean not null default false,  -- shown in the announcement bar
  tags              text[] not null default '{}',
  seo_title         text,
  seo_description   text,
  reading_minutes   int not null default 1 check (reading_minutes > 0),
  review_note       text,
  reviewed_by       uuid references deped_bayugan.staff (id) on delete set null,
  reviewed_at       timestamptz,
  submitted_at      timestamptz,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  search            tsvector generated always as (
                      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(reference_no, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
                    ) stored
);
create index articles_published_idx on deped_bayugan.articles (published_at desc) where status = 'published';
create index articles_status_idx    on deped_bayugan.articles (status, updated_at desc);
create index articles_category_idx  on deped_bayugan.articles (category_id);
create index articles_author_idx    on deped_bayugan.articles (author_id);
create index articles_reviewed_idx  on deped_bayugan.articles (reviewed_by);
create index articles_search_idx    on deped_bayugan.articles using gin (search);

create table deped_bayugan.article_views (
  article_id  uuid primary key references deped_bayugan.articles (id) on delete cascade,
  views       bigint not null default 0,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pages (About us, Mission & Vision, Citizen's Charter …) served at /<slug>.
-- ---------------------------------------------------------------------------
create table deped_bayugan.pages (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (length(trim(title)) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and not deped_bayugan.is_reserved_slug(slug)),
  excerpt          text,
  content          text not null default '',
  cover_image_url  text,
  status           text not null default 'draft' check (status in ('draft', 'published')),
  seo_title        text,
  seo_description  text,
  updated_by       uuid references deped_bayugan.staff (id) on delete set null,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index pages_updated_by_idx on deped_bayugan.pages (updated_by);

-- Pages and sections share the /<slug> namespace.
create or replace function deped_bayugan.guard_shared_slug()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'pages' and exists (select 1 from deped_bayugan.categories c where c.slug = new.slug) then
    raise exception 'The address /% is already used by a section.', new.slug using errcode = '23505';
  end if;
  if tg_table_name = 'categories' and exists (select 1 from deped_bayugan.pages p where p.slug = new.slug) then
    raise exception 'The address /% is already used by a page.', new.slug using errcode = '23505';
  end if;
  return new;
end $$;

create trigger pages_shared_slug before insert or update of slug on deped_bayugan.pages
  for each row execute function deped_bayugan.guard_shared_slug();
create trigger categories_shared_slug before insert or update of slug on deped_bayugan.categories
  for each row execute function deped_bayugan.guard_shared_slug();

-- ---------------------------------------------------------------------------
-- Header menu (two levels). url is an internal path ("/about-us") or a full link.
-- ---------------------------------------------------------------------------
create table deped_bayugan.menu_items (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references deped_bayugan.menu_items (id) on delete cascade,
  label         text not null check (length(trim(label)) between 1 and 60),
  url           text check (url is null or url ~ '^(/|https?://|mailto:|tel:)'),
  description   text,
  open_new_tab  boolean not null default false,
  is_visible    boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (parent_id is distinct from id)
);
create index menu_items_parent_idx on deped_bayugan.menu_items (parent_id, sort_order);

-- Only two levels: a child can't have children.
create or replace function deped_bayugan.guard_menu_depth()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is not null then
    if exists (select 1 from deped_bayugan.menu_items m where m.id = new.parent_id and m.parent_id is not null) then
      raise exception 'Menus can only be two levels deep.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and exists (select 1 from deped_bayugan.menu_items m where m.parent_id = new.id) then
      raise exception 'Move this item''s sub-items first.' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger menu_items_depth before insert or update of parent_id on deped_bayugan.menu_items
  for each row execute function deped_bayugan.guard_menu_depth();

-- ---------------------------------------------------------------------------
-- Online services (PRIME-HRM, SMS …): hero quick links + services grid.
-- ---------------------------------------------------------------------------
create table deped_bayugan.services (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) between 1 and 80),
  description  text,
  url          text not null check (url ~ '^(/|https?://)'),
  icon         text not null default 'globe',
  badge        text,
  is_featured  boolean not null default false,   -- listed in the hero card
  is_visible   boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Site settings + homepage content (single row).
-- ---------------------------------------------------------------------------
create table deped_bayugan.settings (
  id                         boolean primary key default true check (id),
  site_name                  text not null default 'DepEd Bayugan',
  tagline                    text not null default 'Schools Division of Bayugan City',
  description                text not null default 'The official website of the Department of Education – Schools Division of Bayugan City, Caraga Region.',
  auto_approve_editor_posts  boolean not null default false,
  -- contact
  address                    text,
  contact_email              text,
  contact_phone              text,
  office_hours               text,
  map_url                    text,
  facebook_url               text,
  youtube_url                text,
  -- hero
  hero_eyebrow               text not null default 'Official Website',
  hero_title                 text not null default 'Quality education for every learner of',
  hero_highlight             text not null default 'Bayugan City',
  hero_subtitle              text not null default '',
  hero_image_url             text,
  hero_primary_label         text,
  hero_primary_url           text,
  hero_secondary_label       text,
  hero_secondary_url         text,
  -- leadership message
  sds_name                   text,
  sds_title                  text,
  sds_photo_url              text,
  sds_message                text,
  -- identity
  mission                    text,
  vision                     text,
  core_values                text,
  highlights                 jsonb not null default '[]'::jsonb check (jsonb_typeof(highlights) = 'array'),
  updated_at                 timestamptz not null default now(),
  updated_by                 uuid references deped_bayugan.staff (id) on delete set null
);
create index settings_updated_by_idx on deped_bayugan.settings (updated_by);

-- ---------------------------------------------------------------------------
-- Helpers. Staff rights require an OAuth (Google) session: auth.users is shared
-- with other apps, so a password session on the same email never counts.
-- ---------------------------------------------------------------------------
create or replace function deped_bayugan.is_oauth_session()
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
    where m ->> 'method' = 'oauth'
  )
$$;

create or replace function deped_bayugan.current_staff_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from deped_bayugan.staff
  where user_id = auth.uid() and status = 'active' and deped_bayugan.is_oauth_session()
$$;

create or replace function deped_bayugan.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select deped_bayugan.is_oauth_session()
     and exists (select 1 from deped_bayugan.staff where user_id = auth.uid() and status = 'active')
$$;

create or replace function deped_bayugan.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select deped_bayugan.is_oauth_session()
     and exists (select 1 from deped_bayugan.staff
                 where user_id = auth.uid() and status = 'active' and role = 'admin')
$$;

create or replace function deped_bayugan.auto_approve_enabled()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select auto_approve_editor_posts from deped_bayugan.settings where id), false)
$$;

create or replace function deped_bayugan.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger staff_touch      before update on deped_bayugan.staff      for each row execute function deped_bayugan.touch_updated_at();
create trigger categories_touch before update on deped_bayugan.categories for each row execute function deped_bayugan.touch_updated_at();
create trigger settings_touch   before update on deped_bayugan.settings   for each row execute function deped_bayugan.touch_updated_at();
create trigger menu_items_touch before update on deped_bayugan.menu_items for each row execute function deped_bayugan.touch_updated_at();
create trigger services_touch   before update on deped_bayugan.services   for each row execute function deped_bayugan.touch_updated_at();

create or replace function deped_bayugan.page_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if current_user in ('anon', 'authenticated') then
    new.updated_by := deped_bayugan.current_staff_id();
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger pages_touch before insert or update on deped_bayugan.pages for each row execute function deped_bayugan.page_touch();

-- ---------------------------------------------------------------------------
-- Sign-in: link a Google account to its invite (confirmed Google identity only).
-- ---------------------------------------------------------------------------
create or replace function deped_bayugan.claim_staff_access()
returns setof deped_bayugan.staff
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_meta  jsonb;
begin
  if v_uid is null or not deped_bayugan.is_oauth_session() then
    return;
  end if;

  select lower(u.email), u.raw_user_meta_data into v_email, v_meta
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  if v_email is null or not exists (
    select 1 from auth.identities i
    where i.user_id = v_uid and i.provider = 'google' and lower(i.identity_data ->> 'email') = v_email
  ) then
    return;
  end if;

  return query
  with claimed as (
    update deped_bayugan.staff s set
      user_id         = v_uid,
      status          = case when s.status = 'invited' then 'active' else s.status end,
      joined_at       = coalesce(s.joined_at, now()),
      last_sign_in_at = now(),
      full_name       = coalesce(nullif(trim(s.full_name), ''), v_meta ->> 'full_name', v_meta ->> 'name'),
      avatar_url      = coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture', s.avatar_url)
    where s.email = v_email and (s.user_id is null or s.user_id = v_uid)
    returning s.*
  )
  select * from claimed;
end $$;

-- ---------------------------------------------------------------------------
-- Staff guard: protect the super admin; keep privileged columns admin-only.
-- ---------------------------------------------------------------------------
create or replace function deped_bayugan.guard_staff()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.is_super_admin then
      raise exception 'The super admin cannot be removed.' using errcode = '42501';
    end if;
    return old;
  end if;

  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_super_admin := false;
      new.user_id := null;
      new.status := 'invited';
      new.invited_by := deped_bayugan.current_staff_id();
      new.email := lower(trim(new.email));
    else
      if new.is_super_admin is distinct from old.is_super_admin
         or new.user_id is distinct from old.user_id then
        raise exception 'Not allowed.' using errcode = '42501';
      end if;
      if old.is_super_admin and (new.role <> 'admin' or new.status = 'disabled' or new.email <> old.email) then
        raise exception 'The super admin cannot be demoted, disabled or renamed.' using errcode = '42501';
      end if;
      if old.user_id is not null and new.email <> old.email then
        raise exception 'Email cannot change after the person has signed in.' using errcode = '42501';
      end if;
      if new.status = 'invited' and old.status <> 'invited' then
        new.status := old.status;
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger staff_guard before insert or update or delete on deped_bayugan.staff
  for each row execute function deped_bayugan.guard_staff();

-- ---------------------------------------------------------------------------
-- Post workflow: editors draft and submit; admins publish/reject.
-- ---------------------------------------------------------------------------
create or replace function deped_bayugan.article_workflow()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_staff  uuid := deped_bayugan.current_staff_id();
  v_admin  boolean := deped_bayugan.is_admin() or current_user not in ('anon', 'authenticated');
  v_status_changed boolean := tg_op = 'INSERT' or new.status is distinct from old.status;
  v_name   text;
  v_avatar text;
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.author_id := coalesce(case when v_admin then new.author_id end, v_staff);
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.review_note := null;
    new.submitted_at := null;
    new.created_at := now();
    if not v_admin then
      new.published_at := null;
    end if;
  end if;

  if not v_admin then
    if tg_op = 'UPDATE' then
      new.author_id    := old.author_id;
      new.reviewed_by  := old.reviewed_by;
      new.reviewed_at  := old.reviewed_at;
      new.review_note  := old.review_note;
      new.is_featured  := old.is_featured;
      new.is_breaking  := old.is_breaking;
      new.created_at   := old.created_at;
      new.submitted_at := old.submitted_at;
      new.published_at := old.published_at;
    else
      new.is_featured := false;
      new.is_breaking := false;
    end if;

    select full_name, avatar_url into v_name, v_avatar from deped_bayugan.staff where id = new.author_id;
    new.author_name := v_name;
    new.author_avatar_url := v_avatar;

    if new.status = 'rejected' and v_status_changed then
      raise exception 'Only admins can reject posts.' using errcode = '42501';
    end if;

    if new.status in ('pending', 'published') and v_status_changed then
      new.status := case when deped_bayugan.auto_approve_enabled() then 'published' else 'pending' end;
    end if;
  elsif v_status_changed and new.status in ('published', 'rejected') then
    new.reviewed_by := v_staff;
    new.reviewed_at := now();
  end if;

  if v_status_changed and new.status = 'pending' then
    new.submitted_at := now();
  end if;

  if new.status = 'published' then
    if v_status_changed and (
      not v_admin
      or new.published_at is null
      or (tg_op = 'UPDATE' and new.published_at is not distinct from old.published_at)
    ) then
      new.published_at := now();
    end if;
    new.published_at := coalesce(new.published_at, now());
    new.review_note := null;
  end if;

  if v_status_changed and new.status not in ('rejected', 'published') and not v_admin then
    new.review_note := null;
  end if;

  if new.author_name is null or trim(new.author_name) = '' or new.author_avatar_url is null then
    select full_name, avatar_url into v_name, v_avatar from deped_bayugan.staff where id = new.author_id;
    new.author_name := coalesce(nullif(trim(new.author_name), ''), v_name);
    new.author_avatar_url := coalesce(new.author_avatar_url, v_avatar);
  end if;

  return new;
end $$;

create trigger articles_workflow before insert or update on deped_bayugan.articles
  for each row execute function deped_bayugan.article_workflow();

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------
create or replace function deped_bayugan.record_view(p_article_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from deped_bayugan.articles
             where id = p_article_id and status = 'published' and published_at <= now()) then
    insert into deped_bayugan.article_views as v (article_id, views) values (p_article_id, 1)
    on conflict (article_id) do update set views = v.views + 1, updated_at = now();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table deped_bayugan.staff         enable row level security;
alter table deped_bayugan.categories    enable row level security;
alter table deped_bayugan.articles      enable row level security;
alter table deped_bayugan.article_views enable row level security;
alter table deped_bayugan.pages         enable row level security;
alter table deped_bayugan.menu_items    enable row level security;
alter table deped_bayugan.services      enable row level security;
alter table deped_bayugan.settings      enable row level security;

-- staff
create policy "staff: admins and self can read" on deped_bayugan.staff
  for select to authenticated using (deped_bayugan.is_admin() or user_id = (select auth.uid()));
create policy "staff: admins invite" on deped_bayugan.staff
  for insert to authenticated with check (deped_bayugan.is_admin() and role in ('admin', 'editor'));
create policy "staff: admins update" on deped_bayugan.staff
  for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());
create policy "staff: admins remove" on deped_bayugan.staff
  for delete to authenticated using (deped_bayugan.is_admin());

-- categories, menu, services, settings: public read, admin write
create policy "categories: public read" on deped_bayugan.categories for select to anon, authenticated using (true);
create policy "categories: admins insert" on deped_bayugan.categories for insert to authenticated with check (deped_bayugan.is_admin());
create policy "categories: admins update" on deped_bayugan.categories for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());
create policy "categories: admins delete" on deped_bayugan.categories for delete to authenticated using (deped_bayugan.is_admin());

create policy "menu: public read" on deped_bayugan.menu_items for select to anon, authenticated using (true);
create policy "menu: admins insert" on deped_bayugan.menu_items for insert to authenticated with check (deped_bayugan.is_admin());
create policy "menu: admins update" on deped_bayugan.menu_items for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());
create policy "menu: admins delete" on deped_bayugan.menu_items for delete to authenticated using (deped_bayugan.is_admin());

create policy "services: public read" on deped_bayugan.services for select to anon, authenticated using (true);
create policy "services: admins insert" on deped_bayugan.services for insert to authenticated with check (deped_bayugan.is_admin());
create policy "services: admins update" on deped_bayugan.services for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());
create policy "services: admins delete" on deped_bayugan.services for delete to authenticated using (deped_bayugan.is_admin());

create policy "settings: public read" on deped_bayugan.settings for select to anon, authenticated using (true);
create policy "settings: admins update" on deped_bayugan.settings for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());

-- pages: public sees published; staff see all; admins write
create policy "pages: public read published" on deped_bayugan.pages for select to anon
  using (status = 'published');
create policy "pages: signed-in read" on deped_bayugan.pages for select to authenticated
  using (status = 'published' or deped_bayugan.is_staff());
create policy "pages: admins insert" on deped_bayugan.pages for insert to authenticated with check (deped_bayugan.is_admin());
create policy "pages: admins update" on deped_bayugan.pages for update to authenticated using (deped_bayugan.is_admin()) with check (deped_bayugan.is_admin());
create policy "pages: admins delete" on deped_bayugan.pages for delete to authenticated using (deped_bayugan.is_admin());

-- articles
create policy "articles: public read published" on deped_bayugan.articles
  for select to anon
  using (status = 'published' and published_at <= now());
create policy "articles: signed-in read" on deped_bayugan.articles
  for select to authenticated
  using (
    (status = 'published' and published_at <= now())
    or deped_bayugan.is_admin()
    or author_id = deped_bayugan.current_staff_id()
  );
create policy "articles: staff create" on deped_bayugan.articles
  for insert to authenticated with check (deped_bayugan.is_staff());
create policy "articles: admins or own editable" on deped_bayugan.articles
  for update to authenticated
  using (
    deped_bayugan.is_admin()
    or (author_id = deped_bayugan.current_staff_id()
        and (status in ('draft', 'pending', 'rejected')
             or (status = 'published' and deped_bayugan.auto_approve_enabled())))
  )
  with check (deped_bayugan.is_admin() or author_id = deped_bayugan.current_staff_id());
create policy "articles: admins or own unpublished delete" on deped_bayugan.articles
  for delete to authenticated
  using (
    deped_bayugan.is_admin()
    or (author_id = deped_bayugan.current_staff_id() and status in ('draft', 'pending', 'rejected'))
  );

create policy "article_views: public read" on deped_bayugan.article_views for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select on deped_bayugan.categories, deped_bayugan.article_views, deped_bayugan.settings,
                deped_bayugan.pages, deped_bayugan.menu_items, deped_bayugan.services to anon;
-- Anonymous readers only get public article columns (no review notes / internal ids).
grant select (
  id, title, slug, excerpt, content, cover_image_url, cover_image_alt, cover_caption, reference_no,
  attachment_url, attachment_name, category_id, author_name, author_avatar_url, status, is_featured,
  is_breaking, tags, seo_title, seo_description, reading_minutes, published_at, created_at, updated_at, search
) on deped_bayugan.articles to anon;
grant select, insert, update, delete on all tables in schema deped_bayugan to authenticated;
grant all on all tables in schema deped_bayugan to service_role;

revoke execute on all functions in schema deped_bayugan from public;
grant execute on function deped_bayugan.record_view(uuid) to anon, authenticated;
grant execute on function deped_bayugan.claim_staff_access(),
                          deped_bayugan.current_staff_id(),
                          deped_bayugan.is_staff(),
                          deped_bayugan.is_admin(),
                          deped_bayugan.is_oauth_session(),
                          deped_bayugan.auto_approve_enabled() to authenticated;
grant execute on function deped_bayugan.is_reserved_slug(text) to anon, authenticated;
grant execute on all functions in schema deped_bayugan to service_role;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for images and PDF attachments.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('deped_bayugan_public', 'deped_bayugan_public', true, 26214400,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/msword', 'application/vnd.ms-excel'])
on conflict (id) do nothing;

create policy "deped_bayugan: staff upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'deped_bayugan_public'
    and (storage.foldername(name))[1] in ('articles', 'pages', 'files', 'site')
    and deped_bayugan.is_staff()
  );
create policy "deped_bayugan: staff list" on storage.objects
  for select to authenticated
  using (bucket_id = 'deped_bayugan_public' and deped_bayugan.is_staff());
create policy "deped_bayugan: owners or admins update" on storage.objects
  for update to authenticated
  using (bucket_id = 'deped_bayugan_public' and deped_bayugan.is_staff()
         and (owner_id = (select auth.uid())::text or deped_bayugan.is_admin()));
create policy "deped_bayugan: owners or admins delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'deped_bayugan_public' and deped_bayugan.is_staff()
         and (owner_id = (select auth.uid())::text or deped_bayugan.is_admin()));

-- ---------------------------------------------------------------------------
-- Super admin
-- ---------------------------------------------------------------------------
insert into deped_bayugan.staff (email, role, is_super_admin, status)
values ('berlcamp@gmail.com', 'admin', true, 'invited')
on conflict do nothing;
