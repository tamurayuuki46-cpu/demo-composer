import { buildBackingEvents, getBackingPatternSelection } from "../core/backing-patterns.js";
import { chordIntervals } from "../core/chord-qualities.js";
import { resolveSoundProfile } from "../core/sound-presets.js";

function midiToFrequency(pitch) {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

export const PART_ROLES = Object.freeze(["chord", "melody", "bass", "drums", "counter"]);

function projectEndTick(project) {
  const barTicks = project.basic.ppq * 4;
  const chordEnd = project.chords.reduce(
    (max, chord) => Math.max(max, chord.startTick + chord.durationTick),
    0
  );
  const noteEnd = project.tracks
    .flatMap((track) => track.notes ?? [])
    .reduce((max, note) => Math.max(max, note.startTick + note.durationTick), 0);
  const contentEnd = Math.max(chordEnd, noteEnd);
  const usedBars = Math.max(1, Math.ceil(contentEnd / barTicks));

  return usedBars * barTicks;
}

function tickToSeconds(project, tick) {
  return tick * (60 / project.basic.bpm) / project.basic.ppq;
}

// パートごとの基本の音量（ミュートでないときの値）。メインメロディは少し控えめにして、コード・ベースと混ざりやすくする
const PART_LEVEL = Object.freeze({ chord: 1, melody: 0.8, bass: 1, drums: 1, counter: 1 });
const partLevel = (role) => PART_LEVEL[role] ?? 1;

function createGain(context, destination, amount) {
  const gain = context.createGain();
  gain.gain.value = amount;
  gain.connect(destination);
  return gain;
}

// 声・弦などの重ね合わせ / ビブラート / 母音は、Presetが持っているときだけ使う（無ければ従来どおり波形1つ）
export function scheduleTone(context, destination, activeSources, {
  pitch,
  startTime,
  duration,
  type = "sine",
  gain = 0.08,
  filter = 12000,
  attack = 0.004,
  release = 0.03,
  layers = null,
  vibrato = null,
  formants = null
}) {
  const voiceGain = context.createGain();
  const toneFilter = context.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = filter;
  toneFilter.Q.value = 0.45;
  const safeDuration = Math.max(0.03, duration);
  const stopTime = startTime + safeDuration + 0.02;
  const baseFrequency = midiToFrequency(pitch);

  // 入口（oscillatorの合流点）→ 母音の山 → ローパス → 音量
  let input;
  if (!layers && !vibrato && !formants) {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = baseFrequency;
    oscillator.connect(toneFilter);
    oscillator.start(startTime);
    oscillator.stop(stopTime);
    activeSources.add(oscillator);
    input = null;
  } else {
    input = context.createGain();
    const parts = layers?.length ? layers : [{ type, gain: 1 }];

    // ビブラートのLFOは1音につき1つだけ作り、全レイヤーで共有する（端末負荷を抑える）。
    // 少し遅れてから揺れ始める（声のビブラートのように）
    let vibratoGain = null;
    if (vibrato) {
      const lfo = context.createOscillator();
      vibratoGain = context.createGain();
      const delay = vibrato.delay ?? 0.2;
      lfo.frequency.value = vibrato.rate;
      vibratoGain.gain.setValueAtTime(0, startTime);
      vibratoGain.gain.setValueAtTime(0, startTime + delay);
      vibratoGain.gain.linearRampToValueAtTime(vibrato.depth, startTime + delay + 0.25);
      lfo.connect(vibratoGain);
      lfo.start(startTime);
      lfo.stop(stopTime);
      activeSources.add(lfo);
    }

    parts.forEach((part) => {
      const oscillator = context.createOscillator();
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
      activeSources.add(oscillator);
    });

    let node = input;
    (formants ?? []).forEach((formant) => {
      const peak = context.createBiquadFilter();
      peak.type = "peaking";
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
  const oscillator = context.createOscillator();
  const gain = createGain(context, destination, 0.34);
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.12);
  gain.gain.setValueAtTime(0.34, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.16);
  activeSources.add(oscillator);
}

function scheduleNoiseHit(context, destination, activeSources, startTime, {
  duration,
  gainAmount,
  highpass
}) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  const gain = createGain(context, destination, gainAmount);
  gain.gain.setValueAtTime(gainAmount, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(filter);
  filter.connect(gain);
  source.start(startTime);
  source.stop(startTime + duration);
  activeSources.add(source);
}

// buses: パート別の出力先（{chord, melody, bass, drums}）。ミュートは各busのgainで行う
function scheduleProject(context, buses, activeSources, project, startTime) {
  const chordSound = resolveSoundProfile(project.instruments, "chord");
  const melodySound = resolveSoundProfile(project.instruments, "melody");
  const bassSound = resolveSoundProfile(project.instruments, "bass");
  const backingPattern = getBackingPatternSelection(project.instruments);

  project.chords.forEach((chord) => {
    const chordStart = startTime + tickToSeconds(project, chord.startTick);
    const chordDuration = tickToSeconds(project, chord.durationTick);
    const intervals = chordIntervals(chord.quality);
    const backingEvents = buildBackingEvents(backingPattern, intervals);

    backingEvents.forEach((event) => {
      const eventStart = chordStart + chordDuration * event.offset;
      const eventDuration = Math.max(0.04, chordDuration * event.duration * 0.92);

      event.intervals.forEach((interval) => {
        scheduleTone(context, buses.chord, activeSources, {
          // Demo Player only: use a phone-speaker-friendly voicing one octave above
          // the original preview. Project/MIDI pitch data is not changed.
          pitch: 60 + chord.root + interval,
          startTime: eventStart,
          duration: eventDuration,
          type: chordSound.waveform,
          gain: Math.min(0.35, chordSound.gain * event.accent),
          filter: chordSound.filter,
          attack: chordSound.attack,
          release: chordSound.release,
          layers: chordSound.layers,
          vibrato: chordSound.vibrato,
          formants: chordSound.formants
        });
      });
    });
  });

  project.tracks.forEach((track) => {
    (track.notes ?? []).forEach((note) => {
      const noteStart = startTime + tickToSeconds(project, note.startTick);
      const duration = Math.max(0.04, tickToSeconds(project, note.durationTick) * 0.92);

      if (track.role === "melody") {
        scheduleTone(context, buses.melody, activeSources, {
          pitch: note.pitch,
          startTime: noteStart,
          duration,
          type: melodySound.waveform,
          gain: melodySound.gain,
          filter: melodySound.filter,
          attack: melodySound.attack,
          release: melodySound.release,
          layers: melodySound.layers,
          vibrato: melodySound.vibrato,
          formants: melodySound.formants
        });
        return;
      }

      if (track.role === "counter") {
        // 裏メロ: Melodyと同じ音色の方向性で、少し控えめに鳴らす
        scheduleTone(context, buses.counter, activeSources, {
          pitch: note.pitch,
          startTime: noteStart,
          duration,
          type: melodySound.waveform,
          gain: melodySound.gain * 0.7,
          filter: melodySound.filter,
          attack: melodySound.attack,
          release: melodySound.release,
          layers: melodySound.layers,
          vibrato: melodySound.vibrato,
          formants: melodySound.formants
        });
        return;
      }

      if (track.role === "bass") {
        scheduleTone(context, buses.bass, activeSources, {
          pitch: note.pitch,
          startTime: noteStart,
          duration,
          type: bassSound.waveform,
          gain: bassSound.gain,
          filter: bassSound.filter,
          attack: bassSound.attack,
          release: bassSound.release,
          layers: bassSound.layers
        });
        return;
      }

      if (track.role === "drums") {
        if (note.pitch === 36) {
          scheduleKick(context, buses.drums, activeSources, noteStart);
        } else if (note.pitch === 38) {
          scheduleNoiseHit(context, buses.drums, activeSources, noteStart, {
            duration: 0.12,
            gainAmount: 0.18,
            highpass: 900
          });
        } else if (note.pitch === 42) {
          scheduleNoiseHit(context, buses.drums, activeSources, noteStart, {
            duration: 0.045,
            gainAmount: 0.11,
            highpass: 5000
          });
        }
      }
    });
  });
}

export function createDemoPlayer({ onStateChange } = {}) {
  let context = null;
  let masterGain = null;
  let buses = null;
  // パートごとのミュート状態（再生の聴き分け用。プロジェクトには保存しない）
  const mutedParts = { chord: false, melody: false, bass: false, drums: false, counter: false };
  let activeSources = new Set();
  let playing = false;
  let loop = false;
  let startTime = 0;
  let duration = 0;
  let positionTimer = null;
  let endTimer = null;
  let currentProject = null;
  let currentLengthTick = null;
  let currentRefresh = null;

  function emit() {
    const position = playing && context
      ? Math.min(duration, Math.max(0, context.currentTime - startTime))
      : 0;

    onStateChange?.({ playing, loop, position, duration });
  }

  function clearTimers() {
    if (positionTimer) clearInterval(positionTimer);
    if (endTimer) clearTimeout(endTimer);
    positionTimer = null;
    endTimer = null;
  }

  function stopSources() {
    activeSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source may already have ended.
      }
    });
    activeSources.clear();
  }

  function stop({ notify = true } = {}) {
    clearTimers();
    stopSources();
    playing = false;
    startTime = 0;
    duration = 0;
    if (notify) emit();
  }

  async function ensureContext() {
    if (!context) {
      const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("このブラウザではWeb Audioを利用できません。");
      }

      context = new AudioContextClass({ latencyHint: "interactive" });
      masterGain = context.createGain();
      masterGain.gain.value = 1;

      buses = {};
      PART_ROLES.forEach((role) => {
        buses[role] = context.createGain();
        buses[role].gain.value = mutedParts[role] ? 0 : partLevel(role);
        buses[role].connect(masterGain);
      });

      // Raise the average level before dynamics processing instead of applying
      // a large gain after it. This keeps Android phone-speaker playback louder
      // without the hard clipping heard in the raw 2x-output test.
      const loudnessGain = context.createGain();
      loudnessGain.gain.value = 2.4;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 6;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.16;

      // A second, fast stage behaves like a simple limiter for transient peaks.
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.1;

      const outputGain = context.createGain();
      outputGain.gain.value = 0.92;

      masterGain.connect(loudnessGain);
      loudnessGain.connect(compressor);
      compressor.connect(limiter);
      limiter.connect(outputGain);
      outputGain.connect(context.destination);
    }

    if (context.state !== "running") {
      await context.resume();
    }

    if (context.state !== "running") {
      const silentBuffer = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(masterGain);
      source.start(0);
      await context.resume();
    }

    if (context.state !== "running") {
      throw new Error("音声エンジンを開始できません。メディア音量とChromeの音声設定を確認してください。");
    }
  }

  // lengthTickを渡すと、中身の末尾ではなくその長さで再生する（Section再生で末尾の空き小節も含めるため）
  // refreshを渡すと、Loopで次の周に入るときに呼んで、最新の { project, lengthTick } で鳴らし直す
  // （再生中に編集したコード・メロディなどを、Stopしなくても次の周から聴けるように）。nullを返すか失敗したら前の内容で続ける。
  async function play(project, { lengthTick = null, refresh = null } = {}) {
    stop({ notify: false });
    await ensureContext();

    currentProject = structuredClone(project);
    currentLengthTick = lengthTick;
    currentRefresh = refresh;
    duration = tickToSeconds(currentProject, lengthTick ?? projectEndTick(currentProject));
    startTime = context.currentTime + 0.06;
    activeSources = new Set();
    scheduleProject(context, buses, activeSources, currentProject, startTime);
    playing = true;
    emit();

    positionTimer = setInterval(emit, 100);
    endTimer = setTimeout(async () => {
      if (!playing) return;
      const shouldLoop = loop;
      const refreshNow = currentRefresh;
      stop({ notify: !shouldLoop });
      if (shouldLoop && currentProject) {
        try {
          let latest = null;
          try {
            latest = refreshNow ? refreshNow() : null;
          } catch {
            latest = null; // 最新を作れないときは、前の内容で続ける
          }
          await play(latest?.project ?? currentProject, {
            lengthTick: latest ? (latest.lengthTick ?? null) : currentLengthTick,
            refresh: refreshNow
          });
        } catch {
          stop();
        }
      }
    }, Math.max(0, (duration + 0.08) * 1000));
  }

  function setLoop(value) {
    loop = Boolean(value);
    emit();
  }

  return {
    play,
    stop,
    setLoop,
    // 再生中でもすぐ反映される（パートのgainを切り替えるだけ。Position / 再生は止まらない）
    setPartMuted(role, muted) {
      if (!PART_ROLES.includes(role)) return;
      mutedParts[role] = Boolean(muted);
      if (buses?.[role] && context) {
        buses[role].gain.setTargetAtTime(mutedParts[role] ? 0 : partLevel(role), context.currentTime, 0.01);
      }
    },
    getState() {
      return { playing, loop, position: 0, duration };
    }
  };
}
