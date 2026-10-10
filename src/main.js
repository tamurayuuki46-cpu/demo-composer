const screens = {
  hub: `
    <section class="card">
      <h2>Hub</h2>
      <p>曲全体の基本情報と進捗を管理します。</p>
      <div class="grid">
        <div class="metric"><span>BPM</span><strong>120</strong></div>
        <div class="metric"><span>Key</span><strong>C</strong></div>
        <div class="metric"><span>Scale</span><strong>Major</strong></div>
      </div>
      <div class="actions">
        <button disabled>Save</button>
        <button disabled>Export</button>
        <button disabled>AI相談</button>
      </div>
    </section>
  `,
  chord: `
    <section class="card">
      <h2>Chord</h2>
      <p>コード名 + Degree を見ながら進行を作る画面です。</p>
      <div class="progression">
        <div class="chord-card"><strong>C</strong><span>I</span></div>
        <div class="chord-card"><strong>G</strong><span>V</span></div>
        <div class="chord-card"><strong>Am</strong><span>vi</span></div>
        <div class="chord-card"><strong>F</strong><span>IV</span></div>
      </div>
      <p class="hint">※ 現在はUIサンプルです。</p>
    </section>
  `,
  melody: `
    <section class="card">
      <h2>Melody</h2>
      <p>スマホ向け簡易Piano Rollをここに実装します。</p>
      <div class="placeholder">Piano Roll v0.1</div>
      <p class="hint">コードトーン表示とAnalyzerは後続実装です。</p>
    </section>
  `,
  rhythm: `
    <section class="card">
      <h2>Rhythm</h2>
      <p>BassとKickを同時に確認できる構成を優先します。</p>
      <div class="placeholder">16 Step Sequencer v0.1</div>
      <p class="hint">Kick / Snare / Hi-Hat / Bass を実装予定。</p>
    </section>
  `
};

const screen = document.querySelector("#screen");
const buttons = [...document.querySelectorAll(".nav-btn")];

function render(name) {
  screen.innerHTML = screens[name];
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === name);
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", () => render(button.dataset.screen));
});

render("hub");
