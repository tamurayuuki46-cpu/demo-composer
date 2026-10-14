import { resolveSoundProfile } from '../../src/core/sound-presets.js';
import { arrangedNotes } from './core.js';

const PERCUSSION_ATTACK_SECONDS = 0.003;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function midiToFrequency(pitch) { return 440 * 2 ** ((pitch - 69) / 12); }

function sourceInstruments(source) {
  return Array.isArray(source?.sourceSnapshot?.instruments) ? source.sourceSnapshot.instruments : [];
}

export function resolvePreviewSoundProfile(source, part) {
  const mapped = part === 'harmony' ? 'chord' : part === 'counter' ? 'melody' : part;
  if (!['chord', 'melody', 'bass'].includes(mapped)) return null;
  return resolveSoundProfile(sourceInstruments(source), mapped);
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
  // Theory/part-only bass audition should not pretend to play silence when the source has no Bass Note.
  // In that case, use the current chord roots as a temporary comparison guide without mutating SongProject data.
  if (!events.length && parts.length === 1 && parts[0] === 'bass') {
    events = rootGuideEvents(source, candidate, startTick, endTick, secondsPerTick);
  }
  return { events, endTick, secondsPerTick };
}

function schedulePresetTone(ctx, destination, active, {
  pitch,
  startTime,
  duration,
  profile,
  gainScale = 1,
}) {
  const voiceGain = ctx.createGain();
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = profile.filter;
  toneFilter.Q.value = 0.45;
  const safeDuration = Math.max(0.03, duration);
  const stopTime = startTime + safeDuration + 0.02;
  const baseFrequency = midiToFrequency(pitch);
  const layers = profile.layers;
  const vibrato = profile.vibrato;
  const formants = profile.formants;

  if (!layers && !vibrato && !formants) {
    const oscillator = ctx.createOscillator();
    oscillator.type = profile.waveform;
    oscillator.frequency.value = baseFrequency;
    oscillator.connect(toneFilter);
    oscillator.start(startTime);
    oscillator.stop(stopTime);
    active.add(oscillator);
  } else {
    const input = ctx.createGain();
    const layerList = layers?.length ? layers : [{ type: profile.waveform, gain: 1 }];
    let vibratoGain = null;
    if (vibrato) {
      const lfo = ctx.createOscillator();
      vibratoGain = ctx.createGain();
      const delay = vibrato.delay ?? 0.2;
      lfo.frequency.value = vibrato.rate;
      vibratoGain.gain.setValueAtTime(0, startTime);
      vibratoGain.gain.setValueAtTime(0, startTime + delay);
      vibratoGain.gain.linearRampToValueAtTime(vibrato.depth, startTime + delay + 0.25);
      lfo.connect(vibratoGain);
      lfo.start(startTime);
      lfo.stop(stopTime);
      active.add(lfo);
    }

    layerList.forEach((part) => {
      const oscillator = ctx.createOscillator();
      const layerGain = ctx.createGain();
      oscillator.type = part.type ?? profile.waveform;
      oscillator.frequency.value = baseFrequency * (part.ratio ?? 1);
      oscillator.detune.value = part.detune ?? 0;
      layerGain.gain.value = part.gain ?? 1 / layerList.length;
      oscillator.connect(layerGain);
      layerGain.connect(input);
      if (vibratoGain) vibratoGain.connect(oscillator.detune);
      oscillator.start(startTime);
      oscillator.stop(stopTime);
      active.add(oscillator);
    });

    let node = input;
    (formants ?? []).forEach((formant) => {
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
  const attackEnd = Math.min(startTime + safeDuration * 0.45, startTime + profile.attack);
  const releaseStart = Math.max(attackEnd, startTime + safeDuration - Math.min(profile.release, safeDuration * 0.55));
  const level = profile.gain * gainScale;
  voiceGain.gain.setValueAtTime(0.0001, startTime);
  voiceGain.gain.linearRampToValueAtTime(level, attackEnd);
  voiceGain.gain.setValueAtTime(level, releaseStart);
  voiceGain.gain.linearRampToValueAtTime(0.0001, startTime + safeDuration);
}

function createGain(ctx, destination, amount) {
  const gain = ctx.createGain();
  gain.gain.value = amount;
  gain.connect(destination);
  return gain;
}

function scheduleKick(ctx, destination, active, startTime) {
  const oscillator = ctx.createOscillator();
  const gain = createGain(ctx, destination, 0.34);
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.12);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(0.34, startTime + PERCUSSION_ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.16);
  active.add(oscillator);
}

function scheduleNoiseHit(ctx, destination, active, startTime, { duration, gainAmount, highpass }) {
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
  const attackEnd = Math.min(startTime + PERCUSSION_ATTACK_SECONDS, startTime + duration * 0.35);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainAmount, attackEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(filter);
  filter.connect(gain);
  source.start(startTime);
  source.stop(startTime + duration);
  active.add(source);
}

function scheduleDemoDrum(ctx, destination, active, note, startTime) {
  if (note.pitch === 36) scheduleKick(ctx, destination, active, startTime);
  else if (note.pitch === 38) scheduleNoiseHit(ctx, destination, active, startTime, { duration: 0.12, gainAmount: 0.18, highpass: 900 });
  else if (note.pitch === 42) scheduleNoiseHit(ctx, destination, active, startTime, { duration: 0.045, gainAmount: 0.11, highpass: 5000 });
}

// Arrangement Lab keeps comparison loudness normalization, but timbre itself comes from
// the Demo Composer Sound Sketch preserved in sourceSnapshot.instruments.
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
  let cursor = 0, stopped = false;
  const timer = setInterval(pump, 25);

  function pump() {
    if (stopped) return;
    if (ctx.currentTime >= origin + (endTick - startTick) * secondsPerTick + .05) { stop(); onEnd(); return; }
    while (cursor < events.length && origin + events[cursor].time < ctx.currentTime + .12) {
      const note = events[cursor++];
      const when = Math.max(ctx.currentTime, origin + note.time);
      const end = origin + note.time + note.duration;
      if (end <= when) continue;
      if (note.part === 'drums') {
        scheduleDemoDrum(ctx, master, active, note, when);
        continue;
      }
      const profile = resolvePreviewSoundProfile(source, note.part) || resolveSoundProfile([], 'melody');
      const gainScale = note.part === 'counter' ? 0.7 : 1;
      schedulePresetTone(ctx, master, active, {
        pitch: note.pitch,
        startTime: when,
        duration: Math.min(end - when, 16),
        profile,
        gainScale,
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
