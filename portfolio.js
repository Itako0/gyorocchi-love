function render () {
    const $ = id => document.getElementById(id);
    const view = $('view');
    const params = new URLSearchParams(location.search);
    const works = typeof WORKS === 'undefined' ? [] : WORKS;

    document.getElementById('hamburger').addEventListener('click', () => document.querySelector('.nav-links').classList.toggle('open'));

    /* ───────── 共通の部品 ───────── */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const safeUrl = u => /^\s*(javascript|data|vbscript):/i.test(u) ? '#' : u;
    const tagClass = t => ({ App: 'tag-new', Web: 'tag-classic' }[t] || 'tag-hard');
    const artClass = i => 'art-' + (i % 4);
    const detailUrl = id => 'portfolio.html?id=' + encodeURIComponent(id);

    function art(w, i, extra) {
      return `<div class="work-art ${artClass(i)} ${extra || ''}">` +
        `<span class="work-emoji" aria-hidden="true">${esc(w.emoji || '🦆')}</span>` +
        (w.image ? `<img src="${esc(w.image)}" alt="${esc(w.title)}" onerror="this.remove()">` : '') + '</div>';
    }
    function tags(w, limit) {
      const all = [`<span class="tag ${tagClass(w.type)}">${esc(w.type || 'Work')}</span>`]
        .concat((w.tags || []).map(t => `<span class="tag">${esc(t)}</span>`));
      return `<div class="work-tags">${(limit ? all.slice(0, limit) : all).join('')}</div>`;
    }

    // 本文の軽いマークアップ → HTML
    function inline(t) {
      return esc(t)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
          `<a href="${safeUrl(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    }
    function renderBody(text) {
      const lines = String(text || '').replace(/\r/g, '').split('\n');
      let html = '', para = [], list = [];
      const flushP = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br>') + '</p>'; para = []; } };
      const flushL = () => { if (list.length) { html += '<ul>' + list.map(i => '<li>' + inline(i) + '</li>').join('') + '</ul>'; list = []; } };
      for (const raw of lines) {
        const l = raw.trim(); let m;
        if (!l) { flushP(); flushL(); continue; }
        if ((m = l.match(/^(#{2,3})\s+(.+)$/))) { flushP(); flushL(); html += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; }
        else if ((m = l.match(/^!\[(.*?)\]\((\S+?)\)$/))) { flushP(); flushL(); html += `<figure><img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" loading="lazy">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ''}</figure>`; }
        else if ((m = l.match(/^[-・]\s+(.+)$/))) { flushP(); list.push(m[1]); }
        else { flushL(); para.push(l); }
      }
      flushP(); flushL();
      return html;
    }

    /* ───────── 一覧 ───────── */
    const header = 
    '<div class="section-header"><h1 class="section-title">ポートフォリオ</h1><p class="section-sub">自主開発した主要なゲームやアプリ、システムなど載せれるものは全部載せたいですね<br/>Appは学校のpcでプレイできないものがほとんどです。<br/>動画とか公式サイトは貼ってるので是非見て行ってください。</p></div>';
    function showList() {
      view.innerHTML = header + '<div class="works-grid" id="worksGrid">' + works.map((w, i) => `
        <article class="work-card">
          ${art(w, i)}
          <div class="work-info">
            <h2 class="work-title">${esc(w.title)}</h2>
            <p class="work-summary">${esc(w.summary)}</p>
            ${tags(w)}
            <a href="${detailUrl(w.id)}" class="btn btn-dark">READ MORE →</a>
          </div>
        </article>`).join('') + '</div><div class="page-foot"><a href="index.html" class="btn btn-ghost">← TOPへ戻る</a></div>';

      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } }), { threshold: 0.15 });
      view.querySelectorAll('.work-card').forEach(el => io.observe(el));
    }

    /* ───────── 詳細（ブログ形式） ───────── */
    function showDetail(id) {
      const idx = works.findIndex(w => w.id === id);
      if (idx < 0) {
        document.title = '作品が見つかりません | 梶原のウェブサイト';
        view.innerHTML = `<div class="article"><a class="btn btn-ghost back-btn" href="portfolio.html">
          ← ポートフォリオ一覧へ戻る</a><p class="empty-note">この作品は見つかりませんでした。<br>URLが違うか、作品が削除された可能性があります。</p>
          </div>`;
        return;
      }
      const w = works[idx];
      document.title = `${w.title} | 梶原のウェブサイト`;
      const setMeta = (sel, v) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', v); };
      setMeta('meta[name="description"]', w.summary || '');
      setMeta('meta[property="og:title"]', document.title);
      setMeta('meta[property="og:description"]', w.summary || '');

      const links = (w.links || []).filter(l => l && l.url).map((l, i) =>
        `<a href="${esc(safeUrl(l.url))}" class="btn ${i === 0 ? 'btn-dark-fill' : 'btn-dark'}"${/^https?:/i.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${esc(l.label || '開く')} →</a>`).join('');
      const prev = works[idx - 1], next = works[idx + 1];
      const pager = (prev || next) ? `<nav class="work-pager" aria-label="他の作品">
          ${prev ? `<a class="btn btn-ghost" href="${detailUrl(prev.id)}">← ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a class="btn btn-ghost" href="${detailUrl(next.id)}">${esc(next.title)} →</a>` : ''}</nav>` : '';

      view.innerHTML = `<div class="article">
        <a class="btn btn-ghost back-btn" href="portfolio.html">← ポートフォリオ一覧へ戻る</a>
        <header class="work-head">${tags(w)}<h1>${esc(w.title)}</h1>${w.date ? `<p class="work-date">${esc(w.date)}</p>` : ''}</header>
        ${art(w, idx, 'article-cover')}
        <div class="article-card">
          <div class="article-body">${renderBody(w.body || w.summary)}</div>
          ${links ? `<div class="work-links">${links}</div>` : ''}
        </div>
        ${pager}</div>`;
    }

    /* ───────── 登録ツール（?admin） ───────── */
    function showAdmin() {
      document.title = '作品登録 | 梶原のウェブサイト';
      document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex, nofollow">');
      view.appendChild($('adminTpl').content.cloneNode(true));

      let list = JSON.parse(JSON.stringify(works));
      let editing = -1;

      const HEADER = `/* ============================================
   works.js — 作品データ
   ・配列の上にあるものほど先に表示されます
   ・追加／編集は portfolio.html?admin で行い、書き出した works.js で
     このファイルを置き換えるのが簡単です（手で書き足してもOK）
   ・body の書き方: ## 見出し / ### 小見出し / - 箇条書き
     ![説明](assets/img/xxx.png) / [文字](URL) / **太字** / 空行で段落
   ============================================ */
`;
      const q  = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
      const bt = s => '`' + String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
      function serialize(arr) {
        const items = arr.map(w => {
          const L = [];
          L.push(`    id: ${q(w.id)},`, `    title: ${q(w.title)},`, `    type: ${q(w.type)},`);
          if (w.tags && w.tags.length) L.push(`    tags: [${w.tags.map(q).join(', ')}],`);
          if (w.date) L.push(`    date: ${q(w.date)},`);
          if (w.emoji) L.push(`    emoji: ${q(w.emoji)},`);
          if (w.image) L.push(`    image: ${q(w.image)},`);
          L.push(`    summary: ${q(w.summary)},`);
          L.push(`    body: ${bt(w.body)}` + (w.links && w.links.length ? ',' : ''));
          if (w.links && w.links.length) L.push('    links: [\n' + w.links.map(k => `      { label: ${q(k.label)}, url: ${q(k.url)} }`).join(',\n') + '\n    ]');
          return '  {\n' + L.join('\n') + '\n  }';
        });
        return HEADER + 'const WORKS = [\n' + items.join(',\n') + '\n];\n';
      }

      function refresh() {
        $('list').innerHTML = list.length ? list.map((w, i) => `
          <li class="${i === editing ? 'is-editing' : ''}">
            <span class="li-title">${esc(w.emoji || '')} ${esc(w.title)}</span>
            <span class="li-btns">
              <button type="button" class="mini-btn" data-a="up" data-i="${i}" aria-label="上へ">↑</button>
              <button type="button" class="mini-btn" data-a="down" data-i="${i}" aria-label="下へ">↓</button>
              <button type="button" class="mini-btn" data-a="edit" data-i="${i}">編集</button>
              <button type="button" class="mini-btn danger" data-a="del" data-i="${i}">削除</button>
            </span></li>`).join('') : '<li><span class="li-title">まだ作品がありません</span></li>';
        $('out').value = serialize(list);
        $('formTitle').textContent = editing >= 0 ? '作品を編集' : '新しい作品を追加';
        $('saveBtn').textContent = editing >= 0 ? '更新する' : '追加する';
      }
      const say = (t, ok) => { const m = $('msg'); m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); };
      const preview = () => { $('preview').innerHTML = renderBody($('f-body').value); };

      function fill(w) {
        $('f-title').value = w.title || ''; $('f-id').value = w.id || ''; $('f-type').value = w.type || '';
        $('f-tags').value = (w.tags || []).join(', '); $('f-date').value = w.date || '';
        $('f-emoji').value = w.emoji || ''; $('f-image').value = w.image || '';
        $('f-summary').value = w.summary || ''; $('f-body').value = w.body || '';
        $('f-links').value = (w.links || []).map(l => `${l.label} | ${l.url}`).join('\n');
        preview();
      }
      function read() {
        const links = $('f-links').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
          const p = l.indexOf('|');
          return p < 0 ? { label: '', url: l } : { label: l.slice(0, p).trim(), url: l.slice(p + 1).trim() };
        });
        return {
          id: $('f-id').value.trim(), title: $('f-title').value.trim(), type: $('f-type').value.trim() || 'Web',
          tags: $('f-tags').value.split(/[,、]/).map(t => t.trim()).filter(Boolean),
          date: $('f-date').value.trim(), emoji: $('f-emoji').value.trim(), image: $('f-image').value.trim(),
          summary: $('f-summary').value.trim(), body: $('f-body').value.replace(/\r/g, '').trim(), links
        };
      }
      const startNew = () => { editing = -1; fill({}); say('', true); refresh(); };

      $('list').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        const i = +b.dataset.i, a = b.dataset.a;
        if (a === 'edit') { editing = i; fill(list[i]); say('', true); }
        if (a === 'up' && i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; if (editing === i) editing--; else if (editing === i - 1) editing++; }
        if (a === 'down' && i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; if (editing === i) editing++; else if (editing === i + 1) editing--; }
        if (a === 'del' && confirm(`「${list[i].title}」を削除しますか？`)) {
          list.splice(i, 1);
          if (editing === i) { editing = -1; fill({}); } else if (editing > i) editing--;
        }
        refresh();
      });
      $('saveBtn').addEventListener('click', () => {
        const w = read();
        if (!w.title) return say('作品名を入力してください。', false);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(w.id)) return say('IDは半角の小文字英数字とハイフンで入力してください（例：study-monster）。', false);
        if (list.some((x, i) => x.id === w.id && i !== editing)) return say('そのIDはすでに使われています。別のIDにしてください。', false);
        if (!w.summary) return say('短い説明を入力してください。', false);
        if (w.links.some(l => !l.label || !l.url)) return say('ボタンのリンクは「ボタン名 | URL」の形で書いてください。', false);
        if (editing >= 0) { list[editing] = w; say('更新しました。下の works.js に反映されています。', true); }
        else { list.push(w); editing = list.length - 1; say('追加しました（一覧の最後）。下の works.js に反映されています。', true); }
        refresh();
      });
      $('newBtn').addEventListener('click', startNew);
      $('resetBtn').addEventListener('click', startNew);
      $('f-body').addEventListener('input', preview);
      $('f-file').addEventListener('change', e => { const f = e.target.files[0]; if (f) $('f-image').value = 'assets/img/' + f.name; });
      $('dlBtn').addEventListener('click', () => {
        const url = URL.createObjectURL(new Blob([$('out').value], { type: 'text/javascript' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'works.js' });
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      });
      $('copyBtn').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText($('out').value); } catch (_) { $('out').select(); document.execCommand('copy'); }
        const b = $('copyBtn'), t = b.textContent; b.textContent = 'コピーしました'; setTimeout(() => b.textContent = t, 1500);
      });
      refresh();
    }

    /* ───────── どの画面を出すか ───────── */
    if (params.has('admin')) showAdmin();
    else if (params.has('id')) showDetail(params.get('id'));
    else showList();
  }

render();