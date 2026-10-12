let currentIntent = Object.freeze({
  moodValues: Object.freeze([]),
  source: "project"
});

const listeners = new Set();

function normalizeValues(values) {
  const list = Array.isArray(values) ? values : values == null ? [] : [values];
  return [...new Set(
    list
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  )];
}

function sameIntent(a, b) {
  return a.source === b.source
    && a.moodValues.length === b.moodValues.length
    && a.moodValues.every((value, index) => value === b.moodValues[index]);
}

export function getCompositionIntent() {
  return {
    moodValues: [...currentIntent.moodValues],
    source: currentIntent.source
  };
}

export function setCompositionIntent({ moodValues = [], source = "project" } = {}) {
  const next = Object.freeze({
    moodValues: Object.freeze(normalizeValues(moodValues)),
    source: String(source || "project")
  });

  if (sameIntent(currentIntent, next)) return getCompositionIntent();

  currentIntent = next;
  const snapshot = getCompositionIntent();
  listeners.forEach((listener) => listener(snapshot));
  return snapshot;
}

export function syncCompositionIntentFromProject(project) {
  return setCompositionIntent({
    moodValues: project?.metadata?.mood ?? [],
    source: "project"
  });
}

export function subscribeCompositionIntent(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  listener(getCompositionIntent());
  return () => listeners.delete(listener);
}
