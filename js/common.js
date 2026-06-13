/**
 * ThankQTattoo — Shared JS (vanilla)
 * Dynamic content, particles, gallery, forms, admin helpers
 */

// ============== CONFIG & DEFAULT DATA ==============
const DEFAULT_CONTENT = {
  tagline: "Channeling Magic Through Ink | American Traditional & More",
  bio: `Qwami Tucker is a passionate tattoo artist and owner of Thank Q Tattoos, proudly resident at Bangarang Tattooing Company in Killeen, Texas. Originally from San Diego, he brings a fresh perspective and relentless dedication to the craft.\n\nHe specializes in bold American Traditional work while remaining equally comfortable with small precision pieces, custom illustrative designs, cover-ups, and any style the client dreams up. "I love tattooing in all styles and forms," Qwami says. Every session is an opportunity to channel something meaningful — for both artist and collector.\n\nWhether this is your first tattoo or the next chapter in a full collection, you can expect professionalism, honest communication, and ink that will stand the test of time.`,
  phone: "240-330-9873",
  shopPhone: "254-213-9896",
  address: "2212 Sunny Lane, Killeen, TX 76541",
  shopName: "Bangarang Tattooing Company",
  email: "text or DM for fastest response",
  availability: "Currently booking 3–5 weeks out. Text 240-330-9873 to begin a consultation."
};

const DEFAULT_PORTFOLIO = [
  { id: 1, url: "img/Screenshot 2026-06-12 193538_edited.png", caption: "Artist at work — flash studies & custom prep", style: "Studio", date: "2025-05" },
  { id: 2, url: "img/Screenshot 2026-06-12 194358_edited.png", caption: "Bold traditional wolf head", style: "American Traditional", date: "2025-06" },
  { id: 3, url: "img/AdobeExpressPhotos_d667f19b15d94b2f9431405b23e604ec_CopyEdited.png", caption: "Red geometric cross design", style: "Custom", date: "2025-06" },
  { id: 4, url: "img/Screenshot 2026-06-12 201403_edited.png", caption: "Screaming gorilla with crown of thorns", style: "Custom", date: "2025-06" },
  { id: 5, url: "img/Screenshot 2026-06-12 201339_edited.png", caption: "Peony and monarch butterfly composition", style: "American Traditional", date: "2025-06" },
  { id: 6, url: "img/Screenshot 2026-06-12 201626_edited.png", caption: "Centipede with spider lilies", style: "Custom", date: "2025-06" },
  { id: 7, url: "img/Screenshot 2026-06-12 201642_edited.png", caption: "Veni Vidi Vici Roman helmet", style: "Custom", date: "2025-06" },
  { id: 8, url: "img/Screenshot 2026-06-12 201715_edited.png", caption: "American Traditional lady head with rose", style: "American Traditional", date: "2025-06" },
  { id: 9, url: "img/Screenshot 2026-06-12 201741_edited.png", caption: "Skull and arrow with flowers", style: "American Traditional", date: "2025-06" },
  { id: 10, url: "img/Screenshot 2026-06-12 194110_edited.png", caption: "Tattooing in progress at the station", style: "Studio", date: "2025-06" },
  { id: 11, url: "img/Screenshot 2026-06-12 193751_edited.png", caption: "Custom design sketching on tablet", style: "Studio", date: "2025-05" },
  { id: 12, url: "img/Screenshot 2026-06-12 194155_edited.png", caption: "Working on a large back piece", style: "Studio", date: "2025-06" }
];

const STYLES = ["All", "American Traditional", "Small Pieces", "Custom", "Coverups", "Studio"];

// ============== UTILITIES ==============
function showToast(message, ms = 2600) {
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

// ============== DYNAMIC CONTENT (localStorage driven) ==============
function loadDynamicContent() {
  const content = loadFromStorage('thankq_content', DEFAULT_CONTENT);
  const portfolio = loadFromStorage('thankq_portfolio', DEFAULT_PORTFOLIO);

  // Update simple text fields
  document.querySelectorAll('[data-content="tagline"]').forEach(el => {
    el.textContent = content.tagline || DEFAULT_CONTENT.tagline;
  });
  document.querySelectorAll('[data-content="bio"]').forEach(el => {
    el.innerHTML = (content.bio || DEFAULT_CONTENT.bio).replace(/\n/g, '<br><br>');
  });
  document.querySelectorAll('[data-content="phone"]').forEach(el => {
    el.textContent = content.phone || DEFAULT_CONTENT.phone;
    if (el.tagName === 'A') el.href = `tel:${(content.phone || DEFAULT_CONTENT.phone).replace(/\D/g,'')}`;
  });
  document.querySelectorAll('[data-content="shopPhone"]').forEach(el => {
    el.textContent = content.shopPhone || DEFAULT_CONTENT.shopPhone;
  });
  document.querySelectorAll('[data-content="address"]').forEach(el => {
    el.textContent = content.address || DEFAULT_CONTENT.address;
  });
  document.querySelectorAll('[data-content="availability"]').forEach(el => {
    el.textContent = content.availability || DEFAULT_CONTENT.availability;
  });

  // Portfolio grids (multiple pages can have .portfolio-grid)
  document.querySelectorAll('.portfolio-grid').forEach(grid => {
    renderPortfolioGrid(grid, portfolio);
  });

  // Teaser grids (home recent work)
  document.querySelectorAll('.portfolio-teaser').forEach(grid => {
    renderPortfolioTeaser(grid, portfolio.slice(0, 6));
  });

  return { content, portfolio };
}

function renderPortfolioGrid(container, items) {
  container.innerHTML = '';
  container.classList.add('masonry-grid');

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

function renderPortfolioTeaser(container, items) {
  container.innerHTML = '';
  container.classList.add('grid', 'grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6', 'gap-3');

  items.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = `relative rounded-xl overflow-hidden aspect-[4/3.2] border border-zinc-800 group cursor-pointer`;
    el.innerHTML = `
      <img src="${item.url}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="${item.caption}">
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
        <span class="text-[10px] px-1.5 py-px bg-black/60 rounded text-white/90">${item.style}</span>
      </div>
    `;
    el.addEventListener('click', () => {
      // Navigate to full portfolio or open lightbox with full set
      const full = loadFromStorage('thankq_portfolio', DEFAULT_PORTFOLIO);
      const realIndex = full.findIndex(i => i.id === item.id);
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
function initFilters() {
  const filterContainer = document.getElementById('style-filters');
  const grid = document.querySelector('.portfolio-grid');
  if (!filterContainer || !grid) return;

  // Build buttons if not present
  if (filterContainer.children.length === 0) {
    STYLES.forEach(style => {
      const btn = document.createElement('button');
      btn.className = `filter-btn ${style === 'All' ? 'active' : ''}`;
      btn.textContent = style;
      btn.dataset.style = style;
      filterContainer.appendChild(btn);
    });
  }

  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    // active state
    filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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

// ============== LIGHTBOX ==============
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

  lb.classList.add('open');
  updateLightboxImage();

  // Keyboard
  document.addEventListener('keydown', lightboxKeyboardHandler, { once: true });
}

function createLightboxDOM() {
  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" aria-label="Close">×</button>
      <button class="lightbox-nav prev" aria-label="Previous">‹</button>
      <button class="lightbox-nav next" aria-label="Next">›</button>
      <img id="lightbox-image" alt="">
      <div id="lightbox-caption" class="mt-4 text-center text-zinc-300 text-sm max-w-3xl mx-auto"></div>
      <div class="flex justify-center gap-3 mt-4">
        <a id="lightbox-ig" href="https://instagram.com/thankqtattoos" target="_blank" 
           class="btn btn-secondary btn-sm text-xs">VIEW ON INSTAGRAM</a>
        <button id="lightbox-close-bottom" class="btn btn-ghost btn-sm text-xs">CLOSE</button>
      </div>
    </div>
  `;

  // Events
  lb.querySelector('.lightbox-close').onclick = closeLightbox;
  lb.querySelector('#lightbox-close-bottom').onclick = closeLightbox;
  lb.querySelector('.prev').onclick = () => navigateLightbox(-1);
  lb.querySelector('.next').onclick = () => navigateLightbox(1);

  // Click outside image closes
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
  const igLink = lb.querySelector('#lightbox-ig');

  img.src = item.url;
  img.alt = item.caption || 'Tattoo work by Qwami Tucker';
  cap.innerHTML = `<span class="style-badge mr-2">${item.style || ''}</span> ${item.caption || ''}`;
  igLink.href = 'https://instagram.com/thankqtattoos';
}

function navigateLightbox(dir) {
  currentLightboxIndex = (currentLightboxIndex + dir + currentLightboxItems.length) % currentLightboxItems.length;
  updateLightboxImage();
}

function lightboxKeyboardHandler(e) {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;

  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') navigateLightbox(1);
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}

// ============== INK PARTICLES (hero) ==============
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
      p.vy *= 0.985;               // drag
      p.alpha *= 0.992;

      // gentle wander
      p.vx += (Math.random() - 0.5) * 0.03;

      // respawn when faded or offscreen
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

      // faint ink bleed halo
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

  // Gentle burst on hero click
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

  // Return cleanup if needed
  return () => cancelAnimationFrame(raf);
}

// ============== FORMS (store to localStorage) ==============
function initForms() {
  // All forms with class .thankq-form
  document.querySelectorAll('.thankq-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      data.ts = new Date().toISOString();
      data.id = 'sub_' + Date.now();

      // Store
      const subs = loadFromStorage('thankq_submissions', []);
      subs.unshift(data);
      saveToStorage('thankq_submissions', subs.slice(0, 80)); // cap

      // Success UI
      const origText = form.querySelector('button[type="submit"]')?.textContent || 'Submit';
      showToast('Thank you — your request has been received. Qwami will text you shortly.');

      form.reset();

      // Optional: if Netlify or Formspree, you can let it submit naturally by removing preventDefault in prod.
      // For now we intercept and store.
    });
  });
}

// ============== NAV & MOBILE ==============
function initNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  // Scroll style
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    lastY = y;
  }, { passive: true });

  // Mobile hamburger
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      const expanded = menu.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('#mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
    });
  });
}

// Highlight current page in navigation (works on all static pages)
function initActiveNav() {
  // Get current file name (handles index.html, bare /, etc.)
  let current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (current === '' || current === 'index' || current === 'index.html' || current === '/') {
    current = 'index.html';
  }

  // Normalize target from href (strip query/hash)
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    const target = href.split('/').pop().split('#')[0] || 'index.html';

    // Match common cases
    const isActive =
      target === current ||
      (current === 'index.html' && (target === '' || target === 'index' || target === 'index.html')) ||
      (current === '' && target === 'index.html');

    if (isActive) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ============== BOOT ==============
function initCommon() {
  initNav();
  initActiveNav();           // NEW: highlights the current page in the nav
  loadDynamicContent();
  initFilters();
  initForms();

  // Ink particles (only if canvas exists)
  const canvas = document.getElementById('ink-canvas');
  if (canvas) initInkParticles('ink-canvas');

  // Make sure any existing lightbox triggers work
  // (portfolio items are bound when rendered)
}

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommon);
} else {
  initCommon();
}

// Expose some helpers for admin page and debugging
window.ThankQ = {
  loadDynamicContent,
  renderPortfolioGrid,
  showToast,
  loadFromStorage,
  saveToStorage,
  DEFAULT_PORTFOLIO,
  DEFAULT_CONTENT
};