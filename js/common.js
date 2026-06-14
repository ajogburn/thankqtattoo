/**
 * ThankQTattoo — Shared JS (vanilla)
 * Dynamic content + particles + nav + forms + gallery helpers.
 * Now fully integrated with the new Supabase client.
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

  function saveToStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  // ============== DYNAMIC CONTENT FROM SUPABASE ==============
  async function loadDynamicContent() {
    let content = {};
    let portfolio = [];

    try {
      if (window.ThankQSupabase) {
        content = await window.ThankQSupabase.getSiteSettings();
        portfolio = await window.ThankQSupabase.getPortfolio();
      } else {
        content = (window.ThankQSupabase && window.ThankQSupabase.DEFAULT_SITE_CONTENT) || {};
      }
    } catch (e) {
      console.warn('[Common] Supabase content fetch failed, using defaults', e);
      content = (window.ThankQSupabase && window.ThankQSupabase.DEFAULT_SITE_CONTENT) || {};
    }

    // Update simple text fields
    document.querySelectorAll('[data-content="tagline"]').forEach(el => {
      el.textContent = content.tagline || 'Channeling Magic Through Ink';
    });

    document.querySelectorAll('[data-content="bio"]').forEach(el => {
      const bio = content.bio || '';
      el.innerHTML = bio.replace(/\n/g, '<br><br>');
    });

    document.querySelectorAll('[data-content="phone"]').forEach(el => {
      const phone = content.phone || '240-330-9873';
      el.textContent = phone;
      if (el.tagName === 'A') el.href = `tel:${phone.replace(/\D/g, '')}`;
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

    // Portfolio grids
    const grids = document.querySelectorAll('.portfolio-grid');
    for (const grid of grids) {
      if (grid) {
        await renderPortfolioGrid(grid, portfolio);
      }
    }

    // Teasers
    const teasers = document.querySelectorAll('.portfolio-teaser');
    for (const teaser of teasers) {
      await renderPortfolioTeaser(teaser, portfolio.slice(0, 8));
    }

    return { content, portfolio };
  }

  async function renderPortfolioGrid(container, items) {
    container.innerHTML = '';
    container.classList.add('masonry-grid');

    if (!items || !items.length) {
      container.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-500">No portfolio pieces yet.</div>`;
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
        const full = await (window.ThankQSupabase ? window.ThankQSupabase.getPortfolio() : Promise.resolve([]));
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

  // ============== FILTERS (now async + dynamic) ==============
  async function initFilters() {
    const filterContainer = document.getElementById('style-filters');
    const grid = document.querySelector('.portfolio-grid') || document.querySelector('.portfolio-masonry');
    if (!filterContainer || !grid) return;

    let styles = ['All'];
    try {
      if (window.ThankQSupabase && window.ThankQSupabase.getAvailableStyles) {
        styles = await window.ThankQSupabase.getAvailableStyles();
      }
    } catch (e) {
      styles = ['All', 'American Traditional', 'Small Pieces', 'Custom', 'Coverups', 'Studio', 'Flash', 'Other'];
    }

    if (filterContainer.children.length === 0) {
      styles.forEach(style => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${style === 'All' ? 'active' : ''}`;
        btn.textContent = style;
        btn.dataset.style = style;
        filterContainer.appendChild(btn);
      });
    }

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

  // ============== LIGHTBOX (basic solid version) ==============
  let currentLightboxItems = [];
  let currentLightboxIndex = 0;

  function openLightbox(items, startIndex) {
    currentLightboxItems = items;
    currentLightboxIndex = startIndex;

    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = createLightboxDOM();
      document.body.appendChild(lb);
    }

    lb.style.display = 'flex';
    updateLightboxImage();
  }

  function createLightboxDOM() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.style.background = 'rgba(5,5,7,0.96)';
    lb.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Close">×</button>
        <button class="lightbox-nav prev" aria-label="Previous">‹</button>
        <button class="lightbox-nav next" aria-label="Next">›</button>
        <img id="lightbox-image" alt="" style="max-height:82vh; width:100%; object-fit:contain; border-radius:8px;">
        <div id="lightbox-caption" class="mt-4 text-center text-zinc-300 text-sm max-w-3xl mx-auto"></div>
        <div class="flex justify-center gap-3 mt-4">
          <a id="lightbox-ig" href="https://instagram.com/thankqtattoos" target="_blank" class="btn btn-secondary btn-sm text-xs">VIEW ON INSTAGRAM</a>
          <button id="lightbox-close-bottom" class="btn btn-ghost btn-sm text-xs">CLOSE</button>
        </div>
      </div>
    `;

    lb.querySelector('.lightbox-close').onclick = closeLightbox;
    lb.querySelector('#lightbox-close-bottom').onclick = closeLightbox;
    lb.querySelector('.prev').onclick = () => navigateLightbox(-1);
    lb.querySelector('.next').onclick = () => navigateLightbox(1);

    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });

    return lb;
  }

  function updateLightboxImage() {
    const lb = document.getElementById('lightbox');
    if (!lb || !currentLightboxItems.length) return;

    const item = currentLightboxItems[currentLightboxIndex];
    const img = lb.querySelector('#lightbox-image');
    const cap = lb.querySelector('#lightbox-caption');

    img.src = item.url;
    img.alt = item.caption || 'Tattoo work by Qwami Tucker';
    cap.innerHTML = `<span class="style-badge mr-2">${item.style || ''}</span> ${item.caption || ''}`;
  }

  function navigateLightbox(dir) {
    currentLightboxIndex = (currentLightboxIndex + dir + currentLightboxItems.length) % currentLightboxItems.length;
    updateLightboxImage();
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = 'none';
  }

  // ============== INK PARTICLES ==============
  function initInkParticles(canvasId = 'ink-canvas') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let w = 0, h = 0;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
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

  // ============== NAV ==============
  function initNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }, { passive: true });

    const toggle = document.getElementById('mobile-toggle');
    const menu = document.getElementById('mobile-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
      });
    }
  }

  function initActiveNav() {
    let current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!current || current === 'index' || current === '') current = 'index.html';

    document.querySelectorAll('.nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      const target = href.split('/').pop().split('#')[0] || 'index.html';
      if (target === current || (current === 'index.html' && (target === '' || target === 'index.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ============== BOOT ==============
  async function initCommon() {
    initNav();
    initActiveNav();

    try {
      await loadDynamicContent();
    } catch (e) {
      console.warn('Dynamic content load issue', e);
    }

    const canvas = document.getElementById('ink-canvas');
    if (canvas) initInkParticles('ink-canvas');

    await initFilters();

    document.querySelectorAll('#year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
  } else {
    initCommon();
  }

  // Public API
  window.ThankQ = window.ThankQ || {};
  window.ThankQ.loadDynamicContent = loadDynamicContent;
  window.ThankQ.showToast = showToast;
  window.ThankQ.loadFromStorage = loadFromStorage;
  window.ThankQ.saveToStorage = saveToStorage;
  window.ThankQ.initFilters = initFilters;
})();