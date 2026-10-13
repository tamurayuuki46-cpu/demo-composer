export const WORKFLOW_STEPS = Object.freeze([
  { id: 'sheet', label: '1. 作曲シート', role: '決める', required: true },
  { id: 'materials', label: '2. 参考曲 / 素材', role: '集める・理解する', required: false },
  { id: 'composition', label: '3. Demo Composer', role: '作る', required: true },
  { id: 'arrangement', label: '4. Arrangement Lab', role: '育てる', required: true },
  { id: 'dawReady', label: '5. DAW引き継ぎ', role: '渡す準備', required: true },
  { id: 'pcDaw', label: '6. PC DAW', role: '完成させる', required: true },
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
  const materialDone = hasReferenceMaterial(project);
  const compositionDone = hasComposition(project);
  const arrangementDone = hasArrangement(project);
  const dawReady = isDawReady(project);

  const steps = [
    { ...WORKFLOW_STEPS[0], status: sheetLinked ? 'done' : 'pending' },
    { ...WORKFLOW_STEPS[1], status: materialDone ? 'done' : 'optional' },
    { ...WORKFLOW_STEPS[2], status: compositionDone ? 'done' : 'pending' },
    { ...WORKFLOW_STEPS[3], status: arrangementDone ? 'done' : (compositionDone ? 'pending' : 'locked') },
    { ...WORKFLOW_STEPS[4], status: dawReady ? 'done' : (arrangementDone ? 'pending' : 'locked') },
    { ...WORKFLOW_STEPS[5], status: 'external' },
  ];

  let nextAction;
  if (!sheetLinked) {
    nextAction = { id: 'sheet', label: '作曲シートで方向性を決める', href: null };
  } else if (!compositionDone) {
    nextAction = { id: 'composition', label: 'Demo Composerで曲を作る', href: '../' };
  } else if (!arrangementDone) {
    nextAction = { id: 'arrangement', label: 'Arrangement Labで編曲する', href: '../arranger/' };
  } else if (!dawReady) {
    nextAction = { id: 'dawReady', label: 'Arrangement LabでDAW引き継ぎを作る', href: '../arranger/' };
  } else {
    nextAction = { id: 'pcDaw', label: 'PC DAWへ渡して本制作する', href: null };
  }

  return {
    steps,
    nextAction,
    optionalAnalysisSuggested: sheetLinked && !materialDone && !compositionDone,
  };
}

export function lineageLabel(project) {
  const lineage = project?.lineage;
  if (!lineage) return 'このProjectが起点';
  if (lineage.parentProjectId) return `親: ${lineage.parentProjectId}`;
  if (lineage.rootProjectId && lineage.rootProjectId !== project?.projectId) return `起点: ${lineage.rootProjectId}`;
  return 'このProjectが起点';
}
