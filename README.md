# DepEd Bayugan — official website + CMS

Public website and content management system for the **Department of Education – Schools Division of Bayugan City**.

- **Stack:** Next.js 16 (App Router, Cache Components) · Supabase (Postgres, Auth, Storage) · Tailwind + shadcn/ui (admin only) · TipTap editor
- **Database:** shared Supabase project `lvcbmopdstvupjpytjbb`; everything lives in the **`deped_bayugan`** schema and the **`deped_bayugan_public`** storage bucket.
- **Sign-in:** Google only, invite-only. Super admin: the address seeded in `supabase/migrations/20261113000000_deped_bayugan_init.sql`.

## What's editable in `/admin`

| Area | What it controls |
| --- | --- |
| Homepage | Hero title/intro/buttons/background, 4 highlights, Superintendent's message, vision/mission/core values |
| Posts | News, memoranda, advisories, bids… with reference no., PDF/Word/Excel attachment, cover image, feature / announcement-bar flags, editor → admin review workflow |
| Sections | Post categories at `/<slug>`; layout **Photo cards** or **Document list** |
| Pages | Rich-text pages at `/<slug>` (About Us, Citizen's Charter, …) |
| Menu | Two-level header menu (dropdowns), links to pages/sections/external systems |
| Online services | PRIME-HRM, SMS, … — hero quick links + services grid + `/services` |
| Team | Invite editors/admins by Google email |
| Settings | Site name, contact details, social links, auto-approve |

## Setup

```bash
cp .env.example .env.local   # fill in the publishable key
npm install
npm run dev
```

### One-time Supabase steps (shared project)

1. Apply `supabase/migrations/*.sql` in order (SQL editor or `supabase db query --linked -f …`). Already applied to `lvcbmopdstvupjpytjbb`.
2. **Dashboard → Project Settings → Data API → Exposed schemas:** add `deped_bayugan`.
3. **Authentication → Sign In / Providers:** Google enabled (shared with the other apps).
4. **Authentication → URL Configuration → Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.

Remove the starter sample posts with `supabase/rollback/remove_sample_posts.sql`. `supabase/rollback/rollback_deped_bayugan.sql` removes everything this app added.
