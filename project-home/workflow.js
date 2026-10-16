import { PRIVATE_SHEET_URL } from './sheet-connection.js';

export const WORKFLOW_STEPS = Object.freeze([
  { id: 'sheet', label: '⓪ 作曲シート', role: '方向を決める', required: true },
  { id: 'analysis', label: '① MIDI解析', role: '必要なら素材を理解する', required: false },
  { id: 'composition', label: '② 作曲', role: 'Demo Composer', required: true },
  { id: 'arrangement', label: '③ 編曲', role: 'Arrangement Lab', required: true },
  { id: 'daw', label: '④ DAWへ', role: 'Cubasis / Cubase', required: true },
]);

export function hasAnalysis(project) {
  const analysis = project?.analysis || {};
  return Boolean(
    analysis.keyCandidates?.length
    || analysis.chordCandidates?.length
    || analysis.degreeAnalysis
    || analysis.melodyAnalysis
    || analysis.bassAnalysis
    || analysis.rhythmAnalysis,
  );
}

export function hasReferenceMaterial(project) {
  return Boolean(project?.reference?.items?.length || hasAnalysis(project));
}

export function hasComposition(project) {
  const composition = project?.composition || {};
  return Boolean(
    composition.chords?.length
    || composition.melody?.length
    || composition.counterMelody?.length
    || composition.bass?.length
    || composition.drums?.length
    || composition.sections?.length,
  );
}

export function hasArrangement(project) {
  const arrangement = project?.arrangement || {};
  return Boolean(
    arrangement.reharmonization?.length
    || arrangement.voicing?.length
    || arrangement.density?.length
    || arrangement.instruments?.length
    || arrangement.selectedAlternatives
    || arrangement.decisions?.length,
  );
}

export function isDawReady(project) {
  if (!hasArrangement(project)) return false;
  return Boolean(
    project?.export?.lastSongMidiAt
    || project?.export?.lastDawHandoffAt,
  );
}

function pushUnique(items, item) {
  if (!items.some((existing) => existing.id === item.id)) items.push(item);
}

export function buildUndecidedItems(project, { sheetLinked = false, limit = 3 } = {}) {
  const items = [];
  const composition = project?.composition || {};
  const composed = hasComposition(project);
  const arranged = hasArrangement(project);
  const dawReady = isDawReady(project);

  if (!sheetLinked) pushUnique(items, { id: 'direction', label: '曲の方向性' });
  else if (!composed) {
    if (!composition.chords?.length) pushUnique(items, { id: 'chords', label: 'コード進行' });
    if (!composition.melody?.length) pushUnique(items, { id: 'melody', label: '主旋律' });
  } else if (!arranged) {
    pushUnique(items, { id: 'arrangement', label: '編曲方針' });
  } else if (!dawReady) {
    pushUnique(items, { id: 'daw-export', label: 'DAWへ渡すデータ' });
  }

  if (!composition.chords?.length) pushUnique(items, { id: 'chords', label: 'コード進行' });
  if (!composition.melody?.length) pushUnique(items, { id: 'melody', label: '主旋律' });

  if (composed) {
    if (!composition.sections?.length) pushUnique(items, { id: 'sections', label: '曲構成' });
    if (!composition.counterMelody?.length) pushUnique(items, { id: 'counter', label: '裏メロ（必要なら）' });
    if (!composition.bass?.length) pushUnique(items, { id: 'bass', label: 'ベース（必要なら）' });
  }

  return items.slice(0, Math.max(1, limit));
}

function currentStageFor(nextActionId) {
  return ({
    sheet: { id: 'sheet', label: '作曲シートで方向を決める' },
    composition: { id: 'composition', label: 'Demo Composerで作曲中' },
    arrangement: { id: 'arrangement', label: 'Arrangement Labで編曲中' },
    daw: { id: 'daw', label: 'DAWへ渡す準備中' },
    complete: { id: 'complete', label: 'Cubasis / Cubaseで仕上げる段階' },
  })[nextActionId] || { id: 'sheet', label: '作曲シートで方向を決める' };
}

function decisionText(decision) {
  return String(decision?.label || decision?.summary || '').trim();
}

export function buildCreativeState(project, { sheetLinked = false } = {}) {
  const composition = project?.composition || {};
  const arrangement = project?.arrangement || {};
  const decisions = Array.isArray(arrangement.decisions) ? arrangement.decisions : [];
  const exploring = [];
  const comparing = [];
  const holding = [];

  if (!sheetLinked) exploring.push('曲の方向性');
  if (composition.chords?.length && !arrangement.selectedAlternatives) exploring.push('コード / ハーモニー');
  if (composition.melody?.length && !arrangement.selectedAlternatives) exploring.push('主旋律');
  if (composition.sections?.length && !hasArrangement(project)) exploring.push('Section展開');

  if (arrangement.selectedAlternatives) comparing.push('採用候補');
  if (Array.isArray(arrangement.alternatives) && arrangement.alternatives.length > 1) comparing.push('Arrangement候補');
  if (Array.isArray(arrangement.reharmonization) && arrangement.reharmonization.length > 1) comparing.push('Reharm候補');

  for (const decision of decisions) {
    const text = decisionText(decision);
    const state = String(decision?.status || decision?.state || '').toLowerCase();
    if (state === 'hold' || state === 'pending' || /保留/.test(text)) pushUnique(holding, { id: text || `hold-${holding.length}`, label: text || '判断保留' });
  }

  if (hasComposition(project) && !hasArrangement(project)) holding.push('編曲方針は後で決めてもOK');
  if (hasComposition(project) && !composition.counterMelody?.length) holding.push('裏メロは任意');

  return {
    exploring: [...new Set(exploring)].slice(0, 3),
    comparing: [...new Set(comparing)].slice(0, 3),
    holding: holding.map((item) => typeof item === 'string' ? item : item.label).filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).slice(0, 3),
  };
}

function nextActionFor(project, { sheetLinked, analysisDone, compositionDone, arrangementDone, dawReady }) {
  if (!sheetLinked) return { id: 'sheet', label: '作曲シートで方向を決める', href: PRIVATE_SHEET_URL, kind: 'recommended' };
  if (!compositionDone) return { id: 'composition', label: 'Demo Composerで1フレーズ作る', href: '../', kind: 'recommended' };
  if (!arrangementDone) return { id: 'arrangement', label: 'Arrangement Labで編曲を試す', href: '../arranger/', kind: 'recommended' };
  if (!dawReady) return { id: 'daw', label: 'DAWへ渡すデータを書き出す', href: '../arranger/', kind: 'recommended' };
  return { id: 'complete', label: 'Cubasis / Cubaseで仕上げる', href: null, kind: 'recommended' };
}

export function buildNextOptions(project, context = {}) {
  const analysisDone = context.analysisDone ?? hasReferenceMaterial(project);
  const compositionDone = context.compositionDone ?? hasComposition(project);
  const arrangementDone = context.arrangementDone ?? hasArrangement(project);
  const dawReady = context.dawReady ?? isDawReady(project);
  const sheetLinked = Boolean(context.sheetLinked);
  const options = [nextActionFor(project, { sheetLinked, analysisDone, compositionDone, arrangementDone, dawReady })];

  if (sheetLinked && !analysisDone && !compositionDone) {
    options.push({ id: 'analysis', label: '必要ならMIDIを解析して特徴を見る', href: 'https://tamurayuuki46-cpu.github.io/midi-analyzer/', kind: 'optional' });
  } else if (compositionDone && !arrangementDone) {
    options.push({ id: 'explore-composition', label: 'Demo Composerへ戻って別案を試す', href: '../', kind: 'optional' });
  } else if (arrangementDone && !dawReady) {
    options.push({ id: 'compare-more', label: 'Arrangement Labでもう少し比較する', href: '../arranger/', kind: 'optional' });
  }

  options.push({ id: 'pause', label: '今日はここまで', href: null, kind: 'pause' });
  return options.slice(0, 3);
}

export function buildWorkflowState(project, { sheetLinked = false } = {}) {
  const analysisDone = hasReferenceMaterial(project);
  const compositionDone = hasComposition(project);
  const arrangementDone = hasArrangement(project);
  const dawReady = isDawReady(project);

  const steps = [
    { ...WORKFLOW_STEPS[0], status: sheetLinked ? 'done' : 'pending' },
    { ...WORKFLOW_STEPS[1], status: analysisDone ? 'done' : 'optional' },
    { ...WORKFLOW_STEPS[2], status: compositionDone ? 'done' : 'pending' },
    { ...WORKFLOW_STEPS[3], status: arrangementDone ? 'done' : (compositionDone ? 'pending' : 'locked') },
    { ...WORKFLOW_STEPS[4], status: dawReady ? 'done' : (arrangementDone ? 'pending' : 'locked') },
  ];

  const recommended = nextActionFor(project, { sheetLinked, analysisDone, compositionDone, arrangementDone, dawReady });
  const nextAction = { ...recommended, label: `次にやること：${recommended.label}` };

  return {
    steps,
    nextAction,
    nextOptions: buildNextOptions(project, { sheetLinked, analysisDone, compositionDone, arrangementDone, dawReady }),
    currentStage: currentStageFor(nextAction.id),
    undecidedItems: buildUndecidedItems(project, { sheetLinked }),
    creativeState: buildCreativeState(project, { sheetLinked }),
    optionalAnalysisSuggested: sheetLinked && !analysisDone && !compositionDone,
  };
}

export function lineageLabel(project) {
  const lineage = project?.lineage;
  if (!lineage) return 'このProjectが起点';
  if (lineage.parentProjectId) return `親: ${lineage.parentProjectId}`;
  if (lineage.rootProjectId && lineage.rootProjectId !== project?.projectId) return `起点: ${lineage.rootProjectId}`;
  return 'このProjectが起点';
}
