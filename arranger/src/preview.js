import { arrangedNotes } from './core.js';

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

// Short lookahead bounds mobile oscillator allocation; MIDI and preview share notes.
// Comparison playback uses a simple energy proxy so dense candidates do not win only by being louder.
export function startPreview(ctx, source, candidate, startTick = 0, onEnd = () => {}, options = {}) {
  const secondsPerTick = 60 / source.basic.bpm / source.basic.ppq;
  const songEnd = source.sections.at(-1).endTick;
  const endTick = Math.min(songEnd, options.endTick ?? songEnd, startTick + 16 / secondsPerTick);
  const types = { melody: 'triangle', counter: 'triangle', bass: 'sine', drums: 'square', harmony: 'sine', guide: 'sine' };
  const events = (options.parts || ['melody','counter','bass','drums','harmony']).flatMap((part) => arrangedNotes(source, candidate, part)
    .filter((note) => note.startTick < endTick && note.startTick + note.durationTick > startTick)
    .map((note) => ({ ...note, part, time: (Math.max(startTick, note.startTick) - startTick) * secondsPerTick,
      duration: (Math.min(endTick, note.startTick + note.durationTick) - Math.max(startTick, note.startTick)) * secondsPerTick })))
    .sort((a, b) => a.time - b.time);
  const master = ctx.createGain();
  const previewSeconds = Math.max(.25, (endTick - startTick) * secondsPerTick);
  const energy = events.reduce((sum, note) => {
    const velocity = (note.velocity || 90) / 127;
    const weight = note.part === 'drums' ? .45 : 1;
    return sum + velocity * velocity * Math.min(.6, Math.max(.03, note.duration)) * weight;
  }, 0) / previewSeconds;
  const normalize = options.normalizeLoudness !== false;
  master.gain.value = normalize ? clamp(.72 / Math.sqrt(Math.max(1, energy / 1.7)), .28, .72) : .65;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.knee.value = 6; limiter.ratio.value = 12;
  master.connect(limiter).connect(ctx.destination);
  const active = new Set();
  const origin = ctx.currentTime + .05;
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
      osc.frequency.value = 440 * 2 ** ((note.pitch - 69) / 12);
      const duration = Math.min(end - when, note.part === 'drums' ? .07 : 16);
      const attack = Math.min(.008, duration / 3);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(.055 * note.velocity / 127, when + attack);
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
  return stop;
}
