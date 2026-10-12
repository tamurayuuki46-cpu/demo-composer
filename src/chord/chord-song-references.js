// Chord Presetの学習用・代表曲メタデータ。
//
// 方針:
// - コード進行が曲中の一部で確認できる代表例だけを載せる。
// - 7th / add9 / 分数コード / 経過和音など、原曲の細部はPresetより複雑な場合がある。
// - 「この曲全体がこの4コードだけ」という意味ではない。
// - Spotifyカタログに楽曲とアーティストが存在することを追加時に確認する。
// - 曲名・アーティスト名は学習用の参照情報で、Project Dataには保存しない。

export const CHORD_SONG_REFERENCES = Object.freeze({
  "pop-1564": Object.freeze({
    song: "チェリー",
    artist: "スピッツ",
    note: "I–V–vi–IV の代表例（曲中の一部・簡略化）"
  }),
  "jpop-4536": Object.freeze({
    song: "夜に駆ける",
    artist: "YOASOBI",
    note: "IV–V–iii–vi の代表例（曲中の一部・簡略化）"
  }),
  "pop-6415": Object.freeze({
    song: "前前前世",
    artist: "RADWIMPS",
    note: "vi–IV–I–V の代表例（曲中の一部・簡略化）"
  }),
  "canon": Object.freeze({
    song: "マリーゴールド",
    artist: "あいみょん",
    note: "カノン進行系の代表例（曲中の一部・簡略化）"
  }),
  "bright-4156": Object.freeze({
    song: "Lemon",
    artist: "米津玄師",
    note: "IV–I–V–vi の代表例（曲中の一部・簡略化）"
  }),
  "sad-4561": Object.freeze({
    song: "ピースサイン",
    artist: "米津玄師",
    note: "IV–V–vi–I の代表例（曲中の一部・簡略化）"
  }),
  "sad-6451": Object.freeze({
    song: "Get Wild",
    artist: "TM NETWORK",
    note: "vi–IV–V–I（小室進行）の代表例（曲中の一部・簡略化）"
  })
});

export function chordSongReference(presetId) {
  return CHORD_SONG_REFERENCES[presetId] ?? null;
}
