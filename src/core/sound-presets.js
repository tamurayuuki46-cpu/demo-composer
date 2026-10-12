// 声に近い音色の部品。formants は母音の山（周波数 / 鋭さ / 強さdB）、vibrato は揺れ（速さHz / 幅cent / 始まるまでの秒）
const VOCAL_SAW_LAYERS = Object.freeze([{ type: "sawtooth", detune: -6, gain: 0.5 }, { type: "triangle", detune: 6, gain: 0.5 }]);
const STRINGS_LAYERS = Object.freeze([{ type: "sawtooth", detune: -9, gain: 0.34 }, { type: "sawtooth", detune: 0, gain: 0.32 }, { type: "sawtooth", detune: 9, gain: 0.34 }]);
const VOWEL_A = Object.freeze([{ freq: 800, q: 3.5, gain: 7 }, { freq: 1250, q: 4, gain: 5 }]);
const VOWEL_O = Object.freeze([{ freq: 500, q: 3, gain: 6 }, { freq: 900, q: 3.5, gain: 4 }]);
const VOWEL_I = Object.freeze([{ freq: 330, q: 4, gain: 6 }, { freq: 2300, q: 4, gain: 6 }]);

export const SOUND_PARTS = Object.freeze([
  {
    id: "chord",
    label: "Chord",
    description: "コードの伴奏感を決めます。",
    presets: Object.freeze([
      { id: "keys", label: "Keys", waveform: "triangle", filter: 2800, attack: 0.01, release: 0.12, gain: 0.13 },
      { id: "pad", label: "Pad", waveform: "sine", filter: 1900, attack: 0.08, release: 0.34, gain: 0.11 },
      { id: "piano", label: "Piano", waveform: "triangle", filter: 3600, attack: 0.004, release: 0.08, gain: 0.14 },
      {
        id: "strings", label: "Strings", description: "ゆっくり立ち上がる弦の厚み。バラードやサビ前に。",
        waveform: "sawtooth", filter: 2200, attack: 0.12, release: 0.3, gain: 0.215,
        layers: STRINGS_LAYERS, vibrato: { rate: 5, depth: 8, delay: 0.3 }
      },
      {
        id: "organ", label: "Organ", description: "倍音を重ねた、息の長いオルガン。",
        waveform: "sine", filter: 3000, attack: 0.015, release: 0.06, gain: 0.16,
        layers: [{ type: "sine", ratio: 1, gain: 0.5 }, { type: "sine", ratio: 2, gain: 0.3 }, { type: "sine", ratio: 3, gain: 0.2 }]
      },
      {
        id: "choir", label: "Choir", description: "「あ」の母音に近い、コーラス風のパッド。",
        waveform: "sawtooth", filter: 1700, attack: 0.12, release: 0.35, gain: 0.15,
        layers: VOCAL_SAW_LAYERS, vibrato: { rate: 4.8, depth: 10, delay: 0.3 }, formants: VOWEL_A
      }
    ]),
    defaultPreset: "keys"
  },
  {
    id: "melody",
    label: "Melody",
    description: "メインメロディの前に出る感じを決めます。",
    presets: Object.freeze([
      { id: "lead", label: "Lead", waveform: "sawtooth", filter: 3200, attack: 0.008, release: 0.09, gain: 0.12 },
      { id: "keys", label: "Keys", waveform: "triangle", filter: 2800, attack: 0.01, release: 0.11, gain: 0.17 },
      { id: "pluck", label: "Pluck", waveform: "square", filter: 2400, attack: 0.002, release: 0.045, gain: 0.11 },
      {
        id: "vocal", label: "Vocal（ボカロ風）", description: "やわらかく息のある、ボーカロイドのような声。Chordのパッドに近い立ち上がり。",
        waveform: "sawtooth", filter: 2600, attack: 0.035, release: 0.16, gain: 0.225,
        layers: VOCAL_SAW_LAYERS, vibrato: { rate: 5.2, depth: 14, delay: 0.18 }, formants: VOWEL_A
      },
      {
        id: "vocal-soft", label: "Vocal Soft（やわらか）", description: "丸く優しい声。「お」に近い母音で、ささやくような感じ。",
        waveform: "triangle", filter: 2100, attack: 0.05, release: 0.2, gain: 0.108,
        layers: [{ type: "triangle", detune: -5, gain: 0.5 }, { type: "sine", detune: 5, gain: 0.5 }],
        vibrato: { rate: 4.8, depth: 10, delay: 0.25 }, formants: VOWEL_O
      },
      {
        id: "vocal-bright", label: "Vocal Bright（ハイ）", description: "明るく抜ける声。「い」に近い母音で、サビや高い音に。",
        waveform: "sawtooth", filter: 3600, attack: 0.025, release: 0.12, gain: 0.25,
        layers: [{ type: "sawtooth", detune: -8, gain: 0.5 }, { type: "sawtooth", detune: 8, gain: 0.5 }],
        vibrato: { rate: 5.8, depth: 10, delay: 0.15 }, formants: VOWEL_I
      },
      {
        id: "pad-lead", label: "Pad Lead（パッド寄り）", description: "Chordのパッドに近い、ふわっと立ち上がるリード。",
        waveform: "sine", filter: 1900, attack: 0.07, release: 0.3, gain: 0.22,
        layers: [{ type: "sine", detune: -4, gain: 0.5 }, { type: "triangle", detune: 4, gain: 0.5 }],
        vibrato: { rate: 4.5, depth: 6, delay: 0.3 }
      },
      {
        id: "flute", label: "Flute", description: "息の混じる細い音。静かなメロディに。",
        waveform: "sine", filter: 3200, attack: 0.05, release: 0.13, gain: 0.157,
        layers: [{ type: "sine", ratio: 1, gain: 0.85 }, { type: "sine", ratio: 2, gain: 0.15 }],
        vibrato: { rate: 5, depth: 16, delay: 0.2 }
      },
      {
        id: "strings-lead", label: "Strings Lead", description: "弦のように伸びるメロディ。厚みがあり、ゆっくり立ち上がる。",
        waveform: "sawtooth", filter: 2200, attack: 0.1, release: 0.25, gain: 0.26,
        layers: STRINGS_LAYERS, vibrato: { rate: 5, depth: 9, delay: 0.25 }
      },
      {
        id: "bell", label: "Bell", description: "オルゴール・ベルのような、きらっとした音。",
        waveform: "sine", filter: 5200, attack: 0.002, release: 0.4, gain: 0.19,
        layers: [{ type: "sine", ratio: 1, gain: 0.7 }, { type: "sine", ratio: 2.76, gain: 0.3 }]
      }
    ]),
    defaultPreset: "vocal"
  },
  {
    id: "bass",
    label: "Bass",
    description: "低音の太さと存在感を決めます。",
    presets: Object.freeze([
      { id: "soft-bass", label: "Soft Bass", waveform: "triangle", filter: 1050, attack: 0.015, release: 0.12, gain: 0.23 },
      { id: "synth-bass", label: "Synth Bass", waveform: "sawtooth", filter: 780, attack: 0.005, release: 0.09, gain: 0.19 },
      { id: "deep-bass", label: "Deep Bass", waveform: "sine", filter: 620, attack: 0.02, release: 0.16, gain: 0.28 },
      { id: "sub-bass", label: "Sub Bass", description: "ほぼ純粋な低音。ドラムのキックと重ねても濁りにくい。", waveform: "sine", filter: 380, attack: 0.01, release: 0.1, gain: 0.25 },
      { id: "pluck-bass", label: "Pluck Bass", description: "短く弾む、輪郭のはっきりしたベース。", waveform: "square", filter: 900, attack: 0.002, release: 0.05, gain: 0.17 },
      {
        id: "growl-bass", label: "Growl Bass", description: "2つの波形を重ねた、ざらっと太いベース。",
        waveform: "sawtooth", filter: 1100, attack: 0.006, release: 0.09, gain: 0.215,
        layers: [{ type: "sawtooth", detune: -12, gain: 0.5 }, { type: "square", detune: 12, gain: 0.5 }]
      }
    ]),
    defaultPreset: "soft-bass"
  }
]);

export const SOUND_TONES = Object.freeze([
  { id: "natural", label: "Natural", filterRatio: 1, attackRatio: 1, releaseRatio: 1, gainRatio: 1 },
  { id: "bright", label: "Bright", filterRatio: 1.55, attackRatio: 0.75, releaseRatio: 0.9, gainRatio: 1.02 },
  { id: "soft", label: "Soft", filterRatio: 0.72, attackRatio: 1.6, releaseRatio: 1.35, gainRatio: 0.86 },
  { id: "warm", label: "Warm", filterRatio: 0.82, attackRatio: 1.15, releaseRatio: 1.2, gainRatio: 0.95 },
  { id: "dark", label: "Dark", filterRatio: 0.48, attackRatio: 1.1, releaseRatio: 1.1, gainRatio: 0.96 },
  { id: "airy", label: "Airy", filterRatio: 1.25, attackRatio: 1.7, releaseRatio: 1.55, gainRatio: 0.82 },
  { id: "aggressive", label: "Aggressive", filterRatio: 1.3, attackRatio: 0.45, releaseRatio: 0.72, gainRatio: 1.08 }
]);

export const DEFAULT_SOUND_SELECTIONS = Object.freeze(
  SOUND_PARTS.map((part) => Object.freeze({
    part: part.id,
    preset: part.defaultPreset,
    tone: "natural"
  }))
);

export function getSoundPart(partId) {
  return SOUND_PARTS.find((part) => part.id === partId) ?? null;
}

export function getSoundTone(toneId) {
  return SOUND_TONES.find((tone) => tone.id === toneId) ?? SOUND_TONES[0];
}

export function defaultSoundSelection(partId) {
  const part = getSoundPart(partId);
  if (!part) throw new Error(`Unsupported sound part: ${partId}`);
  return { part: part.id, preset: part.defaultPreset, tone: "natural" };
}

export function getSoundSelection(instruments, partId) {
  const candidate = Array.isArray(instruments)
    ? instruments.find((instrument) => instrument?.part === partId)
    : null;
  const fallback = defaultSoundSelection(partId);
  if (!candidate) return fallback;

  const part = getSoundPart(partId);
  const preset = part.presets.some((item) => item.id === candidate.preset)
    ? candidate.preset
    : fallback.preset;
  const tone = SOUND_TONES.some((item) => item.id === candidate.tone)
    ? candidate.tone
    : fallback.tone;

  return { part: partId, preset, tone };
}

export function upsertSoundSelection(instruments, selection) {
  const current = Array.isArray(instruments) ? instruments : [];
  const next = current.filter((instrument) => instrument?.part !== selection.part);
  next.push({ part: selection.part, preset: selection.preset, tone: selection.tone });
  return next;
}

export function resolveSoundProfile(instruments, partId) {
  const selection = getSoundSelection(instruments, partId);
  const part = getSoundPart(partId);
  const preset = part.presets.find((item) => item.id === selection.preset) ?? part.presets[0];
  const tone = getSoundTone(selection.tone);

  return {
    waveform: preset.waveform,
    filter: Math.min(12000, Math.max(180, preset.filter * tone.filterRatio)),
    attack: Math.max(0.001, preset.attack * tone.attackRatio),
    release: Math.max(0.02, preset.release * tone.releaseRatio),
    gain: Math.min(0.35, Math.max(0.03, preset.gain * tone.gainRatio)),
    // 声・弦などの重ね合わせ / 揺れ / 母音。無いPresetは従来どおり1つの波形
    layers: preset.layers ?? null,
    vibrato: preset.vibrato ?? null,
    formants: preset.formants ?? null
  };
}
