import { chordIntervals } from "../core/chord-qualities.js";

function midiToFrequency(pitch) {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

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
  type = "sine",
  gain = 0.08
}) {
  const oscillator = context.createOscillator();
  const voiceGain = createGain(context, destination, gain);
  oscillator.type = type;
  oscillator.frequency.value = midiToFrequency(pitch);
  oscillator.connect(voiceGain);

  const releaseStart = Math.max(startTime, startTime + duration - 0.03);
  voiceGain.gain.setValueAtTime(gain, startTime);
  voiceGain.gain.setValueAtTime(gain, releaseStart);
  voiceGain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
  activeSources.add(oscillator);
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

function scheduleProject(context, masterGain, activeSources, project, startTime) {
  project.chords.forEach((chord) => {
    const chordStart = startTime + tickToSeconds(project, chord.startTick);
    const duration = Math.max(0.08, tickToSeconds(project, chord.durationTick) * 0.92);
    chordIntervals(chord.quality).forEach((interval) => {
      scheduleTone(context, masterGain, activeSources, {
        // Demo Player only: use a phone-speaker-friendly voicing one octave above
        // the original preview. Project/MIDI pitch data is not changed.
        pitch: 60 + chord.root + interval,
        startTime: chordStart,
        duration,
        type: "triangle",
        gain: 0.13
      });
    });
  });

  project.tracks.forEach((track) => {
    (track.notes ?? []).forEach((note) => {
      const noteStart = startTime + tickToSeconds(project, note.startTick);
      const duration = Math.max(0.04, tickToSeconds(project, note.durationTick) * 0.92);

      if (track.role === "melody") {
        scheduleTone(context, masterGain, activeSources, {
          pitch: note.pitch,
          startTime: noteStart,
          duration,
          type: "triangle",
          gain: 0.18
        });
        return;
      }

      if (track.role === "bass") {
        scheduleTone(context, masterGain, activeSources, {
          pitch: note.pitch,
          startTime: noteStart,
          duration,
          // Triangle keeps the actual bass pitch while adding harmonics that
          // small phone speakers reproduce more clearly than a pure sine.
          type: "triangle",
          gain: 0.25
        });
        return;
      }

      if (track.role === "drums") {
        if (note.pitch === 36) {
          scheduleKick(context, masterGain, activeSources, noteStart);
        } else if (note.pitch === 38) {
          scheduleNoiseHit(context, masterGain, activeSources, noteStart, {
            duration: 0.12,
            gainAmount: 0.18,
            highpass: 900
          });
        } else if (note.pitch === 42) {
          scheduleNoiseHit(context, masterGain, activeSources, noteStart, {
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
  let activeSources = new Set();
  let playing = false;
  let loop = false;
  let startTime = 0;
  let duration = 0;
  let positionTimer = null;
  let endTimer = null;
  let currentProject = null;

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

  async function play(project) {
    stop({ notify: false });
    await ensureContext();

    currentProject = structuredClone(project);
    duration = tickToSeconds(currentProject, projectEndTick(currentProject));
    startTime = context.currentTime + 0.06;
    activeSources = new Set();
    scheduleProject(context, masterGain, activeSources, currentProject, startTime);
    playing = true;
    emit();

    positionTimer = setInterval(emit, 100);
    endTimer = setTimeout(async () => {
      if (!playing) return;
      const shouldLoop = loop;
      stop({ notify: !shouldLoop });
      if (shouldLoop && currentProject) {
        try {
          await play(currentProject);
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
    getState() {
      return { playing, loop, position: 0, duration };
    }
  };
}
