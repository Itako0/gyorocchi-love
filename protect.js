/* =============================================
   protect.js — 右クリック・開発者ツール関連のショートカットを無効にする
   ※ 簡易的な対策です。ブラウザのメニューや view-source: などからは見られます。
   使い方：各ページの </body> の前に
     <script src="protect.js"></script>
   を1行入れるだけ。
   ============================================= */
(function () {
  // 自分で作業するとき（ローカル・admin画面）は無効にしておく
  const host = location.hostname;
  const isLocal = host === '' || host === 'localhost' || host === '127.0.0.1';
  const isAdmin = new URLSearchParams(location.search).has('admin');
  if (isLocal || isAdmin) return;

  // 入力欄では右クリック・コピー等を普通に使えるようにする
  const isField = t => t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]');

  // 右クリックを禁止
  document.addEventListener('contextmenu', e => {
    if (!isField(e.target)) e.preventDefault();
  });

  // F12 / 開発者ツール / ソース表示のショートカットを禁止
  document.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    const blocked =
      e.key === 'F12' ||
      (ctrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||  // Win: Ctrl+Shift+I/J/C
      (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) || // Mac: Cmd+Option+I/J/C/U
      (e.ctrlKey && k === 'u');                                      // Win: Ctrl+U（ソース表示）
    if (blocked) e.preventDefault();
  });

  // 画像のドラッグ保存と、スマホの画像長押しメニューを抑える
  document.addEventListener('dragstart', e => {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });
  const st = document.createElement('style');
  st.textContent = 'img { -webkit-touch-callout: none; -webkit-user-drag: none; }';
  document.head.appendChild(st);
})();
