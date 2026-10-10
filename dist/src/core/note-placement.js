// 1音だけ鳴るパート（Melody / Bass）で、音の長さを指定して置くための共通の純粋関数。
// Moduleどうしを直接依存させないため、MelodyとRhythmの両方がここ（core）を使う。

// 長さの選択肢（マスの数）。8分入力なら 8分/4分/付点4分/2分/付点2分/全音符、
// 16分入力なら 16分/8分/付点8分/4分/付点4分/2分。
export const LENGTH_STEPS = Object.freeze([1, 2, 3, 4, 6, 8]);

const NOTE_VALUE_LABELS = new Map([
  [0.25, "16分"],
  [0.5, "8分"],
  [0.75, "付点8分"],
  [1, "4分"],
  [1.5, "付点4分"],
  [2, "2分"],
  [3, "付点2分"],
  [4, "全音符"]
]);

export function noteValueLabel(durationTick, ppq = 480) {
  return NOTE_VALUE_LABELS.get(durationTick / ppq) ?? `${durationTick}tick`;
}

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// notes に1音を置く（または消す）。
// - 置く長さは「小節の終わり(limitTick)」と「次の音の開始位置」を超えない（次の音は消さない）
// - 直前の音が開始位置にかかっていたら、そこまで短くする
// - 同じ開始位置の別の音程は置き換える
// - 同じ開始位置・同じ音程をもう一度置くと削除。ただし resize=true のときは、
//   長さが違えば削除ではなく長さの変更にする（同じ長さなら削除）
export function placeMonophonicNote(notes, {
  pitch,
  startTick,
  durationTick,
  velocity = 96,
  limitTick = Infinity,
  resize = false
}) {
  const existing = notes.find((note) => note.startTick === startTick);
  const others = notes.filter((note) => note.startTick !== startTick);
  const nextStart = others
    .filter((note) => note.startTick > startTick)
    .reduce((min, note) => Math.min(min, note.startTick), Infinity);
  const length = Math.max(1, Math.min(durationTick, Math.min(limitTick, nextStart) - startTick));

  if (existing?.pitch === pitch && (!resize || existing.durationTick === length)) {
    return others;
  }

  const trimmed = others.map((note) => (
    note.startTick < startTick && note.startTick + note.durationTick > startTick
      ? { ...note, durationTick: startTick - note.startTick }
      : note
  ));

  const keepsIdentity = existing?.pitch === pitch;

  return [
    ...trimmed,
    {
      id: keepsIdentity ? existing.id : createNoteId(),
      pitch,
      startTick,
      durationTick: length,
      velocity: keepsIdentity ? existing.velocity : velocity
    }
  ].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}
