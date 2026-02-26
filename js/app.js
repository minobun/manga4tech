'use strict';

async function loadComics() {
  const loading = document.getElementById('loading');
  const errorMsg = document.getElementById('error-msg');
  const comicsContainer = document.getElementById('comics-container');
  const termNav = document.getElementById('term-nav');

  // Data source is declared on the container element via data-src attribute
  const dataUrl = comicsContainer.dataset.src;
  const cardLabel = comicsContainer.dataset.label || '四コマ';

  try {
    const res = await fetch(dataUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const comics = await res.json();

    loading.remove();
    buildNav(comics, termNav);
    buildComics(comics, comicsContainer, cardLabel);
    handleHashNav();
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

function buildComics(comics, container, cardLabel) {
  comics.forEach(comic => {
    container.appendChild(createCard(comic, cardLabel));
  });
  setupScrollSpy(comics);
}

function createCard(comic, cardLabel) {
  const card = document.createElement('article');
  card.className = 'comic-card';
  card.id = `comic-${comic.id}`;

  const header = document.createElement('div');
  header.className = 'comic-header';
  const fullNameHtml = comic.fullName
    ? `<span class="term-fullname">${escapeHtml(comic.fullName)}</span>`
    : '';
  header.innerHTML = `
    <span class="term-badge">${escapeHtml(comic.term)}</span>
    <div class="term-title-group">
      ${fullNameHtml}
      <h2>${escapeHtml(cardLabel)}</h2>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'panels-grid';
  (comic.panels || []).forEach((panel, i) => {
    grid.appendChild(createPanel(panel, i + 1));
  });

  const desc = document.createElement('div');
  desc.className = 'comic-description';
  desc.innerHTML = `
    <div class="desc-label">解説</div>
    <p>${escapeHtml(comic.description)}</p>
  `;

  card.append(header, grid, desc);

  if (comic.sources && comic.sources.length > 0) {
    card.appendChild(createSourcesBlock(comic.dataAsOf, comic.sources));
  }

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
    const placeholder = makePlaceholder(num);
    imageWrap.appendChild(placeholder);
    img.onload = () => { imageWrap.innerHTML = ''; imageWrap.appendChild(img); };
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

function createSourcesBlock(dataAsOf, sources) {
  const block = document.createElement('div');
  block.className = 'comic-sources';

  const asOfHtml = dataAsOf
    ? `<span class="sources-date">情報時点: ${escapeHtml(dataAsOf)}</span>`
    : '';

  const itemsHtml = sources.map(s => `
    <li class="source-item">
      <span class="source-label">${escapeHtml(s.label)}</span>
      ${s.note ? `<span class="source-note">${escapeHtml(s.note)}</span>` : ''}
    </li>
  `).join('');

  block.innerHTML = `
    <div class="sources-header">
      <span class="sources-title">参考情報</span>
      ${asOfHtml}
    </div>
    <ul class="sources-list">${itemsHtml}</ul>
  `;
  return block;
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
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('comic-', '');
        const btn = document.querySelector(`.nav-btn[data-id="${id}"]`);
        if (btn) setActiveNav(btn);
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  comics.forEach(c => {
    const el = document.getElementById(`comic-${c.id}`);
    if (el) observer.observe(el);
  });
}

function handleHashNav() {
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
