import { normalizeVocalDesign, vocalDesignFromProject } from './vocal-design.js';

let open = false;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function option(value, label, selected) {
  return `<option value="${value}"${selected ? ' selected' : ''}>${label}</option>`;
}

export function vocalDesignHtml(project) {
  const vocal = vocalDesignFromProject(project);
  const songType = vocal.isVocalSong === true ? 'yes' : vocal.isVocalSong === false ? 'no' : 'unknown';
  return `
    <button id="toggle-vocal-design" class="song-card-toggle" aria-expanded="${open}">🎤 歌詞 / Vocal設計${open ? ' ▲' : ' ▼'}</button>
    ${open ? `
      <section class="export-panel vocal-design-panel">
        <p class="hint">作曲段階の言葉・音域・仮歌準備だけを管理します。本歌録音・SynthV本制作・Vocal MixはPC DAW工程です。</p>
        <div class="form-stack">
          <label class="field"><span>歌もの</span><select id="vocal-song-type">
            ${option('unknown', '未決定', songType === 'unknown')}
            ${option('yes', '歌もの', songType === 'yes')}
            ${option('no', 'Instrumental', songType === 'no')}
          </select></label>
          <label class="field"><span>歌詞テーマ</span><input id="vocal-lyrics-theme" maxlength="500" value="${escapeHtml(vocal.lyricsTheme)}" placeholder="例: 夜の帰り道 / 前向きになりたい"></label>
          <label class="field"><span>言葉のイメージ</span><input id="vocal-lyrical-image" maxlength="500" value="${escapeHtml(vocal.lyricalImage)}" placeholder="例: 街灯 / 雨上がり"></label>
          <label class="field"><span>Vocalの方向</span><input id="vocal-direction" maxlength="500" value="${escapeHtml(vocal.direction)}" placeholder="例: Aメロは低く、サビで開放"></label>
          <div class="settings-grid">
            <label class="field"><span>最低音</span><input id="vocal-range-low" maxlength="20" value="${escapeHtml(vocal.range.low)}" placeholder="B3"></label>
            <label class="field"><span>最高音</span><input id="vocal-range-high" maxlength="20" value="${escapeHtml(vocal.range.high)}" placeholder="E5"></label>
          </div>
          <label class="field"><span>音域メモ</span><input id="vocal-range-note" maxlength="300" value="${escapeHtml(vocal.range.note)}" placeholder="サビだけ高め等"></label>
          <label class="field"><span>歌詞Draft</span><textarea id="vocal-lyrics-draft" rows="6" maxlength="6000" placeholder="仮歌詞や断片を自由に保存">${escapeHtml(vocal.lyricsDraft)}</textarea></label>
          <label class="field"><span>Phraseごとの歌詞 / Melodyとの当たり</span><textarea id="vocal-phrase-notes" rows="5" maxlength="4000" placeholder="例: A1 Bar1-2: 8音節 / 語尾をロングトーン">${escapeHtml(vocal.phraseNotes)}</textarea></label>
          <label class="field"><span>音節メモ</span><textarea id="vocal-syllable-notes" rows="3" maxlength="2000" placeholder="例: サビ1行目 7-8-7音節">${escapeHtml(vocal.syllableNotes)}</textarea></label>
          <label class="field"><span>仮歌 / SynthV引き継ぎメモ</span><textarea id="vocal-synthv-notes" rows="3" maxlength="2000" placeholder="発音・ブレス・歌い回し等">${escapeHtml(vocal.synthVNotes)}</textarea></label>
        </div>
        <div class="actions">
          <button id="save-vocal-design" class="primary-action" type="button">歌詞 / Vocal設計を保存</button>
          <button id="clear-vocal-design" type="button">歌詞 / Vocal設計をクリア</button>
        </div>
      </section>` : ''}
  `;
}

function value(id) {
  return document.querySelector(id)?.value ?? '';
}

function readForm() {
  const type = value('#vocal-song-type');
  return normalizeVocalDesign({
    isVocalSong: type === 'yes' ? true : type === 'no' ? false : null,
    lyricsTheme: value('#vocal-lyrics-theme'),
    lyricalImage: value('#vocal-lyrical-image'),
    direction: value('#vocal-direction'),
    range: {
      low: value('#vocal-range-low'),
      high: value('#vocal-range-high'),
      note: value('#vocal-range-note'),
    },
    lyricsDraft: value('#vocal-lyrics-draft'),
    phraseNotes: value('#vocal-phrase-notes'),
    syllableNotes: value('#vocal-syllable-notes'),
    synthVNotes: value('#vocal-synthv-notes'),
  });
}

export function bindVocalDesign({ projectStore, setMessage, rerender }) {
  document.querySelector('#toggle-vocal-design')?.addEventListener('click', () => {
    open = !open;
    rerender();
  });

  document.querySelector('#save-vocal-design')?.addEventListener('click', () => {
    try {
      projectStore.updateHub({ metadata: { vocal: readForm() } });
      setMessage('歌詞 / Vocal設計を保存しました。PC DAWへ渡す前の作曲メモとして保持します。');
      rerender();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '歌詞 / Vocal設計を保存できませんでした。', true);
    }
  });

  document.querySelector('#clear-vocal-design')?.addEventListener('click', () => {
    if (!globalThis.confirm('歌詞 / Vocal設計メモを空にしますか？（↶で戻せます）')) return;
    try {
      projectStore.updateHub({ metadata: { vocal: normalizeVocalDesign(null) } });
      setMessage('歌詞 / Vocal設計をクリアしました。↶で戻せます。');
      rerender();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '歌詞 / Vocal設計をクリアできませんでした。', true);
    }
  });
}
