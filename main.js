/**
 * main.js — RAW FORM fitness site
 *
 * ─── HOW TO ADD A NEW POST ────────────────────────────────
 * Open data/posts.json and append a new object to the array.
 * The site picks it up automatically — no other files to touch.
 *
 * POST SCHEMA:
 * {
 *   "id":          string   — URL slug, e.g. "pistol-squat-progress"
 *   "date":        string   — ISO date, e.g. "2026-01-20"
 *   "tag":         string   — SKILL | MILESTONE | PROGRESS | FOUNDATION
 *   "title":       string   — Headline
 *   "description": string   — Write-up. Use \n\n for paragraph breaks.
 *   "photos":      string[] — Image URLs (3 recommended)
 *   "stats":       { label: string, value: string }[]  — Up to 3
 * }
 */

(function () {
  'use strict';

  /* ── NAV TOGGLE ───────────────────────────────────────── */
  const toggle   = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'CLOSE' : 'MENU';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'MENU';
    });
  });

  /* ── ACTIVE NAV ───────────────────────────────────────── */
  const sectionIds = ['index-section', 'posts-section', 'achievements-section'];
  const navAs = navLinks.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    let cur = '';
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 130) cur = id;
    });
    navAs.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }, { passive: true });

  /* ── HELPERS ──────────────────────────────────────────── */
  function fmtDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  function tagClass(tag) {
    return ({ MILESTONE: 'tag-milestone', PROGRESS: 'tag-progress', FOUNDATION: 'tag-foundation' }[tag] || 'tag-skill');
  }

  /* ── INDEX CARD ───────────────────────────────────────── */
  function buildIndexCard(post, idx) {
    const el = document.createElement('div');
    el.className = 'index-card';
    el.setAttribute('role', 'link');
    el.setAttribute('tabindex', '0');
    el.innerHTML = `
      <p class="ic-num">${String(idx + 1).padStart(2, '0')}</p>
      <h3 class="ic-title">${post.title}</h3>
      <span class="tag ${tagClass(post.tag)}">${post.tag}</span>
      <p class="ic-date">${fmtDate(post.date)}</p>
      <span class="ic-arrow" aria-hidden="true">↗</span>
    `;
    const jump = () => document.getElementById('post-' + post.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.addEventListener('click', jump);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') jump(); });
    return el;
  }

  /* ── POST BLOCK ───────────────────────────────────────── */
  function buildPost(post) {
    const statsHTML = (post.stats || []).slice(0, 3).map(s => `
      <div class="stat-cell">
        <span class="stat-val">${s.value}</span>
        <span class="stat-lbl">${s.label}</span>
      </div>`).join('');

    const photos = [...(post.photos || [])].slice(0, 3);
    while (photos.length < 3) photos.push(null);

    const photosHTML = photos.map((url, i) => `
      <div class="photo-cell">
        ${url
          ? `<img src="${url}" alt="Photo ${i + 1} — ${post.title}" loading="lazy" />`
          : `<div style="background:var(--grey-200);width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><span style="font-family:var(--font-m);font-size:0.6rem;color:var(--grey-400);">—</span></div>`
        }
      </div>`).join('');

    const descHTML = post.description.trim().split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

    const el = document.createElement('div');
    el.className = 'post-block';
    el.id = 'post-' + post.id;

    el.innerHTML = `
      <div class="section-wrap">
        <div class="post-meta-bar">
          <div class="post-meta-left">
            <span class="tag ${tagClass(post.tag)}">${post.tag}</span>
            <span class="post-date">${fmtDate(post.date)}</span>
          </div>
          <a href="#index-section" class="post-back">↑ Back to index</a>
        </div>

        <h2 class="post-title">${post.title}</h2>

        <div class="post-body-grid">

          <div class="post-text-col">
            ${statsHTML ? `<div class="post-stats-row">${statsHTML}</div>` : ''}
            <div class="post-desc">${descHTML}</div>
          </div>

          <div class="post-photo-col">
            <div class="photo-grid">${photosHTML}</div>
          </div>

        </div>
      </div>
    `;
    return el;
  }

  /* ── INIT ─────────────────────────────────────────────── */
  async function init() {
    const indexGrid      = document.getElementById('index-grid');
    const postsContainer = document.getElementById('posts-container');
    const statEntries    = document.getElementById('stat-entries');
    const indexCount     = document.getElementById('index-count');

    let posts;
    try {
      const res = await fetch('data/posts.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      posts = await res.json();
    } catch (err) {
      const msg = `<div class="section-wrap"><p class="error-msg">Could not load posts.json — ${err.message}<br>Serve from a web server, not file://</p></div>`;
      indexGrid.innerHTML = msg;
      postsContainer.innerHTML = msg;
      return;
    }

    posts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    statEntries.textContent = posts.length;
    indexCount.textContent  = `${posts.length} entries`;

    indexGrid.innerHTML = '';
    posts.forEach((p, i) => indexGrid.appendChild(buildIndexCard(p, i)));

    postsContainer.innerHTML = '';
    posts.forEach(p => postsContainer.appendChild(buildPost(p)));
  }

  init();
})();
