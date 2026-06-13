/**
 * ThankQTattoo — Shared JS (vanilla)
 * Dynamic content from Supabase, particles, gallery, filters, forms, nav.
 *
 * DEPENDENCIES (include in page <head> or before this file):
 *   1. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   2. <script src="js/supabase-client.js"></script>
 *   3. This file (js/common.js)
 *
 * The site gracefully falls back to local images + defaults when Supabase is unreachable.
 */

(function () {
  // ============== UTILITIES ==============
  function showToast(message, ms = 2800) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), ms);
  }

  // Legacy localStorage helpers kept for form submissions + offline resilience
  function saveToStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  // ============== SUPABASE POWERED DATA ==============
  let cachedPortfolio = null;
  let cachedSettings = null;

  async function getLivePortfolio() {
    if (cachedPortfolio) return cachedPortfolio;
    if (window.ThankQSupabase && typeof window.ThankQSupabase.getPortfolio === 'function') {
      cachedPortfolio = await window.ThankQSupabase.getPortfolio();
    } else {
      // Supabase client script not loaded — use fallback
      cachedPortfolio = (window.ThankQSupabase && window.ThankQSupabase.FALLBACK_PORTFOLIO) || [];
    }
    return cachedPortfolio;
  }

  async function getLiveSettings() {
    if (cachedSettings) return cachedSettings;
    if (window.ThankQSupabase && typeof window.ThankQSupabase.getSiteSettings === 'function') {
      cachedSettings = await window.ThankQSupabase.getSiteSettings();
    } else {
      cachedSettings = (window.ThankQSupabase && window.ThankQSupabase.FALLBACK_CONTENT) || {};
    }
    return cachedSettings;
  }

  // ============== DYNAMIC CONTENT RENDERING ==============
  async function loadDynamicContent() {
    const [settings, portfolio] = await Promise.all([
      getLiveSettings(),
      getLivePortfolio()
    ]);

    const content = settings || {};

    // Tagline
    document.querySelectorAll('[data-content="tagline"]').forEach(el => {
      el.textContent = content.tagline || 'Channeling Magic Through Ink';
    });

    // Bio (supports newlines)
    document.querySelectorAll('[data-content="bio"]').forEach(el => {
      const bio = content.bio || '';
      el.innerHTML = bio.replace(/\n/g, '<br><br>');
    });

    // Contact numbers
    document.querySelectorAll('[data-content="phone"]').forEach(el => {
      const phone = content.phone || '240-330-9873';
      el.textContent = phone;
      if (el.tagName === 'A') {
        el.href = `tel:${phone.replace(/\D/g, '')}`;
      }
    });

    document.querySelectorAll('[data-content="shopPhone"]').forEach(el => {
      el.textContent = content.shopPhone || '254-213-9896';
    });

    document.querySelectorAll('[data-content="address"]').forEach(el => {
      el.textContent = content.address || 'Killeen, TX';
    });

    document.querySelectorAll('[data-content="shopName"]').forEach(el => {
      el.textContent = content.shopName || 'Bangarang Tattooing Company';
    });

    document.querySelectorAll('[data-content="availability"]').forEach(el => {
      el.textContent = content.availability || 'Booking several weeks out. Text for details.';
    });

    // Portfolio grids (masonry full pages)
    const grids = document.querySelectorAll('.portfolio-grid');
    for (const grid of grids) {
      await renderPortfolioGrid(grid, portfolio);
    }

    // Teaser grids (home page recent work)
    const teasers = document.querySelectorAll('.portfolio-teaser');
    for (const teaser of teasers) {
      await renderPortfolioTeaser(teaser, portfolio.slice(0, 8));
    }

    // Re-init filters after new DOM (portfolio page) - fire and forget is fine here
    try { initFilters(); } catch (e) {}

    return { content, portfolio };
  }

  // Masonry grid renderer (used on portfolio.html + anywhere with .portfolio-grid)
  async function renderPortfolioGrid(container, items) {
    container.innerHTML = '';
    container.classList.add('portfolio-masonry', 'masonry-grid');

    if (!items || !items.length) {
      container.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-500">No portfolio pieces yet. Upload in the admin dashboard.</div>`;
      return;
    }

    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = `gallery-item ink-border`;
      el.dataset.id = item.id;
      el.dataset.style = item.style || 'Custom';

      el.innerHTML = `
        <img src="${item.url}" alt="${item.caption || 'Tattoo by Qwami Tucker'}" loading="lazy">
        <div class="overlay">
          <div>
            <span class="style-badge">${item.style || 'Custom'}</span>
            <div class="caption mt-1.5 font-medium">${item.caption || ''}</div>
          </div>
        </div>
      `;

      el.addEventListener('click', () => openLightbox(items, index));
      container.appendChild(el);
    });
  }

  // Compact teaser grid (home + other pages)
  async function renderPortfolioTeaser(container, items) {
    container.innerHTML = '';
    container.classList.add('grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6', 'gap-3');

    if (!items || !items.length) {
      container.innerHTML = `<div class="col-span-full text-center py-8 text-sm text-zinc-500">Check back soon for fresh ink.</div>`;
      return;
    }

    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = `relative rounded-xl overflow-hidden aspect-[4/3.2] border border-zinc-800 group cursor-pointer`;
      el.innerHTML = `
        <img src="${item.url}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${item.caption || ''}" loading="lazy">
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
          <span class="text-[10px] px-1.5 py-px bg-black/60 rounded text-white/90">${item.style || 'Custom'}</span>
        </div>
      `;
      el.addEventListener('click', async () => {
        const full = await getLivePortfolio();
        const realIndex = full.findIndex(i => String(i.id) === String(item.id));
        if (window.location.pathname.includes('portfolio')) {
          openLightbox(full, Math.max(0, realIndex));
        } else {
          window.location.href = 'portfolio.html';
        }
      });
      container.appendChild(el);
    });
  }

  // ============== FILTERS (portfolio page) ==============
  async function initFilters() {
    const filterContainer = document.getElementById('style-filters');
    const grid = document.querySelector('.portfolio-grid') || document.querySelector('.portfolio-masonry');
    if (!filterContainer || !grid) return;

    let styles;
    try {
      styles = (window.ThankQSupabase && await window.ThankQSupabase.getAvailableStyles())
               || ['All', 'American Traditional', 'Small Pieces', 'Custom', 'Coverups', 'Studio', 'Other'];
    } catch (e) {
      styles = ['All', 'American Traditional', 'Small Pieces', 'Custom', 'Coverups', 'Studio', 'Other'];
    }

    // Only build once
    if (filterContainer.children.length === 0) {
      styles.forEach(style => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${style === 'All' ? 'active' : ''}`;
        btn.textContent = style;
        btn.dataset.style = style;
        filterContainer.appendChild(btn);
      });
    }

    // Remove previous listeners safely by cloning
    const newFilterBar = filterContainer.cloneNode(true);
    filterContainer.parentNode.replaceChild(newFilterBar, filterContainer);

    newFilterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      newFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selected = btn.dataset.style;
      const items = grid.querySelectorAll('.gallery-item');

      items.forEach(item => {
        const itemStyle = item.dataset.style;
        if (selected === 'All' || itemStyle === selected) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // ============== ENHANCED LIGHTBOX WITH ZOOM ==============
  let currentLightboxItems = [];
  let currentLightboxIndex = 0;
  let currentZoom = 1;

  function openLightbox(items, startIndex) {
    currentLightboxItems = items;
    currentLightboxIndex = startIndex;
    currentZoom = 1;

    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = createLightboxDOM();
      document.body.appendChild(lb);
    }

    lb.classList.add('open');
    updateLightboxImage();
    document.addEventListener('keydown', lightboxKeyboardHandler, { once: true });
  }

  function createLightboxDOM() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <div class="lightbox-content relative">
        <button class="lightbox-close" aria-label="Close">×</button>
        <button class="lightbox-nav prev" aria-label="Previous">‹</button>
        <button class="lightbox-nav next" aria-label="Next">›</button>

        <div class="relative flex items-center justify-center" style="min-height: 60vh;">
          <img id="lightbox-image" alt="">
        </div>

        <div id="lightbox-caption" class="mt-4 text-center text-zinc-300 text-sm max-w-3xl mx-auto"></div>

        <div class="lightbox-zoom-controls">
          <button id="zoom-out" title="Zoom out">−</button>
          <button id="zoom-reset" title="Reset zoom">100%</button>
          <button id="zoom-in" title="Zoom in">+</button>
        </div>

        <div class="flex justify-center gap-3 mt-6">
          <a id="lightbox-ig" href="https://instagram.com/thankqtattoos" target="_blank"
             class="btn btn-secondary btn-sm text-xs">VIEW ON INSTAGRAM</a>
          <button id="lightbox-close-bottom" class="btn btn-ghost btn-sm text-xs">CLOSE</button>
        </div>
      </div>
    `;

    // Close + nav
    lb.querySelector('.lightbox-close').onclick = closeLightbox;
    lb.querySelector('#lightbox-close-bottom').onclick = closeLightbox;
    lb.querySelector('.prev').onclick = () => navigateLightbox(-1);
    lb.querySelector('.next').onclick = () => navigateLightbox(1);

    // Zoom buttons
    lb.querySelector('#zoom-in').onclick = () => changeZoom(0.2);
    lb.querySelector('#zoom-out').onclick = () => changeZoom(-0.2);
    lb.querySelector('#zoom-reset').onclick = () => resetZoom();

    // Click outside
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    // Basic drag-to-pan when zoomed (simple implementation)
    setupLightboxDrag(lb);

    return lb;
  }

  function setupLightboxDrag(lb) {
    const img = lb.querySelector('#lightbox-image');
    if (!img) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let translateX = 0, translateY = 0;

    function updateTransform() {
      img.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
    }

    img.addEventListener('mousedown', (e) => {
      if (currentZoom <= 1) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      img.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (img) img.style.cursor = currentZoom > 1 ? 'grab' : 'grab';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || currentZoom <= 1) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    });

    // Touch support (basic)
    img.addEventListener('touchstart', (e) => {
      if (currentZoom <= 1 || e.touches.length !== 1) return;
      isDragging = true;
      startX = e.touches[0].clientX - translateX;
      startY = e.touches[0].clientY - translateY;
    }, { passive: true });

    img.addEventListener('touchend', () => { isDragging = false; });

    img.addEventListener('touchmove', (e) => {
      if (!isDragging || currentZoom <= 1 || e.touches.length !== 1) return;
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      updateTransform();
    }, { passive: true });

    // Reset position when zoom changes
    const originalUpdate = updateLightboxImage;
    // We'll call resetTranslate inside changeZoom + updateLightboxImage
    window.__lightboxResetPan = () => { translateX = 0; translateY = 0; };
  }

  function changeZoom(delta) {
    const lb = document.getElementById('lightbox');
    const img = lb && lb.querySelector('#lightbox-image');
    if (!img) return;

    currentZoom = Math.max(0.6, Math.min(4.5, currentZoom + delta));
    img.style.transform = `scale(${currentZoom})`;
    if (currentZoom > 1) img.classList.add('zoomed');
    else img.classList.remove('zoomed');

    if (window.__lightboxResetPan && currentZoom === 1) window.__lightboxResetPan();
  }

  function resetZoom() {
    const lb = document.getElementById('lightbox');
    const img = lb && lb.querySelector('#lightbox-image');
    if (!img) return;
    currentZoom = 1;
    img.style.transform = 'scale(1)';
    img.classList.remove('zoomed');
    if (window.__lightboxResetPan) window.__lightboxResetPan();
  }

  function updateLightboxImage() {
    const lb = document.getElementById('lightbox');
    if (!lb || !currentLightboxItems.length) return;

    const item = currentLightboxItems[currentLightboxIndex];
    const img = lb.querySelector('#lightbox-image');
    const cap = lb.querySelector('#lightbox-caption');
    const igLink = lb.querySelector('#lightbox-ig');

    // Reset zoom + pan every image change
    currentZoom = 1;
    img.style.transform = 'scale(1)';
    img.classList.remove('zoomed');
    if (window.__lightboxResetPan) window.__lightboxResetPan();

    img.src = item.url;
    img.alt = item.caption || 'Tattoo work by Qwami Tucker';
    cap.innerHTML = `<span class="style-badge mr-2">${item.style || ''}</span> ${item.caption || ''}`;
    igLink.href = 'https://instagram.com/thankqtattoos';
  }

  function navigateLightbox(dir) {
    currentLightboxIndex = (currentLightboxIndex + dir + currentLightboxItems.length) % currentLightboxItems.length;
    updateLightboxImage();
    resetZoom();
  }

  function lightboxKeyboardHandler(e) {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateLightbox(1);
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key.toLowerCase() === '+' || e.key === '=') { e.preventDefault(); changeZoom(0.25); }
    if (e.key === '-') { e.preventDefault(); changeZoom(-0.25); }
    if (e.key.toLowerCase() === '0') { e.preventDefault(); resetZoom(); }
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('open');
    // Reset zoom state
    currentZoom = 1;
  }

  // ============== INK PARTICLES (hero) — kept exactly as before, performant ==============
  function initInkParticles(canvasId = 'ink-canvas') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let w = 0, h = 0;

    function resize() {
      const parent = canvas.parentElement;
      w = canvas.width = parent.offsetWidth;
      h = canvas.height = parent.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function spawn(count = 28) {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.75 + h * 0.1,
          vx: (Math.random() - 0.5) * 0.45,
          vy: Math.random() * 0.55 + 0.15,
          r: Math.random() * 2.6 + 0.7,
          alpha: Math.random() * 0.55 + 0.25,
          color: Math.random() > 0.7 ? '#9f1f24' : '#111'
        });
      }
    }

    function update() {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.985;
        p.alpha *= 0.992;
        p.vx += (Math.random() - 0.5) * 0.03;

        if (p.alpha < 0.03 || p.y > h + 40 || p.x < -30 || p.x > w + 30) {
          p.x = Math.random() * w;
          p.y = Math.random() * (h * 0.45);
          p.vy = Math.random() * 0.6 + 0.22;
          p.alpha = Math.random() * 0.5 + 0.28;
          p.vx = (Math.random() - 0.5) * 0.42;
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.color === '#9f1f24') {
          ctx.globalAlpha = p.alpha * 0.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    let raf;
    function loop() {
      update();
      draw();
      raf = requestAnimationFrame(loop);
    }

    spawn();
    loop();

    const hero = canvas.closest('.hero') || canvas.parentElement;
    if (hero) {
      hero.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        for (let i = 0; i < 11; i++) {
          particles.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            vx: (Math.random() - 0.5) * 2.6,
            vy: Math.random() * -1.6 - 0.6,
            r: Math.random() * 2.1 + 0.9,
            alpha: 0.75,
            color: Math.random() > 0.6 ? '#9f1f24' : '#222'
          });
        }
      }, { passive: true });
    }

    return () => cancelAnimationFrame(raf);
  }

  // ============== FORMS (still store locally + show nice toast) ==============
  function initForms() {
    document.querySelectorAll('.thankq-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        data.ts = new Date().toISOString();
        data.id = 'sub_' + Date.now();

        // Persist submissions locally (easy export from admin)
        const subs = loadFromStorage('thankq_submissions', []);
        subs.unshift(data);
        saveToStorage('thankq_submissions', subs.slice(0, 120));

        const btn = form.querySelector('button[type="submit"]');
        const orig = btn ? btn.textContent : '';
        if (btn) btn.textContent = 'SENT — THANK YOU';

        showToast('Thank you — your request has been received. Qwami will text you shortly.');

        form.reset();

        setTimeout(() => {
          if (btn) btn.textContent = orig || 'SUBMIT';
        }, 1400);
      });
    });
  }

  // ============== NAV ==============
  function initNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
      lastY = y;
    }, { passive: true });

    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
      });
    }

    document.querySelectorAll('#mobile-menu a').forEach(a => {
      a.addEventListener('click', () => {
        if (menu) menu.classList.remove('open');
      });
    });
  }

  function initActiveNav() {
    let current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!current || current === 'index' || current === '') current = 'index.html';

    document.querySelectorAll('.nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      const target = href.split('/').pop().split('#')[0] || 'index.html';
      const isActive = target === current ||
        (current === 'index.html' && (target === '' || target === 'index.html'));
      if (isActive) link.classList.add('active');
      else link.classList.remove('active');
    });
  }

  // ============== BOOT ==============
  async function initCommon() {
    initNav();
    initActiveNav();

    // Load dynamic content from Supabase (or fallback)
    try {
      await loadDynamicContent();
    } catch (e) {
      console.warn('Dynamic content load had an issue (using fallbacks):', e);
    }

    // Ink particles on hero
    const canvas = document.getElementById('ink-canvas');
    if (canvas) initInkParticles('ink-canvas');

    initForms();

    // Filters (now async because it can load live tags)
    try { await initFilters(); } catch (e) { /* non-fatal */ }

    // Year in footers
    document.querySelectorAll('#year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  // Auto start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
  } else {
    initCommon();
  }

  // Public API
  window.ThankQ = window.ThankQ || {};
  window.ThankQ.loadDynamicContent = loadDynamicContent;
  window.ThankQ.showToast = showToast;
  window.ThankQ.getLivePortfolio = getLivePortfolio;
  window.ThankQ.getLiveSettings = getLiveSettings;
  window.ThankQ.loadFromStorage = loadFromStorage;
  window.ThankQ.saveToStorage = saveToStorage;
})();