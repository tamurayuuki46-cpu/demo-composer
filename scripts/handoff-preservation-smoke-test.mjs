import assert from 'node:assert/strict';
import { createDefaultProject, createProjectStore } from '../src/core/project-state.js';
import { createEmptySongProject, songProjectToDemoProject, demoProjectToSongProject } from '../src/shared/song-project.js';
import { parseProjectJson } from '../src/storage/project-import.js';

const original = createDefaultProject();
const song = createEmptySongProject({ projectId: 'received-song', title: 'Received song' });
song.analysis.keyCandidates = [{ key: 'C', confidence: 0.8 }];
song.arrangement.selectedAlternatives = { id: 'arrangement-B' };
song.intent.scene = 'A quiet evening';
song.reference.items = [{ id: 'reference-1' }];
song.assets.files = [{ id: 'asset-1', name: 'reference.wav', type: 'file', external: true }];
song.history.changes = [{ type: 'analysis', at: '2026-10-14T00:00:00Z' }];
const received = songProjectToDemoProject(song);
const store = createProjectStore(original);
store.replaceProject(received, { preserveId: false });
assert.equal(store.getSnapshot().id, song.projectId);
store.updateHub({ metadata: { title: 'Edited song' } });
// Includes the same serialization/migration boundary as backup and reload.
let restored = parseProjectJson(JSON.stringify(store.getSnapshot()));
for (let iteration = 0; iteration < 5; iteration++) {
  const output = demoProjectToSongProject(restored);
  assert.equal(output.projectId, song.projectId);
  assert.equal(output.title, 'Edited song');
  for (const field of ['analysis', 'arrangement', 'intent', 'reference', 'assets', 'history']) {
    assert.deepEqual(output[field], song[field], `${field} survives save/reload/export`);
  }
  assert.equal(output.compatibility.demoComposer.legacyProject.songProjectContext, undefined);
  restored = songProjectToDemoProject(output);
}
assert.ok(JSON.stringify(restored).length < JSON.stringify(received).length * 2, 'round trips must not recursively embed context');
restored.id = 'unrelated-project';
assert.deepEqual(demoProjectToSongProject(restored).analysis.keyCandidates, [], 'do not attach unrelated source');
const legacyStore = createProjectStore(original);
legacyStore.replaceProject(received);
assert.equal(legacyStore.getSnapshot().id, original.id, 'legacy replacement keeps existing ID');
store.undo();
store.undo();
assert.equal(store.getSnapshot().id, original.id, 'undo can return to original project');
console.log('Handoff identity, ownership, backup/reload, bounded context and legacy replacement passed');
