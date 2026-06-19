/**
 * main.js — RAW FORM fitness site
 *
 * HOW TO ADD A NEW POST:
 * Open data/posts.json and add a new object to the array.
 * The site will automatically pick it up — no other changes needed.
 *
 * POST SCHEMA:
 * {
 *   "id":          string  — URL-friendly slug, e.g. "my-first-planche"
 *   "date":        string  — ISO date, e.g. "2025-12-01"
 *   "tag":         string  — One of: SKILL | MILESTONE | PROGRESS | FOUNDATION
 *   "title":       string  — Post headline
 *   "description": string  — Full write-up. Use \n\n for paragraph breaks.
 *   "photos":      string[] — Array of image URLs (ideally 3 for the grid)
 *   "stats":       { label: string, value: string }[]  — Up to 3 stats shown above the text
 * }
 */

(function () {
  'use strict';

  /* ── NAV TOGGLE (mobile) ──────────────────────────────── */
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'CLOSE' : 'MENU';
  });

  /* Close nav on link click */
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'MENU';
    });
  });

  /* ── ACTIVE NAV on scroll ─────────────────────────────── */
  const sections = ['index-section', 'posts-section', 'achievements-section'];
  const navAnchors = navLinks.querySelectorAll('a');

  function updateActiveNav() {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) current = id;
    });
    navAnchors.forEach(a => {
      const href = a.getAttribute('href').replace('#', '');
      a.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ── FORMAT DATE ──────────────────────────────────────── */
  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ── TAG CLASS ────────────────────────────────────────── */
  function tagClass(tag) {
    const map = {
      MILESTONE: 'tag-milestone',
      PROGRESS: 'tag-progress',
      FOUNDATION: 'tag-foundation',
    };
    return map[tag] || '';
  }

  /* ── BUILD INDEX CARD ─────────────────────────────────── */
  function buildIndexCard(post, idx) {
    const card = document.createElement('div');
    card.className = 'index-card';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Jump to: ${post.title}`);

    card.innerHTML = `
      <p class="index-card-num">${String(idx + 1).padStart(2, '0')}</p>
      <h3 class="index-card-title">${post.title}</h3>
      <span class="tag-pill ${tagClass(post.tag)}">${post.tag}</span>
      <p class="index-card-date">${formatDate(post.date)}</p>
      <span class="index-card-arrow" aria-hidden="true">↗</span>
    `;

    function jump() {
      const target = document.getElementById('post-' + post.id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    card.addEventListener('click', jump);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') jump(); });
    return card;
  }

  /* ── BUILD POST BLOCK ─────────────────────────────────── */
  function buildPost(post) {
    /* Stats HTML */
    const statsHTML = (post.stats || []).slice(0, 3).map(s => `
      <div class="stat-block">
        <span class="stat-block-value">${s.value}</span>
        <span class="stat-block-label">${s.label}</span>
      </div>
    `).join('');

    /* Photos HTML — up to 3, graceful if fewer */
    const photos = (post.photos || []).slice(0, 3);
    while (photos.length < 3) photos.push(null); /* pad to 3 */
    const photosHTML = photos.map(url => `
      <div class="photo-cell">
        ${url
          ? `<img src="${url}" alt="Training photo for ${post.title}" loading="lazy" />`
          : `<div style="background: var(--grey-200); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
               <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--grey-400);">NO PHOTO</span>
             </div>`}
      </div>
    `).join('');

    /* Description — convert double newlines to paragraphs */
    const paragraphs = post.description.trim().split(/\n\n+/);
    const descHTML = paragraphs.map(p => `<p class="post-description" style="margin-bottom: 1rem;">${p.replace(/\n/g, '<br />')}</p>`).join('');

    const block = document.createElement('div');
    block.className = 'post-block scroll-target';
    block.id = 'post-' + post.id;

    block.innerHTML = `
      <div class="site-container">
        <div class="post-meta-bar">
          <div class="post-meta-left">
            <span class="tag-pill ${tagClass(post.tag)}">${post.tag}</span>
            <span class="post-date">${formatDate(post.date)}</span>
          </div>
          <a href="#index-section" class="label" style="color: var(--grey-400); font-size: 0.65rem;">↑ Back to index</a>
        </div>

        <h2 class="post-title">${post.title}</h2>

        <div class="post-layout">

          <div class="post-body">
            ${statsHTML ? `<div class="post-stats">${statsHTML}</div>` : ''}
            ${descHTML}
          </div>

          <div class="post-sidebar">
            <div class="photo-grid" style="margin-bottom: 1.5rem;">
              ${photosHTML}
            </div>
          </div>

        </div>
      </div>
    `;

    return block;
  }

  /* ── LOAD & RENDER ────────────────────────────────────── */
  async function init() {
    const indexGrid     = document.getElementById('index-grid');
    const postsContainer = document.getElementById('posts-container');
    const statEntries   = document.getElementById('stat-entries');
    const indexCount    = document.getElementById('index-count');

    let posts;
    try {
      const res = await fetch('data/posts.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      posts = await res.json();
    } catch (err) {
      const errMsg = `<div class="posts-error">
        Failed to load posts.json — ${err.message}<br />
        Make sure you're serving the site from a web server (not file://).
      </div>`;
      indexGrid.innerHTML = errMsg;
      postsContainer.innerHTML = errMsg;
      return;
    }

    /* Sort newest first */
    posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    /* Update counters */
    statEntries.textContent = posts.length;
    indexCount.textContent = `${posts.length} entries`;

    /* Render index */
    indexGrid.innerHTML = '';
    posts.forEach((post, idx) => {
      indexGrid.appendChild(buildIndexCard(post, idx));
    });

    /* Render posts */
    postsContainer.innerHTML = '';
    posts.forEach(post => {
      postsContainer.appendChild(buildPost(post));
    });
  }

  init();
})();
