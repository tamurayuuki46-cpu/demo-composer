import { buildChordPreset, getChordPreset } from "./chord-presets.js";
import { sliceProject } from "../core/section-ops.js";

// 試聴用: いまのProjectのコードを、そのPresetに置き換えた「仮のProject」と、鳴らす長さを返す。
// 元のProjectは変更しない。Bassは新しいコードと合わないことがあるので外す（Melody・裏メロ・Drumsはそのまま重ねる）。
export function chordPresetAudition(project, presetId) {
  const barTicks = project.basic.ppq * 4;
  const preset = getChordPreset(presetId);
  const chords = buildChordPreset(presetId, {
    key: project.basic.key,
    scale: project.basic.scale,
    barTicks
  });
  const temp = structuredClone(project);
  temp.chords = chords;
  temp.tracks.forEach((track) => {
    if (track.role === "bass") track.notes = [];
  });
  const lengthTick = chords.length * barTicks;
  return { project: sliceProject(temp, 0, lengthTick), lengthTick, label: preset.label };
}
