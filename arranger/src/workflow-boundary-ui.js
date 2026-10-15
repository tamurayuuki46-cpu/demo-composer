import './song-data-menu-entry.js';

function clarifyForkAction() {
  const button = document.querySelector('#demo-return-btn');
  if (!button) return false;
  button.textContent = '新しい作曲ProjectとしてFork';
  button.title = '元のDemo Composer Projectは上書きせず、新しいProject IDで複製を書き出します。';

  const block = button.closest('#v05-daw-actions');
  if (block && !block.querySelector('[data-fork-boundary-note]')) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.dataset.forkBoundaryNote = 'true';
    note.textContent = 'Forkは元Compositionを上書きしません。採用した編曲を「新しい作曲案」としてDemo Composerで続けたい場合だけ使います。通常の出口はDAW引き継ぎZIPです。';
    block.append(note);
  }
  return true;
}

function init() {
  if (clarifyForkAction()) return;
  const observer = new MutationObserver(() => {
    if (clarifyForkAction()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
