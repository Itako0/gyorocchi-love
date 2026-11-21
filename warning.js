function redirectToWarning() {
  location.replace('warning.html');
}

// 右クリック
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  redirectToWarning();
}, true);

// キーボード操作
document.addEventListener('keydown', (e) => {
  const isDevTools =
    e.key === 'F12' ||

    // Windows
    (e.ctrlKey && e.shiftKey && e.code === 'KeyI') ||

    // Mac
    (e.metaKey && e.altKey && e.code === 'KeyI') ||

    // ソース表示
    (e.ctrlKey && e.code === 'KeyU') ||
    (e.metaKey && e.code === 'KeyU');

  if (isDevTools) {
    e.preventDefault();
    e.stopImmediatePropagation();
    redirectToWarning();
  }
}, true);