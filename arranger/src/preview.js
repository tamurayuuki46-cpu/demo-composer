import { arrangedNotes } from './core.js';
import { resolveSoundProfile } from '../../src/core/sound-presets.js';

const PERCUSSION_ATTACK_SECONDS = 0.003;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export function resolvePreviewSoundProfile(source, part) {
  const instruments = Array.isArray(source?.sourceSnapshot?.instruments) ? source.sourceSnapshot.instruments : [];
  const sourcePart = part === 'harmony' ? 'chord' : part === 'counter' ? 'melody' : part;
  if (!['chord', 'melody', 'bass'].includes(sourcePart)) return null;
  return resolveSoundProfile(instruments, sourcePart);
}

function trackSource(active, source) {
  if (!source) return source;
  active.add(source);
  const previous = source.onended;
  source.onended = (...args) => {
    active.delete(source);
    previous?.(...args);
  };
  return source;
}

function createGain(context, destination, amount) {
  const gain = context.createGain();
  gain.gain.value = amount;
  gain.connect(destination);
  return gain;
}

function scheduleTone(context, destination, activeSources, {
  pitch,
  startTime,
  duration,
  type = 'sine',
  gain = 0.08,
  filter = 12000,
  attack = 0.004,
  release = 0.03,
  layers = null,
  vibrato = null,
  formants = null,
}) {
  const voiceGain = context.createGain();
  const toneFilter = context.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = filter;
  toneFilter.Q.value = 0.45;
  const safeDuration = Math.max(0.03, duration);
  const stopTime = startTime + safeDuration + 0.02;
  const baseFrequency = 440 * 2 ** ((pitch - 69) / 12);

  if (!layers && !vibrato && !formants) {
    const oscillator = trackSource(activeSources, context.createOscillator());
    oscillator.type = type;
    oscillator.frequency.value = baseFrequency;
    oscillator.connect(toneFilter);
    oscillator.start(startTime);
    oscillator.stop(stopTime);
  } else {
    const input = context.createGain();
    const parts = layers?.length ? layers : [{ type, gain: 1 }];
    let vibratoGain = null;
    if (vibrato) {
      const lfo = trackSource(activeSources, context.createOscillator());
      vibratoGain = context.createGain();
      const delay = vibrato.delay ?? 0.2;
      lfo.frequency.value = vibrato.rate;
      vibratoGain.gain.setValueAtTime(0, startTime);
      vibratoGain.gain.setValueAtTime(0, startTime + delay);
      vibratoGain.gain.linearRampToValueAtTime(vibrato.depth, startTime + delay + 0.25);
      lfo.connect(vibratoGain);
      lfo.start(startTime);
      lfo.stop(stopTime);
    }
    parts.forEach((part) => {
      const oscillator = trackSource(activeSources, context.createOscillator());
      const layerGain = context.createGain();
      oscillator.type = part.type ?? type;
      oscillator.frequency.value = baseFrequency * (part.ratio ?? 1);
      oscillator.detune.value = part.detune ?? 0;
      layerGain.gain.value = part.gain ?? 1 / parts.length;
      oscillator.connect(layerGain);
      layerGain.connect(input);
      if (vibratoGain) vibratoGain.connect(oscillator.detune);
      oscillator.start(startTime);
      oscillator.stop(stopTime);
    });
    let node = input;
    (formants ?? []).forEach((formant) => {
      const peak = context.createBiquadFilter();
      peak.type = 'peaking';
      peak.frequency.value = formant.freq;
      peak.Q.value = formant.q;
      peak.gain.value = formant.gain;
      node.connect(peak);
      node = peak;
    });
    node.connect(toneFilter);
  }

  toneFilter.connect(voiceGain);
  voiceGain.connect(destination);
  const attackEnd = Math.min(startTime + safeDuration * 0.45, startTime + attack);
  const releaseStart = Math.max(attackEnd, startTime + safeDuration - Math.min(release, safeDuration * 0.55));
  voiceGain.gain.setValueAtTime(0.0001, startTime);
  voiceGain.gain.linearRampToValueAtTime(gain, attackEnd);
  voiceGain.gain.setValueAtTime(gain, releaseStart);
  voiceGain.gain.linearRampToValueAtTime(0.0001, startTime + safeDuration);
}

function scheduleKick(context, destination, activeSources, startTime) {
  const oscillator = trackSource(activeSources, context.createOscillator());
  const gain = createGain(context, destination, 0.34);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.12);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.34, startTime + PERCUSSION_ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.16);
}

function scheduleNoiseHit(context, destination, activeSources, startTime, { duration, gainAmount, highpass }) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
  const source = trackSource(activeSources, context.createBufferSource());
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const gain = createGain(context, destination, gainAmount);
  const attackEnd = Math.min(startTime + PERCUSSION_ATTACK_SECONDS, startTime + duration * 0.35);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainAmount, attackEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(filter);
  filter.connect(gain);
  source.start(startTime);
  source.stop(startTime + duration);
}

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
  if (!events.length && parts.length === 1 && parts[0] === 'bass') {
    events = rootGuideEvents(source, candidate, startTick, endTick, secondsPerTick);
  }
  return { events, endTick, secondsPerTick };
}

export function startPreview(ctx, source, candidate, startTick = 0, onEnd = () => {}, options = {}) {
  const { events, endTick, secondsPerTick } = buildPreviewEvents(source, candidate, startTick, options);
  if (!events.length) throw new Error('このSectionに試聴できるコード / Noteがありません。曲データの位置を確認してください。');

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
      if (active.size >= 48) continue;
      const when = Math.max(ctx.currentTime, origin + note.time);
      const end = origin + note.time + note.duration;
      if (end <= when) continue;
      if (note.part === 'drums') {
        if (note.pitch === 36) scheduleKick(ctx, master, active, when);
        else if (note.pitch === 38) scheduleNoiseHit(ctx, master, active, when, { duration: 0.12, gainAmount: 0.18, highpass: 900 });
        else if (note.pitch === 42) scheduleNoiseHit(ctx, master, active, when, { duration: 0.045, gainAmount: 0.11, highpass: 5000 });
        continue;
      }
      const profile = resolvePreviewSoundProfile(source, note.part);
      const previewPitch = harmonyOnly && note.part === 'harmony' && note.pitch < 60 ? note.pitch + 12 : note.pitch;
      const partGain = note.part === 'counter' ? 0.7 : 1;
      const velocityGain = (note.velocity || 90) / 127;
      scheduleTone(ctx, master, active, {
        pitch: previewPitch,
        startTime: when,
        duration: Math.min(end - when, 16),
        type: profile?.waveform || 'sine',
        gain: (profile?.gain || 0.08) * partGain * velocityGain,
        filter: profile?.filter || 12000,
        attack: profile?.attack || 0.004,
        release: profile?.release || 0.03,
        layers: profile?.layers || null,
        vibrato: profile?.vibrato || null,
        formants: profile?.formants || null,
      });
    }
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    for (const sourceNode of active) { try { sourceNode.stop(); } catch {} }
    active.clear();
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
  }
  pump();
  stop.eventCount = events.length;
  return stop;
}
