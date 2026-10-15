import assert from "node:assert/strict";
import {
  branchDivergence,
  branchTree,
  createDivergenceSession,
  freezeDivergenceBranch,
  keepDivergenceBranch,
  restoreDivergenceSnapshot,
  seededRandom,
  snapshotDivergence
} from "../src/core/divergence.js";

const project = {
  id: "p1",
  revision: 7,
  metadata: { title: "Seed" },
  basic: { key: "C", bpm: 120 },
  value: 10
};

const a = seededRandom("same");
const b = seededRandom("same");
assert.deepEqual([a(), a(), a()], [b(), b(), b()]);

const session = createDivergenceSession(project, {
  seedValue: "demo-seed",
  locks: { melody: true },
  distance: 3
});
const generated = branchDivergence(session, {
  count: 3,
  transform: (payload, context) => ({
    payload: { ...payload, value: payload.value + 1 + Math.floor(context.random() * 5) },
    changedAxes: ["harmony"]
  })
});
assert.equal(generated.branches.length, 3);
assert.equal(generated.session.nodes.root.payload.value, 10);
assert.notEqual(generated.branches[0].payload, project);

const repeated = branchDivergence(session, {
  count: 3,
  transform: (payload, context) => ({
    payload: { ...payload, value: payload.value + 1 + Math.floor(context.random() * 5) },
    changedAxes: ["harmony"]
  })
});
assert.deepEqual(
  generated.branches.map((node) => node.payload.value),
  repeated.branches.map((node) => node.payload.value)
);

assert.throws(() => branchDivergence(session, {
  transform: (payload) => ({ payload, changedAxes: ["melody"] })
}), /Lock中/);

let kept = keepDivergenceBranch(generated.session, generated.branches[1].id);
assert.equal(kept.nodes[generated.branches[1].id].kept, true);

const snap = snapshotDivergence(kept, "before-deep-branch");
const child = branchDivergence(snap.session, {
  parentId: generated.branches[1].id,
  count: 2,
  distance: 5,
  transform: (payload) => ({
    payload: { ...payload, value: payload.value + 100 },
    changedAxes: ["rhythm"]
  })
});
assert.ok(branchTree(child.session).length > branchTree(snap.session).length);

const restored = restoreDivergenceSnapshot(child.session, snap.snapshot.id);
assert.equal(branchTree(restored).length, branchTree(snap.session).length);

const frozen = freezeDivergenceBranch(kept, generated.branches[1].id);
assert.equal(frozen.node.frozen, true);
assert.equal(frozen.project.value, generated.branches[1].payload.value);
frozen.project.value = 999;
assert.notEqual(kept.nodes[generated.branches[1].id].payload.value, 999);

console.log("divergence-smoke-test: ok");
