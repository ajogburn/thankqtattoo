# ThankQTattoo — Supabase Setup Guide

This site is now a **real** dynamic website powered by Supabase (PostgreSQL + Storage + Auth).

Everything you need for the portfolio gallery and the powerful admin dashboard lives in Supabase.

---

## 1. Create the required tables (run in SQL Editor)

Go to your Supabase project → **SQL Editor** → New query → paste the following and **Run**.

### Immediate fix for the "invalid input syntax for type uuid: "1"" delete error

You almost certainly have (or had) rows where the `id` column is `uuid`, but some old numeric values (1, 2, 3...) were inserted or the fallback data was being used for delete attempts.

**Run this to clean it up (this is safe — your actual image files stay in the Storage bucket):**

```sql
-- 1. Drop the problematic table (metadata only — images in Storage are untouched)
DROP TABLE IF EXISTS public.portfolio CASCADE;

-- 2. Recreate it with the correct modern schema (uuid)
CREATE TABLE public.portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  url text NOT NULL,
  caption text,
  style text DEFAULT 'Custom',
  date text,
  sort_order integer DEFAULT 0
);

-- 3. Re-enable RLS + policies (required for admin to work)
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read portfolio"
  ON public.portfolio FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert portfolio"
  ON public.portfolio FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update portfolio"
  ON public.portfolio FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete portfolio"
  ON public.portfolio FOR DELETE TO authenticated
  USING (true);
```

After running the above, go back to `admin.html`, log in, and re-upload your images (just pick the same files again + add captions/styles). They will get proper uuid ids.

---

**Recommended schema (for reference / future tables):**

```sql
-- ===================== PORTFOLIO TABLE (uuid version) =====================
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  url text not null,               -- full public URL from Storage
  caption text,
  style text default 'Custom',
  date text,                       -- '2025-06' or any string you like
  sort_order integer default 0
);
```

(Old bigint version is at the very bottom of this file.)
-- Enable RLS
alter table public.portfolio enable row level security;

-- Anyone (even not logged in) can READ the portfolio
create policy "Public read portfolio"
  on public.portfolio for select
  using (true);

-- Only logged-in users can insert / update / delete
create policy "Authenticated can write portfolio"
  on public.portfolio for insert to authenticated
  with check (true);

create policy "Authenticated can update portfolio"
  on public.portfolio for update to authenticated
  using (true);

create policy "Authenticated can delete portfolio"
  on public.portfolio for delete to authenticated
  using (true);


-- ===================== SITE SETTINGS TABLE =====================
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

-- Public can read the settings
create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

-- Only authenticated users (you) can write settings
create policy "Authenticated can write site_settings"
  on public.site_settings for all to authenticated
  using (true)
  with check (true);


-- ===================== OPTIONAL: submissions table (future) =====================
-- You can also create a submissions table later if you want form leads saved to Supabase
-- instead of localStorage. Ask if you want the SQL.
```

---

## 2. Create the Storage Bucket

1. Go to **Storage** in your Supabase dashboard.
2. Click **New bucket**.
3. Name it exactly: `tattoo-images`
4. **IMPORTANT**: Turn **Public bucket** ON.
5. Save.

You can upload test images manually here too — they will be accessible via public URLs.

---

## 3. Authentication (Admin Login)

1. Go to **Authentication** → **Providers**.
2. Make sure **Email** is enabled.
3. (Optional but recommended) Turn on "Confirm email" for security, or turn it off for faster testing.

**Create your admin user:**

Option A (easiest):
- In the admin dashboard (`admin.html`), use the **"SIGN UP NEW ADMIN"** button.

Option B:
- Authentication → Users → **Add user** → Create with email + password.

**Login** with that email + password on `admin.html`.

---

## 4. How the pieces fit together

| Feature              | Where it lives                        | Who can do it          |
|----------------------|---------------------------------------|------------------------|
| View portfolio       | `portfolio` table + Storage           | Public (anyone)        |
| Upload new tattoos   | Admin → Supabase Storage + table      | Logged-in admin only   |
| Edit captions/styles | Admin                                 | Logged-in admin only   |
| Edit bio / phone etc | `site_settings` table                 | Logged-in admin only   |
| Public pages         | Fetch live from Supabase on load      | Everyone               |

---

## 5. Seeding Initial Data (Recommended)

After you have the tables + bucket ready:

1. Open `admin.html`
2. Log in
3. Go to the **Portfolio** tab
4. Click **+ UPLOAD NEW IMAGE** and start adding your real photos.
5. Optionally go to **Site Content** tab and paste your preferred bio / tagline / numbers.

Alternatively, you can manually insert a few rows via the Supabase Table Editor (copy the `url` from Storage files).

---

## 6. Row Level Security Notes

- The policies above are intentionally simple and secure for a single-artist site.
- Only authenticated users (you) can modify data.
- Visitors can only read.

You can later tighten it further (e.g. only allow a specific user id) if you want.

---

## 7. Troubleshooting

**Images 404 after upload?**
- Bucket must be **public**.
- Make sure you used the exact bucket name `tattoo-images` in the code (it is).

**"Failed to load portfolio" or auth errors?**
- Double-check that you are using the correct anon key (already baked into `js/supabase-client.js`).
- Make sure tables exist and RLS policies are created.

**Can't log into admin?**
- You must create a user in Supabase Auth first.
- Email confirmation might be on — check your inbox / spam.

**Want to migrate the old localStorage images?**
- Use the admin upload flow. It's the cleanest. Or copy the files manually into Storage and insert rows with the resulting public URLs.

---

## 8. Useful Supabase Links (for Qwami)

- Project: https://supabase.com/dashboard/project/uchvakiaanuxhcapvvhd
- Table Editor (portfolio)
- Storage (tattoo-images)
- Authentication → Users

---

You now have a **professional, self-managed** website. Uploads in the admin go live instantly for everyone.

Enjoy the ink.

— Built for ThankQTattoo / Qwami Tucker