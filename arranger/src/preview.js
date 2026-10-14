import { arrangedNotes } from './core.js';
import { resolveSoundProfile } from '../../src/core/sound-presets.js';

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
const PERCUSSION_ATTACK_SECONDS = 0.003;

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

function demoComposerSoundPart(part) {
  if (part === 'harmony') return 'chord';
  if (part === 'counter') return 'melody';
  if (part === 'melody' || part === 'bass') return part;
  return null;
}

export function resolvePreviewSoundProfile(source, part) {
  const soundPart = demoComposerSoundPart(part);
  if (!soundPart) return null;
  const instruments = source?.sourceSnapshot?.instruments;
  if (!Array.isArray(instruments) || !instruments.some((item) => item?.part === soundPart)) return null;
  return resolveSoundProfile(instruments, soundPart);
}

function trackSource(active, source) {
  active.add(source);
  const previous = source.onended;
  source.onended = () => {
    previous?.();
    active.delete(source);
    try { source.disconnect(); } catch {}
  };
}

function scheduleProfileTone(ctx, destination, active, note, when, duration, profile) {
  const voiceGain = ctx.createGain();
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = profile.filter;
  toneFilter.Q.value = 0.45;
  const safeDuration = Math.max(0.03, duration);
  const stopTime = when + safeDuration + 0.02;
  const baseFrequency = 440 * 2 ** ((note.pitch - 69) / 12);
  const gainScale = note.part === 'counter' ? 0.7 : 1;

  if (!profile.layers && !profile.vibrato && !profile.formants) {
    const oscillator = ctx.createOscillator();
    oscillator.type = profile.waveform;
    oscillator.frequency.value = baseFrequency;
    oscillator.connect(toneFilter);
    trackSource(active, oscillator);
    oscillator.start(when);
    oscillator.stop(stopTime);
  } else {
    const input = ctx.createGain();
    const parts = profile.layers?.length ? profile.layers : [{ type: profile.waveform, gain: 1 }];
    let vibratoGain = null;
    if (profile.vibrato) {
      const lfo = ctx.createOscillator();
      vibratoGain = ctx.createGain();
      const delay = profile.vibrato.delay ?? 0.2;
      lfo.frequency.value = profile.vibrato.rate;
      vibratoGain.gain.setValueAtTime(0, when);
      vibratoGain.gain.setValueAtTime(0, when + delay);
      vibratoGain.gain.linearRampToValueAtTime(profile.vibrato.depth, when + delay + 0.25);
      lfo.connect(vibratoGain);
      trackSource(active, lfo);
      lfo.start(when);
      lfo.stop(stopTime);
    }

    parts.forEach((part) => {
      const oscillator = ctx.createOscillator();
      const layerGain = ctx.createGain();
      oscillator.type = part.type ?? profile.waveform;
      oscillator.frequency.value = baseFrequency * (part.ratio ?? 1);
      oscillator.detune.value = part.detune ?? 0;
      layerGain.gain.value = part.gain ?? 1 / parts.length;
      oscillator.connect(layerGain);
      layerGain.connect(input);
      if (vibratoGain) vibratoGain.connect(oscillator.detune);
      trackSource(active, oscillator);
      oscillator.start(when);
      oscillator.stop(stopTime);
    });

    let node = input;
    (profile.formants ?? []).forEach((formant) => {
      const peak = ctx.createBiquadFilter();
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
  const attackEnd = Math.min(when + safeDuration * 0.45, when + profile.attack);
  const releaseStart = Math.max(attackEnd, when + safeDuration - Math.min(profile.release, safeDuration * 0.55));
  const targetGain = profile.gain * gainScale;
  voiceGain.gain.setValueAtTime(0.0001, when);
  voiceGain.gain.linearRampToValueAtTime(targetGain, attackEnd);
  voiceGain.gain.setValueAtTime(targetGain, releaseStart);
  voiceGain.gain.linearRampToValueAtTime(0.0001, when + safeDuration);
}

function createGain(ctx, destination, amount) {
  const gain = ctx.createGain();
  gain.gain.value = amount;
  gain.connect(destination);
  return gain;
}

function scheduleKick(ctx, destination, active, when) {
  const oscillator = ctx.createOscillator();
  const gain = createGain(ctx, destination, 0.34);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, when);
  oscillator.frequency.exponentialRampToValueAtTime(55, when + 0.12);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(0.34, when + PERCUSSION_ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
  oscillator.connect(gain);
  trackSource(active, oscillator);
  oscillator.start(when);
  oscillator.stop(when + 0.16);
}

function scheduleNoiseHit(ctx, destination, active, when, { duration, gainAmount, highpass }) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const gain = createGain(ctx, destination, gainAmount);
  const attackEnd = Math.min(when + PERCUSSION_ATTACK_SECONDS, when + duration * 0.35);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(gainAmount, attackEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  trackSource(active, source);
  source.start(when);
  source.stop(when + duration);
}

function scheduleDemoComposerDrum(ctx, destination, active, note, when) {
  if (note.pitch === 36) {
    scheduleKick(ctx, destination, active, when);
    return true;
  }
  if (note.pitch === 38) {
    scheduleNoiseHit(ctx, destination, active, when, { duration: 0.12, gainAmount: 0.18, highpass: 900 });
    return true;
  }
  if (note.pitch === 42) {
    scheduleNoiseHit(ctx, destination, active, when, { duration: 0.045, gainAmount: 0.11, highpass: 5000 });
    return true;
  }
  return false;
}

function scheduleFallbackTone(ctx, destination, active, note, when, duration, harmonyOnly) {
  const types = { melody: 'triangle', counter: 'triangle', bass: 'sine', drums: 'square', harmony: 'triangle', guide: 'sine' };
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = types[note.part] || 'sine';
  const previewPitch = harmonyOnly && note.part === 'harmony' && note.pitch < 60 ? note.pitch + 12 : note.pitch;
  osc.frequency.value = 440 * 2 ** ((previewPitch - 69) / 12);
  const safeDuration = Math.min(duration, note.part === 'drums' ? .07 : 16);
  const attack = Math.min(.008, safeDuration / 3);
  const level = note.part === 'harmony' ? (harmonyOnly ? .085 : .065) : .055;
  gain.gain.setValueAtTime(.0001, when);
  gain.gain.exponentialRampToValueAtTime(level * note.velocity / 127, when + attack);
  gain.gain.exponentialRampToValueAtTime(.0001, when + safeDuration);
  osc.connect(gain).connect(destination);
  trackSource(active, osc);
  osc.start(when);
  osc.stop(when + safeDuration);
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
      if (active.size >= 32) continue;
      const when = Math.max(ctx.currentTime, origin + note.time);
      const end = origin + note.time + note.duration;
      if (end <= when) continue;
      const duration = Math.min(end - when, note.part === 'drums' ? .07 : 16);
      if (note.part === 'drums' && scheduleDemoComposerDrum(ctx, master, active, note, when)) continue;
      const profile = resolvePreviewSoundProfile(source, note.part);
      if (profile) scheduleProfileTone(ctx, master, active, note, when, duration, profile);
      else scheduleFallbackTone(ctx, master, active, note, when, duration, harmonyOnly);
    }
  }
  function stop() {
    if (stopped) return;
    stopped = true; clearInterval(timer);
    for (const sourceNode of active) { try { sourceNode.stop(); } catch {} }
    active.clear();
    if (ctx.state !== 'closed') ctx.close().catch(() => {});
  }
  pump();
  stop.eventCount = events.length;
  stop.preservedSound = events.some((note) => note.part === 'drums' || Boolean(resolvePreviewSoundProfile(source, note.part)));
  return stop;
}
