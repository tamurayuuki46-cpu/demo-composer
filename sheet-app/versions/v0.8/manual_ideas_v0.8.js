export const MANUAL_IDEA_VERSION = 1;

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

export function normalizeManualIdeas(value, allowedSheetIds = []) {
  const allowed = new Set(allowedSheetIds);
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of value) {
    const id = clean(raw?.id, 120);
    const sheetId = clean(raw?.sheetId, 240);
    const text = clean(raw?.text, 5000);
    if (!id || !sheetId || !text || seen.has(id)) continue;
    if (allowed.size && !allowed.has(sheetId)) continue;
    seen.add(id);
    result.push({
      id,
      sheetId,
      title: clean(raw?.title, 120),
      text,
      createdAt: clean(raw?.createdAt, 40),
      updatedAt: clean(raw?.updatedAt, 40),
    });
  }
  return result;
}

export function createManualIdea(ideas, input, options = {}) {
  const text = clean(input?.text, 5000);
  const sheetId = clean(input?.sheetId, 240);
  if (!sheetId) throw new Error('追加先のシートが選ばれていません。');
  if (!text) throw new Error('アイデアを入力してください。');
  const now = options.now || new Date().toISOString();
  const id = options.id || `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return [...ideas, {
    id,
    sheetId,
    title: clean(input?.title, 120),
    text,
    createdAt: now,
    updatedAt: now,
  }];
}

export function updateManualIdea(ideas, id, patch, now = new Date().toISOString()) {
  const target = clean(id, 120);
  const text = clean(patch?.text, 5000);
  if (!text) throw new Error('アイデアを入力してください。');
  return ideas.map((idea) => idea.id === target ? {
    ...idea,
    title: clean(patch?.title, 120),
    text,
    updatedAt: now,
  } : idea);
}

export function removeManualIdea(ideas, id) {
  const target = clean(id, 120);
  return ideas.filter((idea) => idea.id !== target);
}
