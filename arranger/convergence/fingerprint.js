// 収束モード: 実発音Noteのfingerprint。純関数。
// 対象 = arrangedNotes() が返す「実際に鳴るNote」(補完・復元後のデータ)。
// Note IDは含めない。波形は使わない。
import { arrangedNotes } from '../src/core.js';
import { hashOf } from './canonical.js';

export const FINGERPRINT_VERSION = 1;
export const PARTS = ['melody', 'counter', 'bass', 'drums', 'harmony'];
// Level 3 の要素。要素ごとにfingerprintへ含めるPart。
export const ELEMENT_PARTS = {
  drums: ['drums'],
  counter: ['counter', 'melody', 'harmony'], // 裏メロ
};
export const ELEMENTS = Object.keys(ELEMENT_PARTS);

function clippedEvents(source, candidate, sectionId, parts) {
  const section = source.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} が見つかりません。`);
  const events = [];
  for (const part of parts) {
    for (const n of arrangedNotes(source, candidate, part)) {
      const start = Math.max(n.startTick, section.startTick);
      const end = Math.min(n.startTick + n.durationTick, section.endTick);
      if (end <= start) continue;
      events.push({
        part, pitch: Math.round(n.pitch), startTick: Math.round(start), durationTick: Math.round(end - start),
        velocity: Math.round(n.velocity || 90), voice: n.voice ?? null,
      });
    }
  }
  events.sort((a, b) => a.startTick - b.startTick || a.part.localeCompare(b.part) || a.pitch - b.pitch
    || a.durationTick - b.durationTick || a.velocity - b.velocity || String(a.voice).localeCompare(String(b.voice)));
  return events;
}

// element=null: Section全体(5Part) / 'drums' / 'counter'
export function slotFingerprint(source, candidate, sectionId, element = null) {
  const parts = element ? ELEMENT_PARTS[element] : PARTS;
  if (!parts) throw new Error(`未対応の要素です: ${element}`);
  return hashOf({ v: FINGERPRINT_VERSION, slot: element || 'section', events: clippedEvents(source, candidate, sectionId, parts) });
}

// 全体判断: SectionID -> Section fingerprint
export function globalFingerprintMap(source, candidate) {
  const map = {};
  for (const s of source.sections) map[s.id] = slotFingerprint(source, candidate, s.id, null);
  return map;
}
export function globalFingerprint(source, candidate) { return hashOf({ v: FINGERPRINT_VERSION, map: globalFingerprintMap(source, candidate) }); }

// Plan構造のfingerprint。BPM / Section名 / kind / revision / 編曲内容 / Journal / 時刻は含めない。
export function planStructureFingerprint(source) {
  return hashOf({
    v: FINGERPRINT_VERSION,
    ppq: source.basic?.ppq ?? 480,
    ts: source.basic?.timeSignature || '4/4',
    sections: source.sections.map((s) => ({ id: s.id, bars: s.bars, startTick: s.startTick, endTick: s.endTick })),
  });
}
