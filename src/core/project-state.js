import { isChordQuality } from "./chord-qualities.js";
import { APP_VERSION, SCHEMA_VERSION } from "./project-schema.js";
import { applySectionVariation } from "./section-variation.js";
import { validateStructure, resizeSection, removeSection, copySection, appendSectionCopy, buildTemplateSections } from "./section-ops.js";

const KEY_NAMES = Object.freeze(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
const VALID_KEYS = new Set(KEY_NAMES);
const VALID_SCALES = new Set(["major", "minor"]);
// Undoで戻れる最大操作数。履歴はメモリ上だけに持ち、保存しない（Schema変更なし）。
export const HISTORY_LIMIT = 50;

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function createProjectId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function keyToPitchClass(key) {
  const pitchClass = KEY_NAMES.indexOf(key);
  if (pitchClass === -1) {
    throw new Error("Keyが不正です。");
  }
  return pitchClass;
}

function keyTransposeDelta(fromKey, toKey) {
  let delta = keyToPitchClass(toKey) - keyToPitchClass(fromKey);
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  return delta;
}

function transposeNotePitch(pitch, delta) {
  const nextPitch = pitch + delta;
  if (nextPitch < 0 || nextPitch > 127) {
    throw new Error("Key変更でMelody / Bassの音域がMIDI範囲外になります。該当Noteを調整してから変更してください。");
  }
  return nextPitch;
}

function transposeHarmonyForKey(project, toKey) {
  const delta = keyTransposeDelta(project.basic.key, toKey);
  const next = clone(project);
  next.basic.key = toKey;

  if (delta === 0) return next;

  next.chords = next.chords.map((chord) => ({
    ...chord,
    root: (chord.root + delta + 12) % 12
  }));

  next.tracks = next.tracks.map((track) => {
    if (track.role !== "melody" && track.role !== "bass") {
      return track;
    }

    return {
      ...track,
      notes: (track.notes ?? []).map((note) => ({
        ...note,
        pitch: transposeNotePitch(note.pitch, delta)
      }))
    };
  });

  return next;
}

export function createDefaultProject() {
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    id: createProjectId(),
    revision: 1,
    metadata: {
      title: "Untitled Project",
      genre: "",
      mood: [],
      memo: ""
    },
    basic: {
      bpm: 120,
      key: "C",
      scale: "major",
      timeSignature: "4/4",
      ppq: 480
    },
    structure: {
      sections: []
    },
    chords: [],
    tracks: [],
    instruments: [],
    progress: {},
    exportSettings: {}
  };
}

function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Project metadata is invalid.");
  }

  if (typeof metadata.title !== "string" || !metadata.title.trim()) {
    throw new Error("Project名を入力してください。");
  }

  if (metadata.title.length > 80) {
    throw new Error("Project名は80文字以内にしてください。");
  }
}

function validateBasic(basic) {
  if (!basic || typeof basic !== "object") {
    throw new Error("Project basic settings are invalid.");
  }

  if (!Number.isInteger(basic.bpm) || basic.bpm < 40 || basic.bpm > 240) {
    throw new Error("BPMは40〜240の整数で指定してください。");
  }

  if (!VALID_KEYS.has(basic.key)) {
    throw new Error("Keyが不正です。");
  }

  if (!VALID_SCALES.has(basic.scale)) {
    throw new Error("Scaleが不正です。");
  }

  if (basic.timeSignature !== "4/4") {
    throw new Error("v0.2では拍子は4/4固定です。");
  }

  if (basic.ppq !== 480) {
    throw new Error("v0.2ではPPQは480固定です。");
  }
}

function validateChords(chords) {
  if (!Array.isArray(chords)) {
    throw new Error("Chord data is invalid.");
  }

  chords.forEach((chord, index) => {
    if (!chord || typeof chord !== "object") {
      throw new Error(`Chord ${index + 1} is invalid.`);
    }

    if (!Number.isInteger(chord.root) || chord.root < 0 || chord.root > 11) {
      throw new Error(`Chord ${index + 1} root is invalid.`);
    }

    if (!isChordQuality(chord.quality)) {
      throw new Error(`Chord ${index + 1} quality is invalid.`);
    }

    if (!Number.isInteger(chord.startTick) || chord.startTick < 0) {
      throw new Error(`Chord ${index + 1} startTick is invalid.`);
    }

    if (!Number.isInteger(chord.durationTick) || chord.durationTick <= 0) {
      throw new Error(`Chord ${index + 1} durationTick is invalid.`);
    }

    if (typeof chord.degree !== "string" || !chord.degree) {
      throw new Error(`Chord ${index + 1} degree is invalid.`);
    }
  });
}

function validateNotes(notes, label = "Track") {
  if (!Array.isArray(notes)) {
    throw new Error(`${label} notes are invalid.`);
  }

  notes.forEach((note, index) => {
    if (!note || typeof note !== "object") {
      throw new Error(`${label} note ${index + 1} is invalid.`);
    }

    if (typeof note.id !== "string" || !note.id) {
      throw new Error(`${label} note ${index + 1} id is invalid.`);
    }

    if (!Number.isInteger(note.pitch) || note.pitch < 0 || note.pitch > 127) {
      throw new Error(`${label} note ${index + 1} pitch is invalid.`);
    }

    if (!Number.isInteger(note.startTick) || note.startTick < 0) {
      throw new Error(`${label} note ${index + 1} startTick is invalid.`);
    }

    if (!Number.isInteger(note.durationTick) || note.durationTick <= 0) {
      throw new Error(`${label} note ${index + 1} durationTick is invalid.`);
    }

    if (!Number.isInteger(note.velocity) || note.velocity < 1 || note.velocity > 127) {
      throw new Error(`${label} note ${index + 1} velocity is invalid.`);
    }
  });
}

function validateTracks(tracks) {
  if (!Array.isArray(tracks)) {
    throw new Error("Track data is invalid.");
  }

  tracks.forEach((track, index) => {
    if (!track || typeof track !== "object" || typeof track.role !== "string" || !track.role) {
      throw new Error(`Track ${index + 1} is invalid.`);
    }

    validateNotes(track.notes ?? [], `Track ${index + 1}`);
  });
}

function validateInstruments(instruments) {
  if (!Array.isArray(instruments)) {
    throw new Error("Instrument data is invalid.");
  }

  const seenParts = new Set();
  instruments.forEach((instrument, index) => {
    if (!instrument || typeof instrument !== "object") {
      throw new Error(`Instrument ${index + 1} is invalid.`);
    }

    if (typeof instrument.part !== "string" || !instrument.part) {
      throw new Error(`Instrument ${index + 1} part is invalid.`);
    }

    if (seenParts.has(instrument.part)) {
      throw new Error(`Instrument part ${instrument.part} is duplicated.`);
    }
    seenParts.add(instrument.part);

    if (typeof instrument.preset !== "string" || !instrument.preset) {
      throw new Error(`Instrument ${index + 1} preset is invalid.`);
    }

    if (typeof instrument.tone !== "string" || !instrument.tone) {
      throw new Error(`Instrument ${index + 1} tone is invalid.`);
    }
  });
}

function getTrackNotes(project, role) {
  return project.tracks.find((track) => track.role === role)?.notes ?? [];
}

function hasHarmonyDependentContent(project) {
  return project.chords.length > 0 ||
    getTrackNotes(project, "melody").length > 0 ||
    getTrackNotes(project, "bass").length > 0;
}

function trackDefaults(role) {
  if (role === "melody") {
    return { role, name: "Melody", midiChannel: 2, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes: [] };
  }

  if (role === "bass") {
    return { role, name: "Bass", midiChannel: 3, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes: [] };
  }

  if (role === "drums") {
    return {
      role,
      name: "Drums",
      midiChannel: 10,
      instrumentId: null,
      mute: false,
      solo: false,
      volume: 1,
      pan: 0,
      drumMap: { kick: 36, snare: 38, closedHH: 42 },
      notes: []
    };
  }

  return { role, name: role, midiChannel: 1, instrumentId: null, mute: false, solo: false, volume: 1, pan: 0, notes: [] };
}

function upsertTrackNotes(project, role, notes) {
  const trackIndex = project.tracks.findIndex((track) => track.role === role);
  const nextTrack = {
    ...(trackIndex === -1 ? trackDefaults(role) : project.tracks[trackIndex]),
    notes: clone(notes)
  };

  if (trackIndex === -1) {
    project.tracks.push(nextTrack);
  } else {
    project.tracks[trackIndex] = nextTrack;
  }
}

export function validateProject(project) {
  if (!project || typeof project !== "object") {
    throw new Error("Project data is invalid.");
  }

  if (project.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion: ${project.schemaVersion}`);
  }

  validateMetadata(project.metadata);
  validateBasic(project.basic);
  validateChords(project.chords);
  validateTracks(project.tracks);
  validateStructure(project.structure);
  validateInstruments(project.instruments ?? []);

  if (!Number.isInteger(project.revision) || project.revision < 1) {
    throw new Error("Project revision is invalid.");
  }

  return true;
}

export function createProjectStore(initialProject = createDefaultProject()) {
  let state = clone(initialProject);
  const listeners = new Set();
  const undoStack = [];
  const redoStack = [];

  validateProject(state);

  function emit() {
    const snapshot = clone(state);
    listeners.forEach((listener) => listener(snapshot));
  }

  // 通常の編集はすべてここを通す。直前のProjectを履歴へ積み、Redo履歴は捨てる。
  function commit(next) {
    undoStack.push(state);
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack.length = 0;
    state = next;
    emit();
  }

  // Undo / Redoは過去のデータへ戻すが、revisionは保存の新旧判定に使うため増やし続ける。
  function restore(snapshot) {
    state = { ...clone(snapshot), revision: state.revision + 1 };
    emit();
  }

  function applySectionOp(next) {
    next.revision = state.revision + 1;
    validateProject(next);
    commit(next);
    return clone(state);
  }

  return {
    getSnapshot() {
      return clone(state);
    },

    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError("listener must be a function");
      }

      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    updateHub({ metadata = {}, basic = {} } = {}) {
      const keyChanged = Object.hasOwn(basic, "key") && basic.key !== state.basic.key;
      const scaleChanged = Object.hasOwn(basic, "scale") && basic.scale !== state.basic.scale;

      if (scaleChanged && hasHarmonyDependentContent(state)) {
        throw new Error("コード・メロディ・ベースがある間はScaleを変更できません。関連データをクリアしてから変更してください。");
      }

      const next = keyChanged
        ? transposeHarmonyForKey(state, basic.key)
        : clone(state);

      next.metadata = {
        ...next.metadata,
        ...metadata
      };

      next.basic = {
        ...next.basic,
        ...basic
      };

      next.revision = state.revision + 1;
      validateProject(next);

      commit(next);

      return clone(state);
    },

    updateChords(chords) {
      if (getTrackNotes(state, "bass").length > 0) {
        throw new Error("Bassがある間はChordを変更できません。RhythmでBassをClearしてから変更してください。");
      }

      const next = clone(state);
      next.chords = clone(chords);
      validateChords(next.chords);

      next.revision = state.revision + 1;
      commit(next);

      return clone(state);
    },

    updateMelodyNotes(notes) {
      const next = clone(state);
      const nextNotes = clone(notes);
      validateNotes(nextNotes, "Melody");
      upsertTrackNotes(next, "melody", nextNotes);
      validateTracks(next.tracks);

      next.revision = state.revision + 1;
      commit(next);

      return clone(state);
    },

    // Section（曲の構成）。Chord/Melody/Bass/Drumsを一緒にずらすためCoreのGlobal Operationとして扱う。
    setSections(sections) {
      const next = clone(state);
      next.structure = { ...(next.structure ?? {}), sections: clone(sections) };
      validateStructure(next.structure);
      next.revision = state.revision + 1;
      commit(next);
      return clone(state);
    },

    applySectionTemplate(templateId) {
      return this.setSections(buildTemplateSections(templateId));
    },

    resizeSection(index, bars) {
      return applySectionOp(resizeSection(state, index, bars));
    },

    removeSection(index) {
      return applySectionOp(removeSection(state, index));
    },

    copySection(fromIndex, toIndex) {
      return applySectionOp(copySection(state, fromIndex, toIndex));
    },

    // Sectionを末尾に足して、fromIndexの中身をコピーする（1回の編集）。ループから曲に増やすときに使う。
    appendSectionCopy(fromIndex, kind) {
      return applySectionOp(appendSectionCopy(state, fromIndex, kind));
    },

    // Sectionに「少し違う版」の候補を当てる。変更が無いときは履歴を増やさず、changed=0を返す。
    applySectionVariation(index, variationId) {
      const result = applySectionVariation(state, index, variationId);
      if (result.changed === 0) return { changed: 0 };
      applySectionOp(clone(result.project));
      return { changed: result.changed };
    },

    // project.jsonの読み込み。現在のProjectのidは維持し、中身だけを置き換える（Undoで戻せる）。
    replaceProject(project) {
      const next = clone(project);
      next.id = state.id;
      next.revision = state.revision + 1;
      validateProject(next);
      commit(next);
      return clone(state);
    },

    undo() {
      if (undoStack.length === 0) return null;
      redoStack.push(state);
      restore(undoStack.pop());
      return clone(state);
    },

    redo() {
      if (redoStack.length === 0) return null;
      undoStack.push(state);
      restore(redoStack.pop());
      return clone(state);
    },

    getHistoryState() {
      return {
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undoCount: undoStack.length,
        redoCount: redoStack.length
      };
    },

    // Hubの「出発点」: 基本設定・コード・ドラム・音色/伴奏をまとめて1回の編集（Undo1回分）で反映する。
    // 値の組み立ては呼び出し側（src/hub/starting-point.js）。ここでは検証して確定するだけ。
    applyStartingPoint({ metadata = {}, basic = {}, chords, drumNotes, instruments } = {}) {
      if (getTrackNotes(state, "bass").length > 0) {
        throw new Error("Bassがある間は出発点を入れられません。RhythmでBassをClearしてから実行してください。");
      }

      const next = clone(state);
      next.metadata = { ...next.metadata, ...metadata };
      next.basic = { ...next.basic, ...basic };
      if (chords) next.chords = clone(chords);
      if (drumNotes) {
        validateNotes(drumNotes, "Drums");
        upsertTrackNotes(next, "drums", drumNotes);
      }
      if (instruments) next.instruments = clone(instruments);

      return applySectionOp(next);
    },

    updateInstruments(instruments) {
      const next = clone(state);
      next.instruments = clone(instruments);
      validateInstruments(next.instruments);

      next.revision = state.revision + 1;
      commit(next);

      return clone(state);
    },

    updateRhythmNotes({ bassNotes = [], drumNotes = [] } = {}) {
      const next = clone(state);
      const nextBass = clone(bassNotes);
      const nextDrums = clone(drumNotes);

      validateNotes(nextBass, "Bass");
      validateNotes(nextDrums, "Drums");
      upsertTrackNotes(next, "bass", nextBass);
      upsertTrackNotes(next, "drums", nextDrums);
      validateTracks(next.tracks);

      next.revision = state.revision + 1;
      commit(next);

      return clone(state);
    }
  };
}
