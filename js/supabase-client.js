/**
 * ThankQTattoo — Supabase Client Helper (Production Ready)
 * 
 * Centralized, clean interface for all Supabase operations.
 * 
 * CONFIG (provided by user):
 *   - Project URL and Anon Key are set below.
 *   - Storage bucket: tattoo-images (must be PUBLIC)
 * 
 * TABLES USED:
 *   - portfolio (id uuid, url, caption, style, date, created_at, sort_order)
 *   - portfolio_tags (id uuid, name, created_at)
 *   - site_settings (id=1, tagline, bio, phone, shop_phone, shop_name, address, availability, updated_at)  [create if missing]
 * 
 * USAGE:
 *   Include AFTER the Supabase CDN:
 *     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *     <script src="js/supabase-client.js"></script>
 * 
 *   Then use: await ThankQSupabase.getPortfolio(), etc.
 */

(function () {
  // ============================================================
  // SUPABASE CONFIG
  // ============================================================
  const SUPABASE_URL = 'https://uchvakiaanuxhcapvvhd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaHZha2lhYW51eGhjYXB2dmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjM2NjIsImV4cCI6MjA5NjkzOTY2Mn0.emjBX4j3JRSaXx5ssUSAkB4QdfzmfyhuH57v_tLguTI';
  const STORAGE_BUCKET = 'tattoo-images';

  // Default styles if tags table is empty or unavailable
  const DEFAULT_TAGS = [
    'American Traditional',
    'Small Pieces',
    'Custom',
    'Coverups',
    'Studio',
    'Flash',
    'Other'
  ];

  // Default site content
  const DEFAULT_SITE_CONTENT = {
    tagline: "Channeling Magic Through Ink | American Traditional & More",
    bio: "Qwami Tucker is a passionate tattoo artist and owner of Thank Q Tattoos, proudly resident at Bangarang Tattooing Company in Killeen, Texas. Originally from San Diego, he brings a fresh perspective and relentless dedication to the craft.\n\nHe specializes in bold American Traditional work while remaining equally comfortable with small precision pieces, custom illustrative designs, cover-ups, and any style the client dreams up. \"I love tattooing in all styles and forms,\" Qwami says. Every session is an opportunity to channel something meaningful — for both artist and collector.\n\nWhether this is your first tattoo or the next chapter in a full collection, you can expect professionalism, honest communication, and ink that will stand the test of time.",
    phone: "240-330-9873",
    shopPhone: "254-213-9896",
    shopName: "Bangarang Tattooing Company",
    address: "2212 Sunny Lane, Killeen, TX 76541",
    availability: "Qwami books several weeks out. Best to attend the shop’s monthly Consultation Day (1st Wednesday) or text 240-330-9873 directly."
  };

  let supabaseClient = null;

  function getSupabase() {
    if (supabaseClient) return supabaseClient;

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('[Supabase] @supabase/supabase-js CDN not found. Make sure the script tag is included before supabase-client.js');
      return null;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
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
      console.warn('[Supabase] Client not available — returning empty portfolio');
      return [];
    }

    try {
      const { data, error } = await client
        .from('portfolio')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        url: row.url,
        caption: row.caption || '',
        style: row.style || 'Custom',
        date: row.date || '',
        created_at: row.created_at,
        sort_order: row.sort_order || 0
      }));
    } catch (err) {
      console.error('[Supabase] getPortfolio error:', err);
      return [];
    }
  }

  async function uploadImageToStorage(file, onProgress) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `portfolio/${timestamp}-${safeName}`;

    let progress = 8;
    if (onProgress) onProgress(progress);

    // Smooth simulated progress while upload runs (Supabase SDK doesn't expose byte-level progress easily)
    const progressInterval = setInterval(() => {
      if (progress < 68) {
        progress = Math.min(68, progress + (Math.random() * 7 + 3));
        if (onProgress) onProgress(Math.floor(progress));
      }
    }, 180);

    try {
      const { data, error } = await client
        .storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (error) {
        if (error.message && error.message.includes('Bucket not found')) {
          throw new Error(`Storage bucket "${STORAGE_BUCKET}" does not exist or is not public.`);
        }
        throw error;
      }

      if (onProgress) onProgress(78);

      const { data: publicData } = client
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      if (onProgress) onProgress(100);

      return publicData.publicUrl;
    } catch (err) {
      clearInterval(progressInterval);
      throw err;
    }
  }

  async function uploadPortfolioImage(file, metadata = {}, onProgress) {
    const publicUrl = await uploadImageToStorage(file, onProgress);

    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const payload = {
      url: publicUrl,
      caption: metadata.caption || '',
      style: metadata.style || 'Custom',
      date: metadata.date || new Date().toISOString().slice(0, 7),
      sort_order: metadata.sort_order || 0
    };

    const { data, error } = await client
      .from('portfolio')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function updatePortfolioItem(id, updates) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const { data, error } = await client
      .from('portfolio')
      .update({
        caption: updates.caption,
        style: updates.style,
        date: updates.date,
        sort_order: updates.sort_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function deletePortfolioItem(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const { error } = await client
      .from('portfolio')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // ============================================================
  // TAGS (Filter Tags)
  // ============================================================

  async function getTags() {
    const client = getSupabase();
    if (!client) return DEFAULT_TAGS.map((name, i) => ({ id: 'local-' + i, name }));

    try {
      const { data, error } = await client
        .from('portfolio_tags')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return DEFAULT_TAGS.map((name, i) => ({ id: 'seed-' + i, name }));
      }

      return data.map(row => ({ id: row.id, name: row.name }));
    } catch (err) {
      console.error('[Supabase] getTags error:', err);
      return DEFAULT_TAGS.map((name, i) => ({ id: 'err-' + i, name }));
    }
  }

  async function getAvailableStyles() {
    const tags = await getTags();
    const names = tags.map(t => t.name);
    // "All" is a UI-only filter
    return ['All', ...names];
  }

  async function addTag(name) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Tag name cannot be empty');

    // Client-side duplicate check
    const existing = await getTags();
    if (existing.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('A tag with that name already exists');
    }

    const { data, error } = await client
      .from('portfolio_tags')
      .insert({ name: trimmed })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        throw new Error('A tag with that name already exists');
      }
      throw error;
    }
    return data;
  }

  async function deleteTag(id) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const { error } = await client
      .from('portfolio_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async function updateTag(id, newName) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    const trimmed = (newName || '').trim();
    if (!trimmed) throw new Error('Tag name cannot be empty');

    const { data, error } = await client
      .from('portfolio_tags')
      .update({ name: trimmed })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================
  // SITE CONTENT / SETTINGS
  // ============================================================

  async function getSiteSettings() {
    const client = getSupabase();
    if (!client) return { ...DEFAULT_SITE_CONTENT };

    try {
      const { data, error } = await client
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error || !data) {
        return { ...DEFAULT_SITE_CONTENT };
      }

      return {
        tagline: data.tagline || DEFAULT_SITE_CONTENT.tagline,
        bio: data.bio || DEFAULT_SITE_CONTENT.bio,
        phone: data.phone || DEFAULT_SITE_CONTENT.phone,
        shopPhone: data.shop_phone || DEFAULT_SITE_CONTENT.shopPhone,
        shopName: data.shop_name || DEFAULT_SITE_CONTENT.shopName,
        address: data.address || DEFAULT_SITE_CONTENT.address,
        availability: data.availability || DEFAULT_SITE_CONTENT.availability
      };
    } catch (err) {
      console.warn('[Supabase] getSiteSettings fallback used:', err);
      return { ...DEFAULT_SITE_CONTENT };
    }
  }

  async function saveSiteSettings(settings) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase client not available');

    // We build the payload with all possible fields.
    // If your site_settings table is missing columns (common when it was
    // created from an old version of the setup SQL), we gracefully drop
    // the offending keys and retry once. This avoids the "column not found
    // in the schema cache" error you just saw.
    let payload = {
      id: 1,
      tagline: settings.tagline,
      bio: settings.bio,
      phone: settings.phone,
      shop_phone: settings.shopPhone,
      shop_name: settings.shopName,
      address: settings.address,
      availability: settings.availability,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(payload).forEach(k => {
      if (payload[k] === undefined) delete payload[k];
    });

    let { data, error } = await client
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    // If we got a "column not found in schema cache" error, remove the
    // bad column(s) from the payload and try one more time.
    if (error && error.message && error.message.includes('schema cache')) {
      const colMatch = error.message.match(/'([^']+)' column/);
      if (colMatch && colMatch[1]) {
        const badCol = colMatch[1];
        console.warn(`[Supabase] site_settings is missing column "${badCol}". Retrying without it...`);
        delete payload[badCol];

        const retry = await client
          .from('site_settings')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        data = retry.data;
        error = retry.error;
      }
    }

    if (error) throw error;
    return data;
  }

  // ============================================================
  // AUTH (for admin)
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

  function onAuthChange(callback) {
    const client = getSupabase();
    if (client) {
      return client.auth.onAuthStateChange(callback);
    }
    return null;
  }

  function isSupabaseReady() {
    return !!getSupabase();
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  window.ThankQSupabase = {
    // Config
    SUPABASE_URL,
    STORAGE_BUCKET,
    DEFAULT_TAGS,
    DEFAULT_SITE_CONTENT,

    // Core
    getSupabase,

    // Portfolio
    getPortfolio,
    uploadImageToStorage,
    uploadPortfolioImage,
    updatePortfolioItem,
    deletePortfolioItem,

    // Tags / Filters
    getTags,
    getAvailableStyles,
    addTag,
    deleteTag,
    updateTag,

    // Site Content
    getSiteSettings,
    saveSiteSettings,

    // Auth
    signInAdmin,
    signUpAdmin,
    signOutAdmin,
    getCurrentUser,
    onAuthChange,

    // Utils
    isSupabaseReady
  };

  // Also expose a small ThankQ namespace for legacy/common.js compatibility
  window.ThankQ = window.ThankQ || {};
  window.ThankQ.AVAILABLE_STYLES = DEFAULT_TAGS; // legacy fallback
})();