
// ── Supabase設定 ──

const SUPABASE_URL = 'https://awjapbybodvnrtchqtoq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_m7sUAzaVO96-rQrPRKaUBQ_uWCRh7oa';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// 匿名認証を初期化
let authPromise = null;

async function initializeSupabase() {
  if (!authPromise) {
    authPromise = (async () => {
      const {
        data: { session },
        error
      } = await supabaseClient.auth.getSession();

      if (error) throw error;

      if (!session) {
        const { error: signInError } =
          await supabaseClient.auth.signInAnonymously();

        if (signInError) throw signInError;
      }
    })().catch(error => {
      authPromise = null;
      throw error;
    });
  }

  return authPromise;
}



// ── 記事のDB用ID ──

function getPostDbId(post) {
  return post.dbId || post.id;
}


// ── 記事統計情報を取得 ──

async function fetchPostStats(id) {
    await initializeSupabase();

    const { data, error } =
        await supabaseClient.functions.invoke('get-post-stats', {
        body: { post_id: id }
        });

    if (error) {
        if (error.context) {
        console.error(
            'get-post-statsの詳細エラー:',
            await error.context.clone().text()
        );
        }
        throw error;
    }

    return data;
}


// ── 閲覧数を記録 ──

async function recordPostView(id) {
    await initializeSupabase();

    const { data, error } = await supabaseClient.functions.invoke(
        'view-post',
        { body: { post_id: id } }
    );

    if (error) {
        if (error.context) {
        console.error(
            'view-postの詳細エラー:',
            await error.context.clone().text()
        );
        }
        throw error;
    }

    return data;
}


// ── いいね・取り消し ──

async function togglePostLike(id, isLiked) {
  await initializeSupabase();

  const { data, error } =
    await supabaseClient.functions.invoke('like-post', {
      body: {
        post_id: id,
        action: isLiked ? 'unlike' : 'like'
      }
    });

  if (error) throw error;

  return data;
}


const POSTS_PER_PAGE = 4;

  let state = {
    filter: { type: null, value: null }, // { type: 'category'|'archive', value: string }
    page: 1,
    openId: null, // 開いている記事ID（URLハッシュ対応）
    openYears: null // アーカイブで開いている年（null = 初期状態：最新の年だけ開く）
  };

  // ── カテゴリ定義 ──
  const CATEGORIES = [
    { key: 'all',   label: '🗂️ すべて' },
    { key: 'game',  label: '🎮 ゲーム' },
    { key: 'up', label: '📺 アプデ' },
    { key: 'life',  label: '🌱 日常' },
    { key: 'make',  label: '🛠️ 創作' },
  ];

  // ── フィルタ済み記事取得 ──
  function filteredPosts() {
    let posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
    if (!state.filter.type) return posts;
    if (state.filter.type === 'category' && state.filter.value !== 'all') {
      posts = posts.filter(p => p.category === state.filter.value);
    }
    if (state.filter.type === 'archive') {
      const [y, m] = state.filter.value.split('-');
      posts = posts.filter(p => p.date.startsWith(`${y}-${m}`));
    }
    return posts;
  }

  // ── 記事一覧レンダリング ──
  function renderList() {
    const listEl  = document.getElementById('postsList');
    const viewEl  = document.getElementById('articleView');
    listEl.classList.remove('hidden');
    viewEl.classList.remove('visible');
    state.openId = null;
    history.replaceState(null, '', location.pathname);

    const posts = filteredPosts();
    const total = posts.length;
    const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
    state.page = Math.min(state.page, totalPages);

    const slice = posts.slice((state.page - 1) * POSTS_PER_PAGE, state.page * POSTS_PER_PAGE);

    if (slice.length === 0) {
      listEl.innerHTML = `
        <div class="no-results">
          <div class="no-results-emoji">🦖</div>
          <p>この条件に合う記事がまだないみたい…</p>
        </div>`;
    } else {
      listEl.innerHTML =
        slice.map((p, i) => postCardHTML(p, i)).join('') +
        paginationHTML(totalPages);

        // 一覧のいいね数・閲覧数を取得
        loadListStats(slice);
    }

    // カード → 記事詳細
    listEl.querySelectorAll('.post-read-more').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        openArticle(btn.dataset.id);
      });
    });

    // ページネーション
    listEl.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.page = parseInt(btn.dataset.page);
        renderList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function postCardHTML(p, i) {
    const tagClass = 'tag-' + p.category;

    return `
        <article class="post-card" style="animation-delay:${(i + 1) * 0.1}s">
        <div class="post-meta">
            <span class="post-date">${p.dateLabel}</span>
            <span class="post-tag ${tagClass}">${p.categoryLabel}</span>
        </div>

        <h2>${p.title}</h2>
        <p class="post-summary">${p.summary}</p>

        <div class="post-card-stats">
            <span>❤️ <span class="list-like-count">読み込み中...</span></span>
            <span>👁 <span class="list-view-count">読み込み中...</span></span>
        </div>

        <button class="post-read-more" data-id="${p.id}">
            続きを読む →
        </button>
        </article>`;
    }

  function paginationHTML(totalPages) {
    if (totalPages <= 1) return '';
    let btns = '';
    for (let i = 1; i <= totalPages; i++) {
      btns += `<button class="page-btn ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    btns += `<button class="page-btn" data-page="${Math.min(state.page + 1, totalPages)}" ${state.page >= totalPages ? 'disabled' : ''}>→</button>`;
    return `<div class="pagination">${btns}</div>`;
  }

  // ── いいね：データベース設定（SQLite・server.py のAPI） ──
  // server.py を動かしているURLをここに貼ると、いいねの数が SQLite（likes.db）に保存されて全員で共有されます。
  // 例: 'https://あなたのサーバー.example.com'
  // 空のままだと、このブラウザの localStorage に保存されます（動作確認用）。
  const LIKES_API_URL = '';

  const likeKey = id => 'likes_' + id;
  const likeApi = id => `${LIKES_API_URL.replace(/\/$/, '')}/api/likes/${encodeURIComponent(id)}`;
  const localLikes = id => parseInt(localStorage.getItem(likeKey(id))) || 0;

  // いいね数を取得
  async function fetchLikes(id) {
    if (!LIKES_API_URL) return localLikes(id);
    try {
      const res = await fetch(likeApi(id));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return typeof data.count === 'number' ? data.count : 0;
    } catch (e) {
      console.warn('いいね数の取得に失敗しました', e);
      return localLikes(id);
    }
  }

  // いいねを1つ増やす（サーバー側のSQLiteで +1 して、新しい数を返す）
  async function sendLike(id) {
    if (!LIKES_API_URL) {
      const n = localLikes(id) + 1;
      localStorage.setItem(likeKey(id), n);
      return n;
    }
    try {
      const res = await fetch(likeApi(id), { method: 'POST' });
      const data = await res.json();
      return typeof data.count === 'number' ? data.count : null;
    } catch (e) {
      console.warn('いいねの保存に失敗しました', e);
      return null;
    }
  }

  // ── いいねボタンHTML ──
function renderLikeButton() {
  return `
    <div class="post-stats">

      <div class="like-section">
        <button
          class="like-btn"
          id="likeBtn"
          aria-label="いいね"
          aria-pressed="false"
          disabled
        >
          <img
            src="assets/img/heart.png"
            alt=""
            class="like-heart-img"
          />
        </button>

        <span class="like-count" id="likeCount">読み込み中...</span>
      </div>

      <div class="view-section">
        <span>👁</span>
        <span id="viewCount">読み込み中...</span>
      </div>

    </div>
  `;
}

  // ── 記事詳細レンダリング ──
function openArticle(id) {
  const post = POSTS.find(
    p => String(p.id) === String(id)
  );

  if (!post) return;

  state.openId = id;

  document.getElementById('postsList').classList.add('hidden');

  const viewEl = document.getElementById('articleView');
  viewEl.classList.add('visible');

  const tagClass = 'tag-' + post.category;

  document.getElementById('articleHeader').innerHTML = `
    <div class="post-meta">
      <span class="post-date">${post.dateLabel}</span>
      <span class="post-tag ${tagClass}">
        ${post.categoryLabel}
      </span>
    </div>
    <h1>${post.title}</h1>
  `;

  document.getElementById('articleBody').innerHTML =
    post.body + renderLikeButton();

  // URL更新
  history.replaceState(null, '', `#${id}`);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── いいね・閲覧数の初期化 ──
    initializeArticleStats(post);
}


// ── 記事統計情報の初期化 ──

async function initializeArticleStats(post) {
  const dbId = getPostDbId(post);

  const likeBtn = document.getElementById('likeBtn');
  const likeEl = document.getElementById('likeCount');
  const viewEl = document.getElementById('viewCount');

  let isLiked = false;
  let likes = 0;
  let isProcessing = false;

  // 現在の記事かどうか確認
  const isCurrentArticle = () =>
    String(state.openId) === String(post.id);

  // 閲覧数を記録
  try {
    await recordPostView(dbId);
  } catch (error) {
    console.error('閲覧数の記録に失敗:', error);
  }

  if (!isCurrentArticle()) return;

  // 統計情報を取得
  try {
    const stats = await fetchPostStats(dbId);

    if (!isCurrentArticle()) return;

    likes = Number(stats.like ?? 0);
    isLiked = Boolean(stats.is_liked);

    likeEl.textContent = likes;
    viewEl.textContent = Number(stats.view ?? 0);

    likeBtn.classList.toggle('liked', isLiked);
    likeBtn.setAttribute('aria-pressed', String(isLiked));
    likeBtn.disabled = false;

    // いいねボタン
    likeBtn.addEventListener('click', async () => {
      if (isProcessing || !isCurrentArticle()) return;

      isProcessing = true;
      likeBtn.disabled = true;

      try {
        const result = await togglePostLike(dbId, isLiked);

        if (!isCurrentArticle()) return;
        likes = Number(result.like ?? 0);
        isLiked = !isLiked;

        likeEl.textContent = likes;

        likeBtn.classList.toggle('liked', isLiked);
        likeBtn.setAttribute('aria-pressed', String(isLiked));

        // アニメーション
        void likeBtn.offsetWidth;
        likeBtn.classList.add('liked');

      } catch (error) {
        console.error('いいねの更新に失敗:', error);
        alert('いいねの更新に失敗しました。');

      } finally {
        isProcessing = false;

        if (isCurrentArticle()) {
          likeBtn.disabled = false;
        }
      }
    });

  } catch (error) {
    console.error('記事統計情報の取得に失敗:', error);

    if (!isCurrentArticle()) return;

    likeEl.textContent = '取得失敗';
    viewEl.textContent = '取得失敗';
  }
}


  document.getElementById('articleBack').addEventListener('click', () => {
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── サイドバー: カテゴリ ──
  function renderTagCloud() {
    const el = document.getElementById('tagCloud');
    el.innerHTML = CATEGORIES.map(c => {
      const active = state.filter.type === 'category' && state.filter.value === c.key
                     || (c.key === 'all' && !state.filter.type);
      return `<button class="${active ? 'active' : ''}" data-cat="${c.key}">${c.label}</button>`;
    }).join('');
    el.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.cat === 'all' ? { type: null, value: null } : { type: 'category', value: btn.dataset.cat };
        state.page = 1;
        renderAll();
      });
    });
  }

  // ── サイドバー: アーカイブ（年ごとに折りたたみ） ──
  function renderArchive() {
    // 年月ごとに集計
    const map = {};      // "2026-05" -> 件数
    POSTS.forEach(p => {
      const ym = p.date.slice(0, 7);
      map[ym] = (map[ym] || 0) + 1;
    });
    // 年ごとにまとめる
    const yearMap = {};  // "2026" -> ["2026-12", "2026-11", ...]
    Object.keys(map).sort((a, b) => b.localeCompare(a)).forEach(ym => {
      const y = ym.slice(0, 4);
      (yearMap[y] = yearMap[y] || []).push(ym);
    });
    const years = Object.keys(yearMap).sort((a, b) => b.localeCompare(a));

    // 初期状態は最新の年だけ開く。絞り込み中の月がある年も開いておく
    if (state.openYears === null) state.openYears = new Set(years.length ? [years[0]] : []);
    if (state.filter.type === 'archive') state.openYears.add(state.filter.value.slice(0, 4));

    const el = document.getElementById('archiveList');
    el.innerHTML = years.map(y => {
      const months = yearMap[y];
      const total = months.reduce((sum, ym) => sum + map[ym], 0);
      const open = state.openYears.has(y);
      const monthBtns = months.map(ym => {
        const m = parseInt(ym.slice(5));
        const active = state.filter.type === 'archive' && state.filter.value === ym;
        return `<button class="archive-month-btn ${active ? 'active' : ''}" data-ym="${ym}">${m}月 <span class="archive-count">${map[ym]}</span></button>`;
      }).join('');
      return `
        <div class="archive-year ${open ? 'open' : ''}">
          <button class="archive-year-btn" data-year="${y}" aria-expanded="${open}">
            <span>📁 ${y}年</span>
            <span class="archive-year-right"><span class="archive-count">${total}</span><span class="archive-chev">▾</span></span>
          </button>
          <div class="archive-months">${monthBtns}</div>
        </div>`;
    }).join('');

    // 年の開閉
    el.querySelectorAll('.archive-year-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const y = btn.dataset.year;
        const wrap = btn.closest('.archive-year');
        const nowOpen = !wrap.classList.contains('open');
        wrap.classList.toggle('open', nowOpen);
        btn.setAttribute('aria-expanded', nowOpen);
        if (nowOpen) state.openYears.add(y); else state.openYears.delete(y);
      });
    });
    // 月で絞り込み
    el.querySelectorAll('.archive-month-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ym = btn.dataset.ym;
        state.filter = state.filter.value === ym ? { type: null, value: null } : { type: 'archive', value: ym };
        state.page = 1;
        renderAll();
      });
    });
  }

  function renderAll() {
    renderList();
    renderTagCloud();
    renderArchive();
  }

  // ── URLハッシュで直接記事を開く ──
  function handleHash() {
    const hash = location.hash.slice(1);
    if (hash && POSTS.find(p => p.id === hash)) {
      renderTagCloud();
      renderArchive();
      openArticle(hash);
    } else {
      renderAll();
    }
  }

  // ── Init ──
  handleHash();
  window.addEventListener('hashchange', handleHash);

  // ── Hamburger ──
  document.getElementById('hamburger').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });

  // ── 記事一覧の統計情報を取得 ──
async function loadListStats(posts) {
  try {
    // 匿名認証を初期化
    await initializeSupabase();

    const listEl = document.getElementById('postsList');

    // 表示中の記事カードを取得
    const cards = [...listEl.querySelectorAll('.post-card')];

    // 各記事の統計情報を取得
    await Promise.all(cards.map(async (card, index) => {
      const post = posts[index];

      if (!post) return;

      const likeEl = card.querySelector('.list-like-count');
      const viewEl = card.querySelector('.list-view-count');

      try {
        const stats = await fetchPostStats(getPostDbId(post));

        // ページ切り替えなどでカードが消えていたら更新しない
        if (!listEl.contains(card)) return;

        likeEl.textContent = Number(stats.like ?? 0);
        viewEl.textContent = Number(stats.view ?? 0);

      } catch (error) {
        console.error(
          `記事 ${post.id} の統計情報取得に失敗:`,
          error
        );

        if (!listEl.contains(card)) return;

        likeEl.textContent = '-';
        viewEl.textContent = '-';
      }
    }));

  } catch (error) {
    console.error('一覧統計情報の初期化に失敗:', error);
  }
}