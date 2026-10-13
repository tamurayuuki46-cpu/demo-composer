import { getDiatonicChords } from "./chord-theory.js";

// コードの「役割」を一言で。初心者が、進行の中で各コードが何をしているかを知るための表示。
// ダイアトニックコードの番号（0=I/i）ごとの短いラベルと、少し長い説明。
const ROLES_MAJOR = [
  { label: "安定", hint: "ホーム。落ち着く場所" },
  { label: "つなぎ", hint: "動き始める。Vへ向かいやすい" },
  { label: "浮遊", hint: "ふわっと浮く。決まりきらない" },
  { label: "ひらける", hint: "広がる。明るく開ける" },
  { label: "緊張", hint: "Iに戻りたくなる" },
  { label: "切ない", hint: "Iの影。しっとりする" },
  { label: "不安定", hint: "強い緊張。Iへ解決したい" }
];

const ROLES_MINOR = [
  { label: "安定", hint: "ホーム。落ち着く場所" },
  { label: "不安定", hint: "つなぎ。vへ向かいやすい" },
  { label: "明るい", hint: "ふっと明るくなる" },
  { label: "しっとり", hint: "深みが出る" },
  { label: "やや緊張", hint: "iに戻りたくなる" },
  { label: "ひらける", hint: "広がる" },
  { label: "前へ", hint: "前へ進む。iやIIIへ向かう" }
];

const BORROWED = { label: "借用", hint: "同主調から借りた色づけ" };

// chord: { root, quality }。ダイアトニック外のコードは「借用」。コードが無ければ null。
export function chordRole(chord, { key, scale }) {
  if (!chord) return null;
  const diatonic = getDiatonicChords(key, scale);
  const index = diatonic.findIndex((candidate) => candidate.root === chord.root && candidate.quality === chord.quality);
  if (index === -1) return BORROWED;
  return (scale === "major" ? ROLES_MAJOR : ROLES_MINOR)[index];
}
