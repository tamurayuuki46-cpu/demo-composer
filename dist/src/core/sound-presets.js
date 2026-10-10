export const SOUND_PARTS = Object.freeze([
  {
    id: "chord",
    label: "Chord",
    description: "コードの伴奏感を決めます。",
    presets: Object.freeze([
      { id: "keys", label: "Keys", waveform: "triangle", filter: 2800, attack: 0.01, release: 0.12, gain: 0.13 },
      { id: "pad", label: "Pad", waveform: "sine", filter: 1900, attack: 0.08, release: 0.34, gain: 0.11 },
      { id: "piano", label: "Piano", waveform: "triangle", filter: 3600, attack: 0.004, release: 0.08, gain: 0.14 }
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
      { id: "pluck", label: "Pluck", waveform: "square", filter: 2400, attack: 0.002, release: 0.045, gain: 0.11 }
    ]),
    defaultPreset: "keys"
  },
  {
    id: "bass",
    label: "Bass",
    description: "低音の太さと存在感を決めます。",
    presets: Object.freeze([
      { id: "soft-bass", label: "Soft Bass", waveform: "triangle", filter: 1050, attack: 0.015, release: 0.12, gain: 0.23 },
      { id: "synth-bass", label: "Synth Bass", waveform: "sawtooth", filter: 780, attack: 0.005, release: 0.09, gain: 0.19 },
      { id: "deep-bass", label: "Deep Bass", waveform: "sine", filter: 620, attack: 0.02, release: 0.16, gain: 0.28 }
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
    gain: Math.min(0.35, Math.max(0.03, preset.gain * tone.gainRatio))
  };
}
