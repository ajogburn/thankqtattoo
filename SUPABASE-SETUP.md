# ThankQTattoo — Supabase Setup (Production)

## Required Tables (already partially created)

You have:
- `portfolio`
- `portfolio_tags`

### Create this table for editable site content (highly recommended)

Run in SQL Editor:

```sql
create table if not exists public.site_settings (
  id integer primary key default 1,
  tagline text,
  bio text,
  phone text,
  shop_phone text,
  shop_name text,
  address text,
  availability text,
  updated_at timestamptz default now()
);

alter table public.site_settings enable row level security;

create policy "Public read site_settings"
  on public.site_settings for select using (true);

create policy "Authenticated can manage site_settings"
  on public.site_settings for all to authenticated using (true) with check (true);
```

### Row Level Security (RLS) reminders

For `portfolio` and `portfolio_tags` make sure you have policies like:

- Public SELECT (read)
- Authenticated INSERT / UPDATE / DELETE

Example for portfolio_tags (run if missing):

```sql
alter table public.portfolio_tags enable row level security;

create policy "Public can read tags" on public.portfolio_tags for select using (true);
create policy "Authenticated can manage tags" on public.portfolio_tags for all to authenticated using (true) with check (true);
```

## Storage

- Bucket `tattoo-images` must be **PUBLIC**

## Auth

- Enable Email provider in Authentication → Providers
- Create your admin user(s) in Authentication → Users (or use the Sign Up flow in admin.html)

The admin dashboard uses real Supabase Auth + RLS.

## Files

- `js/supabase-client.js` — all CRUD, uploads, auth, tags, settings
- `admin.html` — full protected dashboard
- `portfolio.html` — live public gallery + dynamic filters

Everything falls back gracefully if tables are missing or client is offline.

Enjoy the ink! 🔥
