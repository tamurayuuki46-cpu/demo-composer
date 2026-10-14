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
    || project?.export?.lastDawHandoffAt
    || project?.compatibility?.arrangementLab?.arrangerProjectId,
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

  // First show the decision that belongs to the stage the user is currently in.
  if (!sheetLinked) pushUnique(items, { id: 'direction', label: '曲の方向性' });
  else if (!composed) {
    if (!composition.chords?.length) pushUnique(items, { id: 'chords', label: 'コード進行' });
    if (!composition.melody?.length) pushUnique(items, { id: 'melody', label: '主旋律' });
  } else if (!arranged) {
    pushUnique(items, { id: 'arrangement', label: '編曲方針' });
  } else if (!dawReady) {
    pushUnique(items, { id: 'daw-export', label: 'DAWへ渡すデータ' });
  }

  // Then surface important unfinished composition decisions without blocking forward progress.
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

  let nextAction;
  if (!sheetLinked) {
    nextAction = { id: 'sheet', label: '次にやること：作曲シートで方向を決める', href: PRIVATE_SHEET_URL };
  } else if (!compositionDone) {
    nextAction = { id: 'composition', label: '次にやること：Demo Composerで1フレーズ作る', href: '../' };
  } else if (!arrangementDone) {
    nextAction = { id: 'arrangement', label: '次にやること：Arrangement Labで編曲を試す', href: '../arranger/' };
  } else if (!dawReady) {
    nextAction = { id: 'daw', label: '次にやること：DAWへ渡すデータを書き出す', href: '../arranger/' };
  } else {
    nextAction = { id: 'complete', label: '次にやること：Cubasis / Cubaseで仕上げる', href: null };
  }

  return {
    steps,
    nextAction,
    currentStage: currentStageFor(nextAction.id),
    undecidedItems: buildUndecidedItems(project, { sheetLinked }),
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
