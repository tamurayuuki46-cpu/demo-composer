# Arrangement Lab v0.4-dev

更新日: 2026-10-13
Repository: tamurayuuki46-cpu/demo-composer
Work: chatgpt/arranger-v0.4-music-labs
Base checkpoint: ecdd2397ccfa475073cde564579b284dd32597ed
Restore before schema expansion: restore/arranger-v0.3-before-music-labs (3d92f60)。Archiveはversions/arranger-v0.3-before-music-labs。

## Implemented
50手法 (14/16/15/5) と複数候補、実Chord/Voicing/Noteの変更、対象Section採用、試聴、個別MIDI、独立Plan Schema4と旧1/2/3互換。
正本: PRODUCT_SPEC.md / MUSIC_LAB_METHODS_v0.4.md / music-lab-catalog.js。
処理: harmony-lab.js / counter-lab.js / development-lab.js / music-lab.js / music-lab-utils.js。
UI: music-lab-ui.jsを既存feature-ui.jsへ追加。app.jsが既存7機能と共存。

## Verification
core/regression/features/music-labsテスト。全50手法と157適用Variant、source不変、範囲、旧Plan、MIDI Note往復。Browser CIは360/390/430px、全50 UI生成と代表採用/保存/offline。
詳細: VERIFICATION_v0.4.md。Android/Cubasis/Cubase実機確認は継続課題。

## Constraints
main/過去Branchを変更しない。Demo Composer本体Schema/Versionは維持。
転調は候補。主旋律固定により不一致あり。全休符/停止/減衰の明示的な展開は主旋律Noteも対象。
採用はaffectedSectionIdsだけ。他Sectionの新しい編集を上書きしない。
旧選択とNote Override競合はupdateCandidateSectionで当該パートだけ解除する。
Shell pushは認証なし。接続GitHubによるtree/commit/ref更新を使用。force=false/expected_shaを維持。
