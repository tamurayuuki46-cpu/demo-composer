import { DRUM_PITCH } from "./rhythm-grid.js";

export const DRUM_PRESETS = [
  {
    id: "basic-8",
    label: "8ビート 基本",
    description: "Kickを1・3拍、Snareを2・4拍、HHを8分で置く基本形。",
    steps: {
      kick: [0, 8],
      snare: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14]
    }
  },
  {
    id: "four-floor",
    label: "4つ打ち",
    description: "Kickを4拍すべて、Snareを2・4拍、HHを裏拍に置く形。",
    steps: {
      kick: [0, 4, 8, 12],
      snare: [4, 12],
      hh: [2, 6, 10, 14]
    }
  },
  {
    id: "pop",
    label: "Pop",
    description: "8ビートを土台にKickを少し前後へ動かしたポップ向けの形。",
    steps: {
      kick: [0, 6, 8, 11],
      snare: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14]
    }
  },
  {
    id: "rock",
    label: "Rock",
    description: "Snareは2・4拍、Kickを追加して押し出しを強めた8ビート。",
    steps: {
      kick: [0, 3, 8, 10],
      snare: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14]
    }
  },
  {
    id: "half-time",
    label: "Half Time",
    description: "Snareを3拍目へ置き、ゆったり感じるハーフタイム。",
    steps: {
      kick: [0, 6, 12],
      snare: [8],
      hh: [0, 2, 4, 6, 8, 10, 12, 14]
    }
  },
  {
    id: "sixteenth-hh",
    label: "16分HH",
    description: "Kick / Snareは基本形のまま、HHを16分すべてに置く形。",
    steps: {
      kick: [0, 8],
      snare: [4, 12],
      hh: Array.from({ length: 16 }, (_, step) => step)
    }
  }
];

const DRUM_PARTS = {
  kick: { pitch: DRUM_PITCH.kick, velocity: 105 },
  snare: { pitch: DRUM_PITCH.snare, velocity: 100 },
  hh: { pitch: DRUM_PITCH.hh, velocity: 88 }
};

const PRESET_PITCHES = new Set(Object.values(DRUM_PARTS).map((part) => part.pitch));

function createNoteId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDrumPreset(presetId) {
  return DRUM_PRESETS.find((preset) => preset.id === presetId) ?? DRUM_PRESETS[0];
}

export function applyDrumPreset(notes, {
  presetId,
  barStartTick,
  stepTicks,
  durationTick = stepTicks
}) {
  const preset = getDrumPreset(presetId);
  const barEndTick = barStartTick + stepTicks * 16;

  const retained = notes.filter((note) => {
    const inCurrentBar = note.startTick >= barStartTick && note.startTick < barEndTick;
    return !inCurrentBar || !PRESET_PITCHES.has(note.pitch);
  });

  const created = Object.entries(preset.steps).flatMap(([partName, steps]) => {
    const part = DRUM_PARTS[partName];
    if (!part) return [];

    return steps.map((step) => ({
      id: createNoteId(),
      pitch: part.pitch,
      startTick: barStartTick + step * stepTicks,
      durationTick,
      velocity: part.velocity
    }));
  });

  return [...retained, ...created].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function hasEditableDrumsInBar(notes, { barStartTick, barDurationTick }) {
  const barEndTick = barStartTick + barDurationTick;
  return notes.some(
    (note) => note.startTick >= barStartTick
      && note.startTick < barEndTick
      && PRESET_PITCHES.has(note.pitch)
  );
}

// 小節の範囲（startBar〜endBar、endBarは含まない）すべてへ、同じDrum Presetを適用する
export function applyDrumPresetToBars(notes, { presetId, startBar, endBar, barTicks, stepTicks }) {
  let next = notes;
  for (let bar = startBar; bar < endBar; bar += 1) {
    next = applyDrumPreset(next, { presetId, barStartTick: bar * barTicks, stepTicks });
  }
  return next;
}

export function hasEditableDrumsInBars(notes, { startBar, endBar, barTicks }) {
  return hasEditableDrumsInBar(notes, { barStartTick: startBar * barTicks, barDurationTick: (endBar - startBar) * barTicks });
}
