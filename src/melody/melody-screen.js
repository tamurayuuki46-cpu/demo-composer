import { createDecisionComparison } from "../core/decision-comparison.js";
import { getSections, MAX_TOTAL_BARS, sectionLabel, totalSectionBars } from "../core/section-ops.js";
import { chordSymbol, rootToPitchClass } from "../chord/chord-theory.js";
import { analyzeMelody, barsUsingChordDegree, describeMelody, pitchLabel } from "../core/melody-analysis.js";
import { compareSections, contrastHints } from "../core/section-compare.js";
import { applyPeakGuide, buildPeakGuide, currentPeak, defaultPeakBar, PEAK_SHAPES } from "./peak-guide.js";
import { chordRole } from "../chord/chord-role.js";
import { LENGTH_STEPS, noteValueLabel } from "../core/note-placement.js";
import { requestAudition } from "../audio/audition.js";
import { createMelodyComparison, comparisonIsCurrent, comparisonNotes, comparisonPreview } from "../core/melody-comparison.js";
import { sliceProject } from "../core/section-ops.js";
import { applyMelodyCandidate, melodyCandidateDots, melodyCandidatesForBar, MELODY_CANDIDATE_VARIATION_COUNT } from "./melody-candidates.js";
import { clearBar, copyMelodyBars, getMelodyNotes, getOctavePitches, degreeLabel, keyDegreeLabel, hasMelodyInBars, pitchName, toggleMonophonicStep } from "./melody-grid.js";
import { counterNotes } from "../core/counter-melody.js";
import { pitchClassRoles, pitchRoleText } from "./pitch-roles.js";

const EIGHTH_LABELS = ["1", "&", "2", "&", "3", "&", "4", "&"];
const SIXTEENTH_LABELS = ["1", "e", "&", "a", "2", "e", "&", "a", "3", "e", "&", "a", "4", "e", "&", "a"];
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pianoKeyClass(pitch) {
  return BLACK_PITCH_CLASSES.has(pitch % 12) ? "black" : "white";
}

export function createMelodyController({ projectStore, rerender, onStop = () => {}, onBeginComparison = () => {} }) {
  let comparison = null;
  let lastHeard = "";
  let adoptionReason = "";
  function cancelComparison() {
    if (comparison) onStop();
    comparison = null;
    adoptionReason = "";
    lastHeard = "";
  }
  projectStore.subscribe((project) => {
    if (comparison && !comparisonIsCurrent(comparison, project)) {
      cancelComparison();
      message = "曲が変更されたためA/B比較を閉じました。候補から比較をやり直せます。";
    }
  });
  let barIndex = 0;
  let octave = 4;
  // 入力単位はUI状態のみ。project.jsonには保存しない（Noteはtickで保持するためSchema変更なし）
  let resolution = 8;
  let half = 0;
  // 次に置く音の長さ（マス数）。UI状態のみで、project.jsonには保存しない
  let lengthSteps = 1;
  // 度数表示（UI状態のみ）。鍵盤の文字を、音名ではなく「コードのルートから何度か」にする
  let showDegrees = true;
  // 特徴パネルの開閉（UI状態のみ）
  let analyzerOpen = false;
  // 山の位置パネルの開閉・山の小節（nullなら既定値）・形（UI状態のみ）
  let peakOpen = false;
  let peakBar = null;
  let peakShapeId = "rise";
  // Melody候補の別案番号。UI状態だけで、選んだ結果以外はproject.jsonへ保存しない
  let candidateVariation = 0;
  // 編集するトラック（UI状態のみ）。"melody"=メイン / "counter"=裏メロ。同じPiano Rollで両方を手直しできる
  let editTrack = "melody";
  let message = "セルをタップして8分音符を入力します。";

  const isCounter = () => editTrack === "counter";
  const readNotes = (project) => (isCounter() ? counterNotes(project) : getMelodyNotes(project));
  // 裏メロは、全小節ぶんの範囲置き換えとして書く（Undoは1手・他のTrackには触れない）
  const writeNotes = (notes) => (isCounter()
    ? projectStore.applyCounterMelody({ startBar: 0, endBar: MAX_TOTAL_BARS + 1, notes })
    : projectStore.updateMelodyNotes(notes));
  const trackName = () => (isCounter() ? "裏メロ" : "メロディ");

  function stepTickSize(barTicks) {
    return barTicks / resolution;
  }

  // 画面に出す8マス分の「小節内step番号」。8分=全8、16分=半小節ずつ（タップ幅を確保するため）
  function visibleStepNumbers() {
    return resolution === 8
      ? Array.from({ length: 8 }, (_, step) => step)
      : Array.from({ length: 8 }, (_, step) => half * 8 + step);
  }

  function stepLabel(step) {
    return resolution === 8 ? EIGHTH_LABELS[step] : SIXTEENTH_LABELS[step];
  }

  function isBeatStart(step) {
    return step % (resolution === 8 ? 2 : 4) === 0;
  }

  function metrics(project) {
    const barTicks = project.basic.ppq * 4;
    const highestNoteBar = getMelodyNotes(project).reduce(
      (highest, note) => Math.max(highest, Math.floor(note.startTick / barTicks)),
      -1
    );

    return {
      barTicks,
      stepTicks: stepTickSize(barTicks),
      barCount: Math.max(project.chords.length, highestNoteBar + 1, totalSectionBars(getSections(project)), 4)
    };
  }

  // Melody Analyzer: 評価ではなく、自分のメロディの特徴を知るためのパネル（Melody Moduleの内部）
  // 度数ごとの使用率を12本の棒で見せる（棒の下に度数、上に%）
  const ROLE_ORDER = ["chord", "tension", "other", "outside"];
  function stackedParts(parts, total) {
    return ROLE_ORDER.filter((role) => parts?.[role] > 0)
      .map((role) => `<u class="role-${role}" style="flex:${parts[role]}"></u>`).join("") || (total ? "" : "");
  }
  function degreeBarsHtml(bars, { legend = true, jump = false } = {}) {
    const max = Math.max(...bars.map((bar) => bar.rate), 0.01);
    const hasParts = bars.some((bar) => bar.parts);
    const tag = jump ? "button" : "div";
    return `<div class="degree-bars"${jump ? "" : ' role="img"'} aria-label="度数ごとの使用率">${bars.map((bar, index) => `
      <${tag}${jump ? ` type="button" data-degree-jump="${index}"${bar.count ? "" : " disabled"} aria-label="${escapeHtml(bar.label)}を使う小節へ移動"` : ""} class="degree-bar${bar.count ? "" : " zero"}">
        <em>${bar.count ? Math.round(bar.rate * 100) : ""}</em>
        <i style="height:${Math.round((bar.rate / max) * 100)}%">${bar.parts ? stackedParts(bar.parts, bar.count) : ""}</i>
        <b>${escapeHtml(bar.label)}</b>
      </${tag}>`).join("")}</div>
      ${jump ? `<p class="hint">棒をタップすると、その度数を使っている小節へ移動します（Chordからの度数のみ）。</p>` : ""}
      ${hasParts && legend ? `<p class="degree-legend"><span class="role-chord">構成音</span><span class="role-tension">テンション</span><span class="role-other">スケール内</span><span class="role-outside">スケール外</span></p>` : ""}`;
  }
  // Sectionごとの小さな度数バー（ラベル・%なし）
  function miniDegreeBarsHtml(chordDegrees) {
    const max = Math.max(...chordDegrees.rates, 0.01);
    return `<div class="degree-mini" aria-hidden="true">${chordDegrees.degrees.map((d, i) => {
      const total = d.chord + d.tension + d.outside + d.other;
      return `<div class="degree-mini-col"><i style="height:${Math.round((chordDegrees.rates[i] / max) * 100)}%">${stackedParts(d, total)}</i></div>`;
    }).join("")}</div>`;
  }

  function analyzerPanelHtml(project) {
    const rows = describeMelody(analyzeMelody(project));
    if (rows.length === 0) return `<div class="analyzer-panel"><p class="hint">メロディを入力すると、特徴が表示されます。</p></div>`;
    return `
      <div class="analyzer-panel">
        ${rows.map((row) => `
          <div class="analyzer-row">
            <strong>${escapeHtml(row.label)}</strong>
            <span>${escapeHtml(row.value)}</span>
            ${row.bars ? degreeBarsHtml(row.bars, { jump: row.id === "chord-degree" }) : ""}
            ${row.comment ? `<small>${escapeHtml(row.comment)}</small>` : ""}
          </div>
        `).join("")}
        <p class="hint">良い・悪いの評価ではなく、いまのメロディの特徴です。曲全体のメロディを数えています。</p>
        ${sectionCompareHtml(project)}
      </div>
    `;
  }

  // Sectionごとの比べ: AメロとサビのSectionの差（音域・音数・リズム密度）を並べて、「差が足りない」に気づく。
  function sectionCompareHtml(project) {
    const rows = compareSections(project);
    if (rows.length === 0) {
      return `<div class="section-compare"><h4>Sectionごとの比べ</h4><p class="hint">Arrangeで曲の構成を作ると、AメロとサビなどをSectionごとに比べられます。</p></div>`;
    }
    const withNotes = rows.filter((row) => row.range);
    const scaleLow = withNotes.length ? Math.min(...withNotes.map((row) => row.range.low)) : 0;
    const scaleHigh = withNotes.length ? Math.max(...withNotes.map((row) => row.range.high)) : 1;
    const scaleSpan = Math.max(scaleHigh - scaleLow, 1);
    const maxDensity = Math.max(...rows.map((row) => row.density), 1);
    const hints = contrastHints(rows);

    return `
      <div class="section-compare">
        <h4>Sectionごとの比べ</h4>
        ${rows.map((row) => `
          <div class="sc-row">
            <strong>${escapeHtml(row.name)} <small>Bar ${row.startBar + 1}–${row.endBar}</small></strong>
            ${row.range ? `
              <div class="sc-track" aria-hidden="true"><span style="left:${((row.range.low - scaleLow) / scaleSpan) * 100}%;width:${Math.max((row.range.span / scaleSpan) * 100, 3)}%"></span></div>
              <span>音域 ${escapeHtml(pitchLabel(row.range.low))}〜${escapeHtml(pitchLabel(row.range.high))}（${row.range.span}半音）</span>
              <div class="sc-bar" aria-hidden="true"><span style="width:${(row.density / maxDensity) * 100}%"></span></div>
              <span>音数 ${row.noteCount}音 ・ 1小節あたり ${row.density.toFixed(1)}音</span>
              ${row.chordDegrees ? `<span class="sc-degree-label">コード度数（R ♭2 2 ♭3 3 4 ♭5 5 ♭6 6 ♭7 7）</span>${miniDegreeBarsHtml(row.chordDegrees)}` : ""}
            ` : `<span class="sc-empty">メロディなし</span>`}
          </div>
        `).join("")}
        ${hints ? `
          <div class="sc-hints${hints.lacking ? " lacking" : ""}">
            <strong>${escapeHtml(hints.target)} と ${escapeHtml(hints.ref)} の差</strong>
            <ul>${hints.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
            <p>${escapeHtml(hints.advice)}</p>
          </div>
        ` : `<p class="hint">サビと、その前のAメロ / Bメロの両方にメロディがあると、差を見られます。</p>`}
      </div>
    `;
  }

  // 山の位置から作る: 最高音を置く小節と形を選ぶと、そこへ向かう目安の音（各小節のコード構成音）を出す。
  function peakPanelHtml(project, barCount) {
    const toggle = `<button id="melody-peak-toggle" class="analyzer-toggle" aria-expanded="${peakOpen}">⛰ 山の位置から作る${peakOpen ? " ▲" : " ▼"}</button>`;
    if (!peakOpen) return toggle;

    const maxBar = Math.max(barCount - 1, 0);
    const bar = Math.min(peakBar ?? defaultPeakBar(project), maxBar);
    const guide = buildPeakGuide(project, { peakBar: bar, shapeId: peakShapeId });
    const now = currentPeak(project);
    return `
      ${toggle}
      <div class="analyzer-panel peak-panel">
        <p class="hint">サビの最高音（山）をどの小節に置くかを先に決めて、そこへ向かう目安を出します。${now ? `いまの最高音は Bar ${now.bar + 1}（${escapeHtml(pitchLabel(now.pitch))}）です。` : ""}</p>
        <div class="peak-bar-row">
          <button id="melody-peak-prev" aria-label="山を前の小節へ"${bar <= 0 ? " disabled" : ""}>← Bar</button>
          <strong>山: Bar ${bar + 1}</strong>
          <button id="melody-peak-next" aria-label="山を次の小節へ"${bar >= maxBar ? " disabled" : ""}>Bar →</button>
        </div>
        <div class="peak-shapes" role="group" aria-label="山の形">
          ${PEAK_SHAPES.map((shape) => `
            <button class="peak-shape${shape.id === peakShapeId ? " active" : ""}" data-peak-shape="${shape.id}" aria-pressed="${shape.id === peakShapeId}">
              <strong>${escapeHtml(shape.label)}</strong>
              <small>${escapeHtml(shape.description)}</small>
            </button>
          `).join("")}
        </div>
        <ol class="peak-list">
          ${guide.bars.map((item) => `<li class="${item.role}">Bar ${item.bar + 1}: ${escapeHtml(pitchLabel(item.pitch))}（${escapeHtml(item.chordText)}）${item.role === "peak" ? " ★山" : item.role === "after" ? " 余韻" : ""}</li>`).join("")}
        </ol>
        <button class="primary" id="melody-peak-apply">目安の音を置く（空の小節だけ）</button>
        <p class="hint">置くのは各小節に1音ずつの目安です。入力済みの小節は変えません。置いたあと、Piano Rollで音を足して歌にしていきます（↶で戻せます）。</p>
      </div>`;
  }

  function render() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    barIndex = Math.min(barIndex, barCount - 1);
    if (comparison && (isCounter() || comparison.barIndex !== barIndex)) cancelComparison();

    const notes = readNotes(project);
    // 裏メロを直すときは、メインのメロディを薄い目印として重ねて見せる（ぶつかりを目で確かめる）
    const refNotes = isCounter() ? getMelodyNotes(project) : [];
    const tonicPcForGrid = rootToPitchClass(project.basic.key);
    const pitches = getOctavePitches(octave, tonicPcForGrid);
    const rangeLabel = `${pitchName(pitches[pitches.length - 1])}–${pitchName(pitches[0])}`;
    const visibleSteps = visibleStepNumbers();
    const barStartTick = barIndex * barTicks;
    const chord = project.chords[barIndex];
    const role = chordRole(chord, { key: project.basic.key, scale: project.basic.scale });
    const chordLabel = chord ? `${chordSymbol(chord.root, chord.quality)} (${chord.degree}・${role.label})` : "コード未設定";
    // 度数の基準: コードがあればそのルート、なければKeyの主音
    const tonicPc = rootToPitchClass(project.basic.key);

    // コピーできるか: コピー元にメロディがあり、コピー先が最大小節数(128)に収まる
    const canCopy = (bars) => hasMelodyInBars(notes, { barIndex, bars, barTicks })
      && barIndex + bars * 2 <= MAX_TOTAL_BARS;

    const pitchRoles = pitchClassRoles({ key: project.basic.key, scale: project.basic.scale, chord });
    const melodyCandidates = melodyCandidatesForBar(project, barIndex, { octave, variation: candidateVariation });

    const gridRows = pitches.map((pitch) => {
      const name = pitchName(pitch);
      const keyClass = pianoKeyClass(pitch);

      const pitchRole = pitchRoles[pitch % 12];
      const roleClass = [
        pitchRole.avoid ? " role-avoid" : "",
        pitchRole.tone ? ` role-${pitchRole.tone}` : "",
        pitchRole.outside ? " role-outside" : ""
      ].join("");
      const roleText = pitchRoleText(pitchRole);
      return `
        <div class="melody-row${roleClass}">
          <span class="piano-key ${keyClass}" aria-hidden="true">${showDegrees
            ? `<span class="pk-name">${escapeHtml(name)}</span><span class="pk-deg"><b class="pk-chord">${chord ? escapeHtml(degreeLabel(pitch, chord.root)) : "–"}</b><b class="pk-key">${escapeHtml(keyDegreeLabel(pitch, tonicPc))}</b></span>`
            : escapeHtml(name)}</span>
          ${visibleSteps.map((step) => {
            const startTick = barStartTick + step * stepTicks;
            const active = notes.some((note) => note.startTick === startTick && note.pitch === pitch);
            // 8分表示のとき、このマスの後半(16分位置)にも同じ高さの音があれば印を付ける
            // 長い音の途中のマス（前のマスから伸びている部分）
            const held = !active && notes.some((note) => note.pitch === pitch && note.startTick < startTick && note.startTick + note.durationTick > startTick);
            const ref = !active && !held && refNotes.some((note) => note.pitch === pitch && note.startTick <= startTick && note.startTick + note.durationTick > startTick);
            const hasSub = resolution === 8 && notes.some((note) => note.startTick === startTick + stepTicks / 2 && note.pitch === pitch);
            const beatStartClass = isBeatStart(step) ? " beat-start" : "";
            return `<button class="note-cell${beatStartClass}${active ? " active" : ""}${held ? " held" : ""}${ref ? " ref" : ""}${hasSub ? " has-sub" : ""}" data-melody-pitch="${pitch}" data-melody-step="${step}" aria-label="${escapeHtml(name)} ${stepLabel(step)}${roleText ? `（${roleText}）` : ""}">${active && showDegrees && chord ? `<span class="note-degree">${escapeHtml(degreeLabel(pitch, chord.root))}</span>` : ""}</button>`;
          }).join("")}
        </div>
      `;
    }).join("");

    return `
      <section class="card melody-card">
        <div class="section-heading">
          <div>
            <h2>${isCounter() ? "Melody ・ 裏メロ" : "Melody"}</h2>
            <p>Bar ${barIndex + 1} / ${barCount} ・ ${escapeHtml(chordLabel)}${sectionLabel(project, barIndex) ? ` ・ ${escapeHtml(sectionLabel(project, barIndex))}` : ""}</p>
          </div>
          <button id="clear-melody-bar" class="small-action">Clear Bar</button>
        </div>
        <div class="melody-mode-switch melody-track-switch" role="group" aria-label="直すパート">
          <button data-melody-track="melody" class="${isCounter() ? "" : "active"}" aria-pressed="${!isCounter()}">メイン</button>
          <button data-melody-track="counter" class="${isCounter() ? "active" : ""}" aria-pressed="${isCounter()}">裏メロ</button>
        </div>
        ${isCounter() ? `<p class="hint counter-edit-hint">${notes.length > 0 ? "裏メロを直しています。薄い青のマスは、メインのメロディが鳴っている所です。重ならない高さ・休む場所を選ぶと聞き分けやすくなります。" : "裏メロはまだありません。Arrangeの「裏メロ」で候補を選ぶか、ここで1音ずつ入力できます。"}</p>` : ""}
        <div class="melody-legend-row">
          <ul class="pitch-legend" aria-label="色の意味">
            ${chord ? `<li><span class="pitch-dot role-chord" aria-hidden="true"></span>コード構成音</li>
            <li><span class="pitch-dot role-tension" aria-hidden="true"></span>テンション</li>` : ""}
            <li><span class="pitch-dot role-outside" aria-hidden="true"></span>スケール外</li>
            ${chord ? `<li><span class="pitch-dot role-avoid" aria-hidden="true"></span>アボイド</li>` : ""}
          </ul>
          <button id="melody-degree-toggle" class="degree-toggle${showDegrees ? " active" : ""}" aria-pressed="${showDegrees}">${showDegrees ? "度数 ON" : "度数 OFF"}</button>
        </div>
        ${showDegrees ? `<p class="hint degree-hint">鍵盤は「音名」の下に、<b class="pk-chord">${chord ? "コード度数" : "コード未設定（–）"}</b>（コードのルートから。R=ルート、3=3度、5=5度）と <b class="pk-key">Key度数</b>（${escapeHtml(project.basic.key)}の主音から。1=主音）を並べて表示します。</p>` : ""}

        ${isCounter() ? "" : `<section class="melody-candidate-panel" aria-label="メロディ候補">
          <div class="melody-candidate-heading">
            <div>
              <strong>メロディ候補</strong>
              <small>Bar ${barIndex + 1} の叩き台を3つ</small>
            </div>
            <div>
              <small>${rangeLabel} ・ ${candidateVariation + 1}/${MELODY_CANDIDATE_VARIATION_COUNT}</small>
              <button type="button" id="melody-candidate-refresh" class="small-action" aria-label="Bar ${barIndex + 1} のメロディ候補を更新">↻ 候補を更新</button>
            </div>
          </div>
          <div class="melody-candidate-list">
            ${melodyCandidates.map((candidate) => `
              <div class="melody-candidate-item">
                <button type="button" data-melody-candidate="${candidate.id}" aria-label="${escapeHtml(candidate.label)}をBar ${barIndex + 1}へ適用">
                  <strong>${escapeHtml(candidate.label)}</strong>
                  <small>${escapeHtml(candidate.description)}</small>
                  <span class="melody-candidate-dots" aria-hidden="true">${escapeHtml(melodyCandidateDots(candidate))}</span>
                </button>
                <button type="button" class="melody-candidate-play audition-btn" data-melody-candidate-play="${candidate.id}" aria-label="${escapeHtml(candidate.label)}を聴く">▶ 聴く</button>
                <button type="button" class="melody-compare-start" data-melody-compare="${candidate.id}">現在案とA/B比較</button>
              </div>
            `).join("")}
          </div>
          <p class="hint">候補を選ぶと現在の1小節だけ置き換えます。「候補を更新」で別案に切り替えられます。選んだ後は下のPiano Rollで1音ずつ直せます（↶ で戻せます）。</p>
          ${comparison ? `<section class="melody-ab-panel" aria-label="主旋律のA/B比較">
            <strong>Bar ${comparison.barIndex + 1} のA/B比較</strong>
            <p>A: 現在案（${comparison.diff.a}音） / B: ${escapeHtml(comparison.label)}（${comparison.diff.b}音）</p>
            <p class="hint">同じ音 ${comparison.diff.unchanged}個・取り除く音 ${comparison.diff.removed}個・加える音 ${comparison.diff.added}個（音高・位置・長さ・強さで比較）。他の小節・伴奏・音色は変えません。</p>
            <div class="melody-ab-actions">
              <button data-melody-ab-play="A" aria-pressed="${lastHeard === "A"}">▶ Aを聴く</button>
              <button data-melody-ab-play="B" aria-pressed="${lastHeard === "B"}">▶ Bを聴く</button>
              <button id="melody-ab-keep">Aを採用（現在案を保持）</button>
              <button id="melody-ab-adopt" ${comparison.diff.added + comparison.diff.removed === 0 ? "disabled" : ""}>Bを採用</button>
            </div>
            <label class="field"><span>採用理由（任意の1行）</span><input id="melody-ab-reason" maxlength="200" value="${escapeHtml(adoptionReason)}"></label>
            <button id="melody-ab-cancel" class="small-action">比較を閉じる</button>
            <p class="hint">試聴だけでは保存しません。Bの採用は↶で1回戻せます。${lastHeard ? `最後に聴いた案: ${lastHeard}。` : ""}比較は再読み込みで消えます。</p>
          </section>` : ""}
        </section>`}

        <div class="melody-toolbar">
          <button id="melody-prev-bar"${barIndex === 0 ? " disabled" : ""}>← Bar</button>
          <span>Bar ${barIndex + 1}</span>
          <button id="melody-next-bar"${barIndex >= barCount - 1 ? " disabled" : ""}>Bar →</button>
        </div>

        <div class="melody-toolbar">
          <button id="melody-octave-down"${octave <= 2 ? " disabled" : ""}>Oct −</button>
          <span>${rangeLabel}</span>
          <button id="melody-octave-up"${octave >= 6 ? " disabled" : ""}>Oct +</button>
        </div>

        <div class="melody-mode-switch" role="group" aria-label="入力する音符の細かさ">
          <button data-melody-resolution="8" class="${resolution === 8 ? "active" : ""}">8分音符</button>
          <button data-melody-resolution="16" class="${resolution === 16 ? "active" : ""}">16分音符</button>
        </div>

        <div class="note-length" role="group" aria-label="入れる音の長さ">
          <span>音の長さ</span>
          <div class="note-length-buttons">
            ${LENGTH_STEPS.map((steps) => `<button data-melody-length="${steps}" class="${steps === lengthSteps ? "active" : ""}">${noteValueLabel(steps * stepTicks, project.basic.ppq)}</button>`).join("")}
          </div>
        </div>

        ${resolution === 16 ? `
        <div class="melody-mode-switch" role="group" aria-label="小節の前半 / 後半">
          <button data-melody-half="0" class="${half === 0 ? "active" : ""}">前半 1–2拍</button>
          <button data-melody-half="1" class="${half === 1 ? "active" : ""}">後半 3–4拍</button>
        </div>` : ""}

        <div class="melody-grid${showDegrees ? " degrees-on" : ""}" aria-label="縦ピアノ付き${resolution === 8 ? "8" : "16"}分音符メロディグリッド">
          <div class="melody-row melody-header">
            <span class="piano-key-spacer" aria-hidden="true"></span>
            ${visibleSteps.map((step) => `<span class="${isBeatStart(step) ? "beat-start" : ""}">${stepLabel(step)}</span>`).join("")}
          </div>
          ${gridRows}
        </div>

        <div class="melody-secondary-actions">
          <button id="copy-melody-bar"${canCopy(1) ? "" : " disabled"}>Copy Bar → Bar ${barIndex + 2}</button>
          <button id="copy-melody-2bars"${canCopy(2) ? "" : " disabled"}>Copy 2小節 → Bar ${barIndex + 3}–${barIndex + 4}</button>
        </div>

        ${isCounter() ? "" : `${peakPanelHtml(project, barCount)}
        <button id="melody-analyzer-toggle" class="analyzer-toggle" aria-expanded="${analyzerOpen}">メロディの特徴${analyzerOpen ? " ▲" : " ▼"}</button>
        ${analyzerOpen ? analyzerPanelHtml(project) : ""}`}

        <p class="status-message" aria-live="polite">${escapeHtml(message)}</p>
        <p class="hint">${resolution === 8
          ? "1小節を 1 &amp; 2 &amp; 3 &amp; 4 &amp; の8マスで表示します。"
          : "16分音符は半小節ずつ（1 e &amp; a 2 e &amp; a）表示します。前半 / 後半ボタンで切り替えます。"}左の縦ピアノを音程の目印にして入力し、同じ位置では1音だけ入力します。長い音は「音の長さ」を選んでからタップします（小節の終わりと次の音の手前までに収まります）。長さを変えるときは、別の長さを選んで同じマスをタップします。同じ長さでタップすると削除です。8分表示で下に太線があるマスは、その後半に16分音符があります。</p>
      </section>
    `;
  }

  function bind() {
    const project = projectStore.getSnapshot();
    const { barTicks, stepTicks, barCount } = metrics(project);
    const barStartTick = barIndex * barTicks;
    const melodyCandidates = melodyCandidatesForBar(project, barIndex, { octave, variation: candidateVariation });

    document.querySelectorAll("[data-melody-compare]").forEach((button) => {
      button.addEventListener("click", () => {
        const candidate = melodyCandidates.find((item) => item.id === button.dataset.melodyCompare);
        if (!candidate) return;
        onBeginComparison();
        cancelComparison();
        const latest = projectStore.getSnapshot();
        comparison = createMelodyComparison(latest, barIndex,
          applyMelodyCandidate(getMelodyNotes(latest), barIndex, candidate, { barTicks }), candidate.label);
        message = "Aは現在案、Bは候補です。聴き比べてから採用できます。";
        rerender("melody");
        document.querySelector(".melody-ab-panel")?.scrollIntoView({ block: "nearest" });
      });
    });
    document.querySelectorAll("[data-melody-ab-play]").forEach((button) => {
      button.addEventListener("click", () => {
        const session = comparison;
        if (!session) return;
        const choice = button.dataset.melodyAbPlay;
        requestAudition({ label: `${choice}: Bar ${session.barIndex + 1} ${choice === "A" ? "現在案" : session.label}`,
          build: (latest) => comparisonPreview(session, latest, choice) });
        lastHeard = choice;
        rerender("melody");
      });
    });
    const finishComparison = () => {
      cancelComparison();
      message = "現在案を保持しました。曲は変更していません。";
      rerender("melody");
    };
    document.querySelector("#melody-ab-keep")?.addEventListener("click", () => {
      if (comparison && adoptionReason.trim()) {
        const latest = projectStore.getSnapshot();
        const { barIndex: from, barTicks: ticks, label } = comparison;
        const session = createDecisionComparison(latest, { kind: "melody", startBar: from, endBar: from + 1, label,
          data: comparisonNotes(comparison, latest).filter(note => note.startTick >= from * ticks && note.startTick < (from + 1) * ticks) });
        projectStore.keepDecision(session, adoptionReason);
      }
      finishComparison();
    });
    document.querySelector("#melody-ab-cancel")?.addEventListener("click", finishComparison);
    document.querySelector("#melody-ab-reason")?.addEventListener("input", event => { adoptionReason = event.target.value; });
    document.querySelector("#melody-ab-adopt")?.addEventListener("click", () => {
      if (!comparison) return;
      try {
        const latest = projectStore.getSnapshot();
        const notes = comparisonNotes(comparison, latest);
        const { barIndex: from, barTicks: ticks, label } = comparison;
        const session = createDecisionComparison(latest, { kind: "melody", startBar: from, endBar: from + 1, label,
          data: notes.filter(note => note.startTick >= from * ticks && note.startTick < (from + 1) * ticks) });
        const reason = adoptionReason;
        cancelComparison();
        projectStore.adoptDecision(session, reason);
        message = "Bを採用しました。↶で現在案へ1回で戻せます。";
      } catch (error) {
        cancelComparison();
        message = error instanceof Error ? error.message : "採用できませんでした。";
      }
      rerender("melody");
    });

    document.querySelectorAll("[data-melody-track]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.melodyTrack === "counter" ? "counter" : "melody";
        if (next === editTrack) return;
        editTrack = next;
        // 裏メロに切り替えたら、その小節の裏メロが見える高さへOctaveを合わせる
        const latest = projectStore.getSnapshot();
        const inBar = readNotes(latest).filter((note) => note.startTick >= barStartTick && note.startTick < barStartTick + barTicks);
        const base = inBar.length > 0 ? inBar : readNotes(latest);
        if (base.length > 0) {
          const mid = base.reduce((sum, note) => sum + note.pitch, 0) / base.length;
          octave = Math.max(2, Math.min(6, Math.floor((mid - rootToPitchClass(latest.basic.key)) / 12) - 1));
        }
        message = isCounter() ? "裏メロを直します。メインのメロディは薄く表示します。" : "メインのメロディを直します。";
        rerender("melody");
      });
    });

    document.querySelector("#melody-candidate-refresh")?.addEventListener("click", () => {
      candidateVariation = (candidateVariation + 1) % MELODY_CANDIDATE_VARIATION_COUNT;
      message = `Bar ${barIndex + 1} の候補を更新しました（${candidateVariation + 1}/${MELODY_CANDIDATE_VARIATION_COUNT}）。`;
      rerender("melody");
    });

    document.querySelectorAll("[data-melody-candidate-play]").forEach((button) => {
      button.addEventListener("click", () => {
        const candidate = melodyCandidates.find((item) => item.id === button.dataset.melodyCandidatePlay);
        if (!candidate) return;
        const bar = barIndex;
        requestAudition({
          label: `Bar ${bar + 1} ${candidate.label}`,
          build: (project) => {
            const ticks = project.basic.ppq * 4;
            const temp = structuredClone(project);
            let track = temp.tracks.find((item) => item.role === "melody");
            if (!track) {
              // まだ音を1つも入れていないProject: 仮のコピーにだけトラックを足す
              track = { id: "audition-melody", role: "melody", name: "Melody", notes: [] };
              temp.tracks.push(track);
            }
            track.notes = applyMelodyCandidate(track.notes ?? [], bar, candidate, { barTicks: ticks });
            return { project: sliceProject(temp, bar * ticks, (bar + 1) * ticks), lengthTick: ticks };
          }
        });
      });
    });

    document.querySelectorAll("[data-melody-candidate]").forEach((button) => {
      button.addEventListener("click", () => {
        const candidate = melodyCandidates.find((item) => item.id === button.dataset.melodyCandidate);
        if (!candidate) return;

        const latest = projectStore.getSnapshot();
        const notes = getMelodyNotes(latest);
        if (
          hasMelodyInBars(notes, { barIndex, bars: 1, barTicks })
          && !globalThis.confirm(`Bar ${barIndex + 1} のメロディを「${candidate.label}」候補で置き換えますか？（↶ で戻せます）`)
        ) {
          return;
        }

        projectStore.updateMelodyNotes(applyMelodyCandidate(notes, barIndex, candidate, { barTicks }));
        resolution = 8;
        half = 0;
        message = `Bar ${barIndex + 1} に「${candidate.label}」候補を適用しました。Piano Rollで自由に修正できます。`;
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-pitch]").forEach((button) => {
      button.addEventListener("click", () => {
        const pitch = Number(button.dataset.melodyPitch);
        const step = Number(button.dataset.melodyStep);
        const latest = projectStore.getSnapshot();
        const notes = readNotes(latest);
        const startTick = barStartTick + step * stepTicks;
        const nextNotes = toggleMonophonicStep(notes, {
          pitch,
          startTick,
          durationTick: lengthSteps * stepTicks,
          limitTick: barStartTick + barTicks,
          resize: lengthSteps > 1
        });

        writeNotes(nextNotes);
        message = `${isCounter() ? "【裏メロ】" : ""}${pitchName(pitch)} / ${stepLabel(step)} を更新しました。（長さ: ${noteValueLabel(lengthSteps * stepTicks, latest.basic.ppq)}）`;
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-length]").forEach((button) => {
      button.addEventListener("click", () => {
        lengthSteps = Number(button.dataset.melodyLength);
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-resolution]").forEach((button) => {
      button.addEventListener("click", () => {
        resolution = Number(button.dataset.melodyResolution) === 16 ? 16 : 8;
        half = 0;
        message = resolution === 8
          ? "セルをタップして8分音符を入力します。"
          : "セルをタップして16分音符を入力します。";
        rerender("melody");
      });
    });

    document.querySelectorAll("[data-melody-half]").forEach((button) => {
      button.addEventListener("click", () => {
        half = Number(button.dataset.melodyHalf) === 1 ? 1 : 0;
        rerender("melody");
      });
    });

    document.querySelector("#clear-melody-bar")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const nextNotes = clearBar(readNotes(latest), {
        barStartTick,
        barDurationTick: barTicks
      });
      writeNotes(nextNotes);
      message = `Bar ${barIndex + 1} の${trackName()}をクリアしました。`;
      rerender("melody");
    });

    // 現在の小節（bars=2なら現在と次の小節）を、すぐ後ろへコピーする。モチーフの繰り返し用
    const copyForward = (bars) => {
      const latest = projectStore.getSnapshot();
      const notes = readNotes(latest);
      const targetBarIndex = barIndex + bars;

      if (
        hasMelodyInBars(notes, { barIndex: targetBarIndex, bars, barTicks })
        && !globalThis.confirm(`Bar ${targetBarIndex + 1}${bars > 1 ? `–${targetBarIndex + bars}` : ""} の${trackName()}を上書きしますか？（↶ で戻せます）`)
      ) {
        return;
      }

      writeNotes(copyMelodyBars(notes, {
        sourceBarIndex: barIndex,
        targetBarIndex,
        bars,
        barTicks
      }));
      message = `Bar ${barIndex + 1}${bars > 1 ? `–${barIndex + bars}` : ""} を Bar ${targetBarIndex + 1}${bars > 1 ? `–${targetBarIndex + bars}` : ""} へコピーしました。`;
      barIndex = targetBarIndex;
      candidateVariation = 0;
      rerender("melody");
    };

    const peakMax = () => Math.max(metrics(projectStore.getSnapshot()).barCount - 1, 0);
    const peakNow = () => Math.min(peakBar ?? defaultPeakBar(projectStore.getSnapshot()), peakMax());
    document.querySelector("#melody-peak-toggle")?.addEventListener("click", () => {
      peakOpen = !peakOpen;
      if (peakOpen) peakBar = null;
      rerender("melody");
    });
    document.querySelector("#melody-peak-prev")?.addEventListener("click", () => {
      peakBar = Math.max(peakNow() - 1, 0);
      rerender("melody");
    });
    document.querySelector("#melody-peak-next")?.addEventListener("click", () => {
      peakBar = Math.min(peakNow() + 1, peakMax());
      rerender("melody");
    });
    document.querySelectorAll("[data-peak-shape]").forEach((button) => {
      button.addEventListener("click", () => {
        peakShapeId = button.dataset.peakShape;
        rerender("melody");
      });
    });
    document.querySelector("#melody-peak-apply")?.addEventListener("click", () => {
      const latest = projectStore.getSnapshot();
      const guide = buildPeakGuide(latest, { peakBar: peakNow(), shapeId: peakShapeId });
      const result = applyPeakGuide(getMelodyNotes(latest), guide, { barTicks: latest.basic.ppq * 4 });
      if (result.placed === 0) {
        message = "目安を置ける空の小節がありませんでした（入力済みの小節は変えません）。";
      } else {
        projectStore.updateMelodyNotes(result.notes);
        message = `目安の音を${result.placed}小節に置きました${result.skipped > 0 ? `（入力済みの${result.skipped}小節は変えていません）` : ""}。山は Bar ${peakNow() + 1} です。`;
        barIndex = Math.max(peakNow() - 3, 0);
        candidateVariation = 0;
      }
      rerender("melody");
    });

    document.querySelector("#melody-analyzer-toggle")?.addEventListener("click", () => {
      analyzerOpen = !analyzerOpen;
      rerender("melody");
    });

    document.querySelectorAll("[data-degree-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const degree = Number(button.dataset.degreeJump);
        const latest = projectStore.getSnapshot();
        const bars = barsUsingChordDegree(latest, degree);
        if (bars.length === 0) return;
        const next = bars.find((bar) => bar > barIndex) ?? bars[0];
        const labels = ["R", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
        barIndex = next;
        message = `コード度数 ${labels[degree]} を使う小節 ${bars.indexOf(next) + 1}/${bars.length}（Bar ${next + 1}）へ移動しました。もう一度押すと次の小節へ。`;
        rerender("melody");
      });
    });

    document.querySelector("#melody-degree-toggle")?.addEventListener("click", () => {
      showDegrees = !showDegrees;
      rerender("melody");
    });

    document.querySelector("#copy-melody-bar")?.addEventListener("click", () => copyForward(1));
    document.querySelector("#copy-melody-2bars")?.addEventListener("click", () => copyForward(2));

    document.querySelector("#melody-prev-bar")?.addEventListener("click", () => {
      barIndex = Math.max(0, barIndex - 1);
      candidateVariation = 0;
      rerender("melody");
    });

    document.querySelector("#melody-next-bar")?.addEventListener("click", () => {
      barIndex = Math.min(barCount - 1, barIndex + 1);
      candidateVariation = 0;
      rerender("melody");
    });

    document.querySelector("#melody-octave-down")?.addEventListener("click", () => {
      octave = Math.max(2, octave - 1);
      rerender("melody");
    });

    document.querySelector("#melody-octave-up")?.addEventListener("click", () => {
      octave = Math.min(6, octave + 1);
      rerender("melody");
    });
  }

  return { render, bind, cancelComparison };
}
