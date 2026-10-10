const APP_VERSION = "v0.1-dev";
const SCHEMA_VERSION = 1;

const VALID_KEYS = new Set(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
const VALID_SCALES = new Set(["major", "minor"]);

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
    throw new Error("v0.1では拍子は4/4固定です。");
  }

  if (basic.ppq !== 480) {
    throw new Error("v0.1ではPPQは480固定です。");
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

  if (!Number.isInteger(project.revision) || project.revision < 1) {
    throw new Error("Project revision is invalid.");
  }

  return true;
}

export function createProjectStore(initialProject = createDefaultProject()) {
  let state = clone(initialProject);
  const listeners = new Set();

  validateProject(state);

  function emit() {
    const snapshot = clone(state);
    listeners.forEach((listener) => listener(snapshot));
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
      const next = clone(state);

      next.metadata = {
        ...next.metadata,
        ...metadata
      };

      next.basic = {
        ...next.basic,
        ...basic
      };

      validateMetadata(next.metadata);
      validateBasic(next.basic);

      next.revision = state.revision + 1;
      state = next;
      emit();

      return clone(state);
    }
  };
}
