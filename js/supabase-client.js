/**
 * ThankQTattoo — Supabase Client & Data Layer
 * 
 * This centralizes all Supabase interaction for the portfolio gallery and admin.
 * 
 * CONFIG:
 *   - SUPABASE_URL and SUPABASE_ANON_KEY are your project's public values.
 *   - Storage bucket MUST be set to PUBLIC for image URLs to work without auth.
 * 
 * TABLES REQUIRED (run the SQL from SETUP.md or README):
 *   - portfolio (id, url, caption, style, date, created_at, sort_order)
 *   - site_settings (id=1, tagline, bio, phone, shop_phone, address, shop_name, availability, updated_at)
 * 
 * USAGE:
 *   Include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   then <script src="js/supabase-client.js"></script>
 * 
 *   Then: await ThankQSupabase.getPortfolio()
 *         await ThankQSupabase.uploadPortfolioImage(file, metadata)
 */

(function () {
  // ============================================================
  // SUPABASE CONFIG — DO NOT COMMIT SERVICE ROLE KEY
  // ============================================================
  const SUPABASE_URL = 'https://uchvakiaanuxhcapvvhd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHZha2lhYW51eGhjYXB2dmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjM2NjIsImV4cCI6MjA5NjkzOTY2Mn0.emjBX4j3JRSaXx5ssUSAkB4QdfzmfyhuH57v_tLguTI';

  const STORAGE_BUCKET = 'tattoo-images';

  // Styles used across the site for filters + upload form.
  // Feel free to add/remove here; admin UI uses this list too.
  const AVAILABLE_STYLES = [
    'All',
    'American Traditional',
    'Small Pieces',
    'Custom',
    'Coverups',
    'Studio',
    'Flash',
    'Other'
  ];

  // Fallback / seed content when Supabase is unreachable or empty.
  // Admin edits in Supabase will override this for visitors.
  const FALLBACK_CONTENT = {
    tagline: "Channeling Magic Through Ink | American Traditional & More",
    bio: "Qwami Tucker is a passionate tattoo artist and owner of Thank Q Tattoos, proudly resident at Bangarang Tattooing Company in Killeen, Texas. Originally from San Diego, he brings a fresh perspective and relentless dedication to the craft.\n\nHe specializes in bold American Traditional work while remaining equally comfortable with small precision pieces, custom illustrative designs, cover-ups, and any style the client dreams up. \"I love tattooing in all styles and forms,\" Qwami says. Every session is an opportunity to channel something meaningful — for both artist and collector.\n\nWhether this is your first tattoo or the next chapter in a full collection, you can expect professionalism, honest communication, and ink that will stand the test of time.",
    phone: "240-330-9873",
    shopPhone: "254-213-9896",
    address: "2212 Sunny Lane, Killeen, TX 76541",
    shopName: "Bangarang Tattooing Company",
    availability: "Qwami books several weeks out. Best to attend the shop’s monthly Consultation Day (1st Wednesday) or text 240-330-9873 directly."
  };

  // Default local images (used only if Supabase portfolio returns zero rows)
  const FALLBACK_PORTFOLIO = [
    { id: 1, url: "img/Screenshot 2026-06-12 193538_edited.png", caption: "Artist at work — flash studies & custom prep", style: "Studio", date: "2025-05" },
    { id: 2, url: "img/Screenshot 2026-06-12 194358_edited.png", caption: "Bold traditional wolf head", style: "American Traditional", date: "2025-06" },
    { id: 3, url: "img/AdobeExpressPhotos_d667f19b15d94b2f9431405b23e604ec_CopyEdited.png", caption: "Red geometric cross design", style: "Custom", date: "2025-06" },
    { id: 4, url: "img/Screenshot 2026-06-12 201403_edited.png", caption: "Screaming gorilla with crown of thorns", style: "Custom", date: "2025-06" },
    { id: 5, url: "img/Screenshot 2026-06-12 201339_edited.png", caption: "Peony and monarch butterfly composition", style: "American Traditional", date: "2025-06" },
    { id: 6, url: "img/Screenshot 2026-06-12 201626_edited.png", caption: "Centipede with spider lilies", style: "Custom", date: "2025-06" },
    { id: 7, url: "img/Screenshot 2026-06-12 201642_edited.png", caption: "Veni Vidi Vici Roman helmet", style: "Custom", date: "2025-06" },
    { id: 8, url: "img/Screenshot 2026-06-12 201715_edited.png", caption: "American Traditional lady head with rose", style: "American Traditional", date: "2025-06" },
    { id: 9, url: "img/Screenshot 2026-06-12 201741_edited.png", caption: "Skull and arrow with flowers", style: "American Traditional", date: "2025-06" },
    { id: 10, url: "img/Screenshot 2026-06-12 194110_edited.png", caption: "Tattooing in progress at the station", style: "Studio", date: "2025-06" }
  ];

  // Initialize Supabase client (uses global from CDN)
  let supabaseClient = null;

  function getSupabase() {
    if (supabaseClient) return supabaseClient;

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Supabase] CDN client not found. Make sure you included the @supabase/supabase-js script tag.');
      return null;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });

    return supabaseClient;
  }

  // ============================================================
  // PORTFOLIO
  // ============================================================

  async function getPortfolio() {
    const client = getSupabase();

    if (!client) {
      console.info('[Supabase] No client — using local fallback portfolio (demo/offline mode).');
      return FALLBACK_PORTFOLIO;
    }

    try {
      const { data, error } = await client
        .from('portfolio')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // IMPORTANT: When Supabase is connected, NEVER return the numeric fallback items.
      // Returning them causes "invalid uuid" errors on delete/edit because fallbacks use id: 1,2,3...
      if (!data || data.length === 0) {
        console.info('[Supabase] Portfolio table is empty.');
        return [];   // Return real empty array so admin shows clean "upload first" state
      }

      // Normalize — real rows from DB will have proper id (uuid or bigint depending on your table)
      return data.map(row => ({
        id: row.id,
        url: row.url,
        caption: row.caption || '',
        style: row.style || 'Custom',
        date: row.date || '',
        created_at: row.created_at
      }));
    } catch (err) {
      console.error('[Supabase] Failed to fetch portfolio:', err);
      // On error with a live client, still return empty rather than numeric fallbacks
      // (prevents the exact "invalid input syntax for type uuid: "1"" bug)
      return [];
    }
  }

  /**
   * Upload image file to Supabase Storage (tattoo-images bucket)
   * Returns the public URL on success.
   */
  async function uploadImageToStorage(file, onProgress) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    // Make a safe filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `portfolio/${timestamp}-${safeName}`;

    // Supabase JS v2 upload with progress is a bit limited in browser without XHR.
    // We do a simple upload and fake some progress for UX.
    if (onProgress) onProgress(10);

    const { data, error } = await client
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (onProgress) onProgress(70);

    if (error) {
      // Common helpful messages
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${STORAGE_BUCKET}" does not exist. Create it in Supabase Dashboard and make it PUBLIC.`);
      }
      throw error;
    }

    if (onProgress) onProgress(90);

    // Get public URL (bucket must be public)
    const { data: publicData } = client
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    if (onProgress) onProgress(100);

    return publicData.publicUrl;
  }

  /**
   * Create new portfolio entry (after successful storage upload).
   * metadata: { caption, style, date }
   */
  async function addPortfolioItem(publicUrl, metadata = {}) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available. Login required for writes.');

    const payload = {
      url: publicUrl,
      caption: metadata.caption || '',
      style: metadata.style || 'Custom',
      date: metadata.date || new Date().toISOString().slice(0, 7),
      sort_order: 0
    };

    const { data, error } = await client
      .from('portfolio')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Full helper used by admin: upload file + create DB row.
   * Returns the created portfolio row.
   */
  async function uploadPortfolioImage(file, metadata = {}, onProgress) {
    const publicUrl = await uploadImageToStorage(file, onProgress);
    const row = await addPortfolioItem(publicUrl, metadata);
    return row;
  }

  async function updatePortfolioItem(id, updates) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    // Support both uuid strings and numeric ids (whatever your table uses)
    const safeId = id;

    const { data, error } = await client
      .from('portfolio')
      .update({
        caption: updates.caption,
        style: updates.style,
        date: updates.date
      })
      .eq('id', safeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function deletePortfolioItem(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const safeId = id;

    // Optional: we could also delete the file from storage, but it's usually fine to keep.
    const { error } = await client
      .from('portfolio')
      .delete()
      .eq('id', safeId);

    if (error) throw error;
    return true;
  }

  // ============================================================
  // SITE CONTENT / SETTINGS (editable tagline, bio, contact info)
  // ============================================================

  async function getSiteSettings() {
    const client = getSupabase();
    if (!client) return FALLBACK_CONTENT;

    try {
      const { data, error } = await client
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error || !data) {
        return FALLBACK_CONTENT;
      }

      return {
        tagline: data.tagline || FALLBACK_CONTENT.tagline,
        bio: data.bio || FALLBACK_CONTENT.bio,
        phone: data.phone || FALLBACK_CONTENT.phone,
        shopPhone: data.shop_phone || FALLBACK_CONTENT.shopPhone,
        address: data.address || FALLBACK_CONTENT.address,
        shopName: data.shop_name || FALLBACK_CONTENT.shopName,
        availability: data.availability || FALLBACK_CONTENT.availability
      };
    } catch (err) {
      console.warn('[Supabase] site_settings fetch failed, using fallback.', err);
      return FALLBACK_CONTENT;
    }
  }

  async function saveSiteSettings(settings) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available — cannot save site content remotely.');

    const payload = {
      id: 1,
      tagline: settings.tagline,
      bio: settings.bio,
      phone: settings.phone,
      shop_phone: settings.shopPhone,
      address: settings.address,
      shop_name: settings.shopName,
      availability: settings.availability,
      updated_at: new Date().toISOString()
    };

    // upsert on primary key
    const { data, error } = await client
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================
  // AUTH (for admin.html)
  // ============================================================

  async function signInAdmin(email, password) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not loaded');

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUpAdmin(email, password) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not loaded');

    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOutAdmin() {
    const client = getSupabase();
    if (client) await client.auth.signOut();
  }

  async function getCurrentUser() {
    const client = getSupabase();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
  }

  // Simple helper used by admin UI to know if we can perform writes
  function isSupabaseReady() {
    return !!getSupabase();
  }

  // Expose clean public API
  window.ThankQSupabase = {
    // Config / constants
    SUPABASE_URL,
    STORAGE_BUCKET,
    AVAILABLE_STYLES,
    FALLBACK_CONTENT,
    FALLBACK_PORTFOLIO,

    // Core client
    getSupabase,

    // Portfolio
    getPortfolio,
    uploadImageToStorage,
    addPortfolioItem,
    uploadPortfolioImage,
    updatePortfolioItem,
    deletePortfolioItem,

    // Site-wide editable content
    getSiteSettings,
    saveSiteSettings,

    // Auth
    signInAdmin,
    signUpAdmin,
    signOutAdmin,
    getCurrentUser,

    // Utils
    isSupabaseReady
  };

  // Also attach the styles list for convenience on other scripts
  window.ThankQ = window.ThankQ || {};
  window.ThankQ.AVAILABLE_STYLES = AVAILABLE_STYLES;
  window.ThankQ.FALLBACK_CONTENT = FALLBACK_CONTENT;
})();