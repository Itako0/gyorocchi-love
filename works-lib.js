/* works-lib.js — portfolio.html / work.html / admin.html 共通の関数 */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // javascript: などは無効化
  const safeUrl = u => /^\s*(javascript|data|vbscript):/i.test(u) ? '#' : u;

  // 種類タグの色
  const tagClass = type => ({ App: 'tag-new', Web: 'tag-classic' }[type] || 'tag-hard');

  // 作品ごとの背景グラデーション（画像がない時に見える）
  const artClass = i => 'art-' + (i % 4);

  // 本文の軽いマークアップ → HTML
  function inline(t) {
    return esc(t)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
        const ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : '';
        return `<a href="${safeUrl(url)}"${ext}>${label}</a>`;
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function renderBody(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    let html = '', para = [], list = [];
    const flushP = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
    const flushL = () => { if (list.length) { html += '<ul>' + list.map(i => '<li>' + inline(i) + '</li>').join('') + '</ul>'; list = []; } };
    for (const raw of lines) {
      const l = raw.trim();
      let m;
      if (!l) { flushP(); flushL(); continue; }
      if ((m = l.match(/^(#{2,3})\s+(.+)$/))) {
        flushP(); flushL();
        html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
      } else if ((m = l.match(/^!\[(.*?)\]\((\S+?)\)$/))) {
        flushP(); flushL();
        html += `<figure><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" loading="lazy">` +
                (m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : '') + '</figure>';
      } else if ((m = l.match(/^[-・]\s+(.+)$/))) {
        flushP(); list.push(m[1]);
      } else {
        flushL(); para.push(l);
      }
    }
    flushP(); flushL();
    return html;
  }

  // カード／詳細ページ上部のビジュアル部分
  function art(w, i, extraClass) {
    return `<div class="work-art ${artClass(i)} ${extraClass || ''}">` +
      `<span class="work-emoji" aria-hidden="true">${esc(w.emoji || '🦆')}</span>` +
      (w.image ? `<img src="${esc(w.image)}" alt="${esc(w.title)}" onerror="this.remove()">` : '') +
      '</div>';
  }

  function tags(w) {
    const all = [`<span class="tag ${tagClass(w.type)}">${esc(w.type || 'Work')}</span>`];
    (w.tags || []).forEach(t => all.push(`<span class="tag">${esc(t)}</span>`));
    return `<div class="work-tags">${all.join('')}</div>`;
  }

  window.WorksLib = { esc, safeUrl, tagClass, artClass, renderBody, art, tags };

  // ハンバーガーメニュー
  document.addEventListener('DOMContentLoaded', () => {
    const h = document.getElementById('hamburger');
    if (h) h.addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('open'));
  });
})();
