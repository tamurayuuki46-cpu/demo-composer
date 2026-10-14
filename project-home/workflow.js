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
    nextAction = { id: 'sheet', label: '今やること：作曲シートで方向を決める', href: '../sheet-app/' };
  } else if (!compositionDone) {
    nextAction = { id: 'composition', label: '今やること：Demo Composerで1フレーズ作る', href: '../' };
  } else if (!arrangementDone) {
    nextAction = { id: 'arrangement', label: '今やること：Arrangement Labで編曲を試す', href: '../arranger/' };
  } else if (!dawReady) {
    nextAction = { id: 'daw', label: '今やること：DAWへ渡すデータを書き出す', href: '../arranger/' };
  } else {
    nextAction = { id: 'complete', label: '次：Cubasis / Cubaseで仕上げる', href: null };
  }

  return {
    steps,
    nextAction,
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
