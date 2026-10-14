import { arrangedNotes } from './core.js';

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function rootGuideEvents(source, candidate, startTick, endTick, secondsPerTick) {
  const section = source.sections.find((item) => item.startTick <= startTick && item.endTick > startTick)
    || source.sections.find((item) => item.startTick < endTick && item.endTick > startTick);
  const plan = section ? candidate.sections.find((item) => item.sectionId === section.id) : null;
  const chords = plan?.reharmonization?.chords?.length ? plan.reharmonization.chords : source.chords;
  return chords
    .filter((chord) => chord.startTick < endTick && chord.startTick + chord.durationTick > startTick)
    .map((chord) => {
      const noteStart = Math.max(startTick, chord.startTick);
      const noteEnd = Math.min(endTick, chord.startTick + chord.durationTick);
      return {
        pitch: 36 + ((Number(chord.root) % 12) + 12) % 12,
        velocity: 78,
        startTick: noteStart,
        durationTick: Math.max(1, noteEnd - noteStart),
        part: 'bass',
        time: (noteStart - startTick) * secondsPerTick,
        duration: (noteEnd - noteStart) * secondsPerTick,
        previewFallback: 'chord-root',
      };
    });
}

export function buildPreviewEvents(source, candidate, startTick = 0, options = {}) {
  const secondsPerTick = 60 / source.basic.bpm / source.basic.ppq;
  const songEnd = source.sections.at(-1).endTick;
  const endTick = Math.min(songEnd, options.endTick ?? songEnd, startTick + 16 / secondsPerTick);
  const parts = options.parts || ['melody','counter','bass','drums','harmony'];
  let events = parts.flatMap((part) => arrangedNotes(source, candidate, part)
    .filter((note) => note.startTick < endTick && note.startTick + note.durationTick > startTick)
    .map((note) => ({ ...note, part, time: (Math.max(startTick, note.startTick) - startTick) * secondsPerTick,
      duration: (Math.min(endTick, note.startTick + note.durationTick) - Math.max(startTick, note.startTick)) * secondsPerTick })))
    .sort((a, b) => a.time - b.time);
  // Theory/part-only bass audition should not pretend to play silence when the source has no Bass Note.
  // In that case, use the current chord roots as a temporary comparison guide without mutating SongProject data.
  if (!events.length && parts.length === 1 && parts[0] === 'bass') {
    events = rootGuideEvents(source, candidate, startTick, endTick, secondsPerTick);
  }
  return { events, endTick, secondsPerTick };
}

// Short lookahead bounds mobile oscillator allocation; MIDI and preview share notes.
// Comparison playback uses a simple energy proxy so dense candidates do not win only by being louder.
export function startPreview(ctx, source, candidate, startTick = 0, onEnd = () => {}, options = {}) {
  const { events, endTick, secondsPerTick } = buildPreviewEvents(source, candidate, startTick, options);
  if (!events.length) throw new Error('このSectionに試聴できるコード / Noteがありません。曲データの位置を確認してください。');

  const types = { melody: 'triangle', counter: 'triangle', bass: 'sine', drums: 'square', harmony: 'triangle', guide: 'sine' };
  const master = ctx.createGain();
  const previewSeconds = Math.max(.25, (endTick - startTick) * secondsPerTick);
  const energy = events.reduce((sum, note) => {
    const velocity = (note.velocity || 90) / 127;
    const weight = note.part === 'drums' ? .45 : 1;
    return sum + velocity * velocity * Math.min(.6, Math.max(.03, note.duration)) * weight;
  }, 0) / previewSeconds;
  const normalize = options.normalizeLoudness !== false;
  master.gain.value = normalize ? clamp(.78 / Math.sqrt(Math.max(1, energy / 1.7)), .32, .78) : .7;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.knee.value = 6; limiter.ratio.value = 12;
  master.connect(limiter).connect(ctx.destination);
  const active = new Set();
  const origin = ctx.currentTime + .05;
  const harmonyOnly = events.every((note) => note.part === 'harmony');
  let cursor = 0, stopped = false;
  const timer = setInterval(pump, 25);
  function pump() {
    if (stopped) return;
    if (ctx.currentTime >= origin + (endTick - startTick) * secondsPerTick + .05) { stop(); onEnd(); return; }
    while (cursor < events.length && origin + events[cursor].time < ctx.currentTime + .12) {
      const note = events[cursor++];
      if (active.size >= 32) continue;
      const when = Math.max(ctx.currentTime, origin + note.time);
      const end = origin + note.time + note.duration;
      if (end <= when) continue;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = types[note.part] || 'sine';
      const previewPitch = harmonyOnly && note.part === 'harmony' && note.pitch < 60 ? note.pitch + 12 : note.pitch;
      osc.frequency.value = 440 * 2 ** ((previewPitch - 69) / 12);
      const duration = Math.min(end - when, note.part === 'drums' ? .07 : 16);
      const attack = Math.min(.008, duration / 3);
      const level = note.part === 'harmony' ? (harmonyOnly ? .085 : .065) : .055;
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(level * note.velocity / 127, when + attack);
      gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
      osc.connect(gain).connect(master);
      active.add(osc);
      osc.onended = () => { active.delete(osc); osc.disconnect(); gain.disconnect(); };
      osc.start(when); osc.stop(when + duration);
    }
  }
  function stop() {
    if (stopped) return;
    stopped = true; clearInterval(timer);
    for (const osc of active) { try { osc.stop(); } catch {} }
    active.clear();
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
  }
  pump();
  stop.eventCount = events.length;
  return stop;
}