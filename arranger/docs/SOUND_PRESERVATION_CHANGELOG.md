Version: v0.12-dev
更新日: 2026-10-14

【追加】
・Arrangement Lab試聴でDemo ComposerのChord / Melody / BassのSound Sketch（Preset / Tone）を引き継ぐ
・360 / 390 / 430px Mobile ChromiumでChord=Strings / Brightの波形レイヤーが引き継がれる回帰テストを追加

【変更】
・Arrangement Lab試聴の固定triangle / sine / square音色を廃止し、Demo Composer由来のSound Sketchを優先
・DrumsもDemo Composer Demo Playerと同系統の簡易Kick / Snare / Hi-Hatへ合わせる
・比較しやすさのため音量ノーマライズは維持するが、Preset / Toneによる波形・Filter・Attack / Release・Layer・Vibrato・Formantは保持

【修正】
・Demo Composerから渡した曲をArrangement Labで再生すると音色が変わる問題を修正

【未対応】
・Android実機スピーカーでDemo ComposerとArrangement Labの音色差がないことを最終確認
・Cubasis / Cubase実機確認
