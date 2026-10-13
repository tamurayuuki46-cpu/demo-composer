// 作編曲の手引き: 「スマホで曲の骨子を作ってCubasis / Cubaseへ渡す」までの順番リスト。
// 手順と各画面のコツだけを持つ。進み具合の ✓ は、この端末のlocalStorageにだけ保存する（project.jsonには入れない）。
// 曲のデータは読まない・書かない。

export const GUIDE_STORAGE_KEY = "demo-composer.guideProgress";

export const GUIDE_PHASES = Object.freeze([
  { id: "start", label: "1. 出発点を決める" },
  { id: "compose", label: "2. 作曲（曲の素）" },
  { id: "arrange", label: "3. 編曲（曲の形にする）" },
  { id: "finish", label: "4. 確かめて渡す" }
]);

// screen: 移動先の画面（hub / chord / melody / rhythm / arrange / sound）
export const GUIDE_STEPS = Object.freeze([
  {
    id: "start-point",
    phase: "start",
    screen: "hub",
    title: "ジャンルと気分から、出発点を選ぶ",
    what: "Hubの「出発点」でジャンルと気分を選ぶと、BPM・コード・ドラムの叩き台が3つ出ます。▶試聴して1つ選びます。",
    tip: "迷ったら質問ウィザード。完成させる必要はなく、「近い」で十分です。あとで全部直せます。"
  },
  {
    id: "key-bpm",
    phase: "start",
    screen: "hub",
    title: "BPMとKeyを決める",
    what: "Hubで曲名・BPM・Key・Majorか Minorを確認します。",
    tip: "歌う曲は、歌いやすいKeyに先に合わせておくと、あとで直さずに済みます。コードやメロディを入れたあとはScaleを変えられません。"
  },
  {
    id: "chords",
    phase: "compose",
    screen: "chord",
    title: "コード進行を作る（まず4〜8小節）",
    what: "ChordのPresetから近いものを選び、次のコード候補で伸ばします。コード名とDegree（度数）の両方で確認します。",
    tip: "最初は8小節のループで十分です。気に入ったら「好きな進行ライブラリ」に保存できます。"
  },
  {
    id: "melody",
    phase: "compose",
    screen: "melody",
    title: "メロディを入れる",
    what: "Melodyで「山の位置から作る」か、小節ごとの3候補（安定 / キャッチー / 浮遊感）から選び、Piano Rollで直します。",
    tip: "いちばん高い音（山）をサビのどこに置くかを先に決めると、まとまります。コードの音を長い音に使うと安定します。"
  },
  {
    id: "melody-check",
    phase: "compose",
    screen: "melody",
    title: "メロディの特徴を見る",
    what: "Melody Analyzerで音域・跳躍・コードトーン率・同音連打・モチーフの反復を見ます。",
    tip: "良し悪しの点数ではなく、自分のメロディの癖を知るためのものです。跳躍が多すぎる所だけ見直すのがおすすめです。"
  },
  {
    id: "bass",
    phase: "compose",
    screen: "rhythm",
    title: "ベースを入れる",
    what: "Rhythmでベース候補を選びます。キックと同時に見えるので、ズレていないかも確認します。",
    tip: "まずはコードの根音（ルート）を拍の頭に。動かすのは、あとからで十分です。"
  },
  {
    id: "drums",
    phase: "compose",
    screen: "rhythm",
    title: "ドラムを入れる",
    what: "ドラムPresetを選び、必要なら小節の終わりにドラムフィルを足します。",
    tip: "最初はキック・スネア・ハイハットだけ。Aメロは控えめ、サビは詰める、という差が出せます。"
  },
  {
    id: "structure",
    phase: "arrange",
    screen: "arrange",
    title: "曲の構成を決める",
    what: "Arrangeで構成の叩き台（イントロ・Aメロ・Bメロ・サビ…）を選ぶか、感情曲線・構成ライブラリ・「ループから曲にする」で作ります。",
    tip: "8小節のループができたら「ループから曲にする」。好きな曲の構成を借りるなら構成ライブラリが便利です。"
  },
  {
    id: "energy",
    phase: "arrange",
    screen: "arrange",
    title: "盛り上がり（Energy）とつなぎ方を決める",
    what: "各SectionにLow / Mid / Highを付け、Sectionの境目のつなぎ（フィル・ブレイク・ビルド・ドロップ）を選びます。",
    tip: "サビをHighにして、その前を少し引く（LowやMid）と、サビが強く聴こえます。"
  },
  {
    id: "variation",
    phase: "arrange",
    screen: "arrange",
    title: "2回目のSectionを少し変える",
    what: "コピーしたSectionに「少し違う版にする」を使い、ドラム・ベース・メロディを少しだけ変えます。",
    tip: "Aメロ2回目は、まったく別にせず「少しだけ」。モチーフが残るので、聴き手が曲を覚えやすくなります。"
  },
  {
    id: "counter",
    phase: "arrange",
    screen: "arrange",
    title: "裏メロを入れる（任意）",
    what: "Sectionの「🎶 裏メロ」で3候補を聴き、サビなど厚みが欲しい所だけに入れます。",
    tip: "入れすぎない。メロディが主役で、裏メロはそっと寄り添う程度に。合わなければ消せます。"
  },
  {
    id: "sound",
    phase: "arrange",
    screen: "sound",
    title: "音色の方向性を選ぶ",
    what: "SoundでChord・Melody・Bassの音色（Lead / Pad / Keys など）と方向性（Bright / Soft / Dark など）を選びます。",
    tip: "最終的な音は作りません。PCでの音色選びの目安にするためのものです。"
  },
  {
    id: "skeleton",
    phase: "finish",
    screen: "hub",
    title: "骨子チェックで抜けを確認する",
    what: "Hubの「骨子チェック」で、まだ決めていない項目を確認し、ボタンでその画面へ戻ります。",
    tip: "△や－が残っていても、PCで決めると決めたなら問題ありません。採点ではありません。"
  },
  {
    id: "listen",
    phase: "finish",
    screen: "hub",
    title: "通して聴く",
    what: "画面下の再生で全体を聴きます。Loopと「パート」のミュート / ソロで、聴き分けます。",
    tip: "イヤホンとスマホのスピーカーの両方で聴くと、バランスの偏りに気づけます。"
  },
  {
    id: "export",
    phase: "finish",
    screen: "hub",
    title: "書き出す",
    what: "HubのExportで Draft.mid と、Chord / Melody / Bass / Drums（あれば CounterMelody）の.midと project.json を保存します。",
    tip: "「Cubase用メモ」に、取り込む順番と使ったコードがまとまっています。AI相談テキストもここから作れます。"
  },
  {
    id: "daw",
    phase: "finish",
    screen: "hub",
    title: "Cubasis / Cubaseで読み込む",
    what: "Draft.mid を読み込み、テンポ・拍子が合っているか、パートが分かれているかを確認します。",
    tip: "ここからは「何を作ろう」ではなく「どういい音に仕上げよう」。音色・ミックスはDAW側で行います。"
  }
]);

export function guideStepIds() {
  return GUIDE_STEPS.map((step) => step.id);
}

// 保存された ✓ を読む。壊れていても、知らないidが混ざっていても、安全に空・有効分だけにする
export function loadGuideProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(GUIDE_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const valid = new Set(guideStepIds());
    return new Set(parsed.filter((id) => valid.has(id)));
  } catch {
    return new Set();
  }
}

export function saveGuideProgress(done, storage = globalThis.localStorage) {
  try {
    storage?.setItem(GUIDE_STORAGE_KEY, JSON.stringify([...done]));
    return true;
  } catch {
    return false;
  }
}

export function toggleGuideStep(done, stepId) {
  const next = new Set(done);
  if (!guideStepIds().includes(stepId)) return next;
  if (next.has(stepId)) next.delete(stepId);
  else next.add(stepId);
  return next;
}

// 次にやる手順（未チェックの先頭）。全部済みなら null
export function nextGuideStep(done) {
  return GUIDE_STEPS.find((step) => !done.has(step.id)) ?? null;
}
