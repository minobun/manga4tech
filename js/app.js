'use strict';

const DATA_URL = 'data/comics.json';

async function loadComics() {
  const loading = document.getElementById('loading');
  const errorMsg = document.getElementById('error-msg');
  const comicsContainer = document.getElementById('comics-container');
  const termNav = document.getElementById('term-nav');

  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const comics = await res.json();

    loading.remove();
    buildNav(comics, termNav);
    buildComics(comics, comicsContainer);
    handleHashNav(comics);
  } catch (err) {
    loading.remove();
    errorMsg.textContent = `データの読み込みに失敗しました: ${err.message}`;
    errorMsg.hidden = false;
  }
}

function buildNav(comics, nav) {
  comics.forEach(comic => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = comic.term;
    btn.dataset.id = comic.id;
    btn.addEventListener('click', () => {
      const el = document.getElementById(`comic-${comic.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveNav(btn);
    });
    nav.appendChild(btn);
  });
}

function setActiveNav(activeBtn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

function buildComics(comics, container) {
  comics.forEach(comic => {
    const card = createCard(comic);
    container.appendChild(card);
  });

  // Highlight nav on scroll
  setupScrollSpy(comics);
}

function createCard(comic) {
  const card = document.createElement('article');
  card.className = 'comic-card';
  card.id = `comic-${comic.id}`;

  // Header
  const header = document.createElement('div');
  header.className = 'comic-header';
  header.innerHTML = `
    <span class="term-badge">${escapeHtml(comic.term)}</span>
    <h2>ネットワーク用語四コマ</h2>
  `;

  // Panel grid
  const grid = document.createElement('div');
  grid.className = 'panels-grid';

  (comic.panels || []).forEach((panel, i) => {
    grid.appendChild(createPanel(panel, i + 1));
  });

  // Description
  const desc = document.createElement('div');
  desc.className = 'comic-description';
  desc.innerHTML = `
    <div class="desc-label">解説</div>
    <p>${escapeHtml(comic.description)}</p>
  `;

  card.append(header, grid, desc);
  return card;
}

function createPanel(panel, num) {
  const wrapper = document.createElement('div');
  wrapper.className = 'panel';

  const numEl = document.createElement('span');
  numEl.className = 'panel-number';
  numEl.textContent = num;

  const imageWrap = document.createElement('div');
  imageWrap.className = 'panel-image-wrap';

  if (panel.image) {
    const img = new Image();
    img.alt = `コマ${num}`;
    img.loading = 'lazy';

    // Show placeholder until image loads; swap on success
    const placeholder = makePlaceholder(num);
    imageWrap.appendChild(placeholder);

    img.onload = () => {
      imageWrap.innerHTML = '';
      imageWrap.appendChild(img);
    };
    img.onerror = () => {
      // Keep placeholder if image fails to load
    };
    img.src = panel.image;
  } else {
    imageWrap.appendChild(makePlaceholder(num));
  }

  const caption = document.createElement('div');
  caption.className = 'panel-caption';
  caption.textContent = panel.caption || '';

  wrapper.append(numEl, imageWrap, caption);
  return wrapper;
}

function makePlaceholder(num) {
  const ph = document.createElement('div');
  ph.className = 'placeholder';
  ph.innerHTML = `
    <span class="placeholder-icon">🖼️</span>
    <span class="placeholder-text">コマ${num} (画像準備中)</span>
  `;
  return ph;
}

function setupScrollSpy(comics) {
  const ids = comics.map(c => `comic-${c.id}`);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('comic-', '');
        const btn = document.querySelector(`.nav-btn[data-id="${id}"]`);
        if (btn) setActiveNav(btn);
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function handleHashNav(comics) {
  if (location.hash) {
    const id = location.hash.slice(1);
    const el = document.getElementById(`comic-${id}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', loadComics);
