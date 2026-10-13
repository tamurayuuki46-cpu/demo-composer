// A/Bは保存しない。一度固定したProjectから両案を作り、採用時だけStoreへ渡す。
import { sliceProject } from "./section-ops.js";

const clone = (value) => structuredClone(value);
const notesOf = (project) => project.tracks.find((track) => track.role === "melody")?.notes ?? [];
const signature = (note) => [note.pitch, note.startTick, note.durationTick, note.velocity].join(":");

export function createMelodyComparison(project, barIndex, candidateNotes, label) {
  const barTicks = project.basic.ppq * 4;
  if (!Number.isInteger(barIndex) || barIndex < 0 || barIndex >= 128) throw new Error("比較する小節が不正です。");
  const start = barIndex * barTicks;
  const end = start + barTicks;
  const inBar = (note) => note.startTick >= start && note.startTick < end;
  const original = notesOf(project);
  // 他の小節は常に現在案から保持する。呼び出し側が全曲の候補を渡しても上書きしない。
  const bNotes = [...original.filter((note) => !inBar(note)), ...candidateNotes.filter(inBar)]
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  const a = original.filter(inBar);
  const b = bNotes.filter(inBar);
  const remaining = b.map(signature);
  let unchanged = 0;
  for (const note of a) {
    const index = remaining.indexOf(signature(note));
    if (index >= 0) { unchanged += 1; remaining.splice(index, 1); }
  }
  return clone({ project, projectId: project.id, revision: project.revision, barIndex, barTicks,
    label, bNotes, diff: { a: a.length, b: b.length, unchanged,
      removed: a.length - unchanged, added: b.length - unchanged } });
}

export function comparisonIsCurrent(session, project) {
  return Boolean(session && session.projectId === project.id && session.revision === project.revision);
}

export function comparisonNotes(session, project) {
  if (!comparisonIsCurrent(session, project)) throw new Error("曲が変更されています。比較をやり直してください。");
  return clone(session.bNotes);
}

export function comparisonPreview(session, project, choice) {
  comparisonNotes(session, project); // 試聴も古い比較を使わない。
  if (choice !== "A" && choice !== "B") throw new Error("比較する案が不正です。");
  const temp = clone(session.project);
  if (choice === "B") {
    let track = temp.tracks.find((item) => item.role === "melody");
    if (!track) { track = { role: "melody", name: "Melody", notes: [] }; temp.tracks.push(track); }
    track.notes = clone(session.bNotes);
  }
  const start = session.barIndex * session.barTicks;
  return { project: sliceProject(temp, start, start + session.barTicks), lengthTick: session.barTicks };
}
