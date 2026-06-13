# ThankQTattoo — Official Website

Modern, dark, edgy, immersive website for tattoo artist **Qwami Tucker** (@thankqtattoos).

**Live vibe:** Deep blacks, blood reds, high-contrast ink textures, bold typography, smooth animations, full-bleed imagery.

## Pages

- **index.html** — Homepage with powerful hero, tagline, CTAs, recent work teaser, integrated sections (About, Services preview, Contact teaser).
- **portfolio.html** — Full immersive masonry gallery with style filters, lightbox, captions, and Instagram live feed embed slot.
- **about.html** — Full artist bio + photo + shop info.
- **services.html** — Specialties list + prominent booking/consultation form + policies.
- **contact.html** — Contact form, phone, email placeholder, Google Map embed, social links.
- **admin.html** — Protected simple CMS dashboard (localStorage-powered).

All pages are mobile-first responsive, fast, and SEO-friendly with proper meta tags.

## Key Features Implemented

- Stunning dark tattoo aesthetic with Tailwind + custom CSS.
- Hero with subtle canvas ink particle effects (performant).
- Masonry/filterable portfolio with pure JS lightbox (keyboard + swipe friendly).
- Dynamic content via localStorage — admin edits are instantly reflected on public pages.
- Manual portfolio management (upload your own images as Data URLs — works offline/demo).
- Forms store submissions locally; admin can view/export.
- Placeholder spots + clear instructions for:
  - Real Instagram live feed (Elfsight / EmbedSocial recommended).
  - Production email notifications (Formspree, EmailJS, Netlify Forms, Resend, etc.).
  - Real auth (upgrade from the simple password demo).
- Google Analytics 4 placeholder script (easy swap).
- Deploy-ready for Vercel, Netlify, GitHub Pages, Cloudflare Pages.

## Quick Start (Local)

1. Open `index.html` directly in a browser (double-click or `start index.html`).
2. All other pages work the same way — no build step required.
3. For best experience, serve via a local server:

```powershell
# In this folder
python -m http.server 8000
# or
npx serve .
```

Then visit http://localhost:8000

## Instagram Integration (Live Feed)

The site supports **two modes** on Portfolio and Home teaser:

1. **Curated / Manual** (default + fully editable via Admin)
2. **Live Instagram** (auto-updates from @thankqtattoos)

### Recommended: Elfsight Instagram Feed (easiest, beautiful, free tier available)

1. Go to https://elfsight.com/instagram-feed-widget/
2. Create a free account and new "Instagram Feed" widget.
3. Connect Instagram account or use public profile @thankqtattoos (or your business/creator account).
4. Customize style to match the site (dark theme, blood red accents, masonry/grid layout).
5. Copy the generated **Embed code** (the `<script>` + `<div>` block).
6. In `portfolio.html` (and optionally `index.html`), find the comment:

   ```html
   <!-- INSTAGRAM WIDGET PLACEHOLDER - Replace this entire div with your Elfsight/EmbedSocial embed code -->
   ```

7. Paste the widget code in its place.
8. Refresh — your latest posts will appear live and auto-sync.

**Alternatives:**
- EmbedSocial (embedsocial.com)
- Juicer, SociableKit, or Powr.io Instagram widgets
- For advanced: Instagram Basic Display API + custom fetch (requires Meta app approval, limited to last 60 days media, more dev work).

**Tip:** For the absolute best performance + design control, many artists keep a curated selection of 12-20 hero pieces in the manual grid (managed in Admin) + the widget below it as "More from Instagram".

## Admin Dashboard (CMS)

**URL:** Open `admin.html` in browser.

### Login (Demo)
- Default password: `thankq2025`
- Change this immediately in production (see below).

After login you can:
- **Portfolio Manager**
  - Upload new photos (JPG/PNG/WebP recommended).
  - Add caption, select or type a style tag (American Traditional, Small Pieces, Custom, Coverups, etc.).
  - Edit any existing item caption or style.
  - Delete items.
  - Images are stored as base64 in your browser (localStorage). This works great for dozens of images.
- **Content Editor**
  - Live-edit bio, tagline, contact phone, shop address, availability note.
  - Changes save instantly and appear on public pages.
- **Submissions / Bookings Inbox**
  - See every consultation & contact form submission.
  - Mark as "Contacted", delete, export as CSV (for follow-up in your email client).
- **Settings**
  - Change the admin password (stored in localStorage too — for demo only).
  - Clear all data / Restore defaults.

**How public pages stay in sync:**
Every public HTML file runs a small script on load that reads `localStorage.thankq_portfolio`, `localStorage.thankq_content`, etc. and overrides the default content.

## Production Recommendations & Upgrades

### 1. Real Backend + Database (Recommended for serious use)
Replace the localStorage CMS with one of these (both deploy easily on Vercel/Netlify):

- **Supabase** (free tier, Postgres + Storage + Auth): Best match.
  - Create tables: `portfolio`, `content`, `submissions`.
  - Use Supabase Storage for real image uploads (much better than base64).
  - Row Level Security + simple password or magic link for admin.
- **Firebase** (Firestore + Storage + Auth)
- **PlanetScale + Vercel serverless functions** or **Turso**

### 2. Real Authentication
- Supabase Auth (email + password, or magic links)
- Or simple password-protected route + Netlify/ Vercel Edge Function middleware (advanced).

Current admin is client-side only for demo convenience. Anyone can view source. This is intentional for a beautiful portfolio starter.

### 3. Form Handling + Email Notifications
Current forms save to localStorage only.

**Easy options (zero backend code):**
- **Formspree** (formspree.io) — add your endpoint to the forms.
- **Netlify Forms** — add `data-netlify="true"` + hidden inputs (if hosting on Netlify).
- **EmailJS** (client-side) — great for simple transactional.
- **Resend** or **SendGrid** via serverless function.

Example Formspree swap: Change the `<form>` action to `https://formspree.io/f/YOUR_ID`.

### 4. Hosting & Deployment

**Vercel (recommended)**
```bash
npm i -g vercel
vercel
```

**Netlify**
- Drag the entire folder into https://app.netlify.com/drop
- Or connect GitHub repo.

**GitHub Pages**
- Push to a repo → Settings → Pages → Deploy from main branch / root.

All files are pure static HTML + Tailwind Play CDN + vanilla JS. No build step required.

Add a custom domain in your host dashboard and enable HTTPS (automatic).

### 5. SEO & Analytics
- All meta tags (title, description, Open Graph, Twitter) are pre-filled and realistic.
- Update the canonical URLs and `og:image` once you have hero shots.
- Google Analytics: Find the commented `gtag` script in each HTML `<head>` and replace `G-XXXXXXXXXX` with your real measurement ID.
- Consider adding a `sitemap.xml` and `robots.txt` for larger scale.

### 6. Performance
- Images are served with `loading="lazy"`.
- Keep portfolio under ~25 images for fast loads.
- When using real images, run through https://squoosh.app or TinyPNG.
- The ink particles are deliberately lightweight (max 45 particles).

### 7. Swap in Real Photos
- Hero background: Replace the `background-image` URL in `.hero` (or add a `<video>` background).
- About page photo: Replace `img/Screenshot 2026-06-12 193538_edited.png` (or any local screenshot) with a high-quality professional portrait.
- Portfolio: Use Admin upload flow or manually edit the default array in the JS at the bottom of `portfolio.html` / `index.html`.
- Recommended sizes:
  - Hero: 2000×1200+ px
  - Masonry cards: 800–1200 px wide
  - About portrait: 1200×1600 portrait

## Admin Password (Demo)

Current default: `thankq2025`

**To change it:**
1. Open `admin.html`
2. In the script at the bottom, locate the `ADMIN_PASSWORD` constant and change it.
3. Or after login use the Settings tab (it writes to localStorage).

**For production:** Remove the hardcoded password entirely and implement real auth.

## Brand Assets Quick Reference

- **Name:** ThankQTattoo / Thank Q Tattoos
- **Handle:** @thankqtattoos (Instagram primary)
- **Tagline options:**
  - "Channeling Magic Through Ink"
  - "I Love Tattooing in all styles and forms"
  - "Channeling Magic @ bangarang.tattooing.company"
- **Phone (consultations):** 240-330-9873 (text)
- **Shop:** Bangarang Tattooing Company, 2212 Sunny Lane, Killeen, TX 76541
- **Shop phone:** (254) 213-9896

## File Overview

```
thankqtattoo/
├── index.html          # Primary landing + all sections
├── portfolio.html      # Full gallery experience
├── about.html
├── services.html
├── contact.html
├── admin.html
├── README.md
├── img/                # Your existing screenshots (use or replace)
│   └── *.png
└── (optional later)
    ├── css/
    └── js/
```

## Support & Customization

The entire site is intentionally written in clean, heavily-commented vanilla HTML/CSS/JS so you (or any developer) can easily extend it.

Want to add:
- Booking calendar (Cal.com embed)
- Full e-commerce flash prints
- Blog / news
- Guest artist pages

All easy additions.

---

**Built for Qwami Tucker / ThankQTattoo.**  
Channeling magic through ink. 🔥

If you need help with Supabase integration, custom domain setup, or a second round of design polish, provide the details and we can iterate.