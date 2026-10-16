const CORE_AXES = Object.freeze([
  { id: "melody", label: "主旋律", description: "主旋律の音程・形" },
  { id: "counterMelody", label: "裏メロ", description: "対旋律・応答フレーズ" },
  { id: "harmony", label: "コード・ハーモニー", description: "コード進行・和声" },
  { id: "rhythm", label: "リズム・グルーヴ", description: "ノリ・配置・ドラム" },
  { id: "sound", label: "音色", description: "楽器・音色の選択" }
]);

export const DIVERGENCE_AXES = CORE_AXES;
export const DIVERGENCE_DISTANCE_MIN = 1;
export const DIVERGENCE_DISTANCE_MAX = 5;
export const DEFAULT_DIVERGENCE_DISTANCE = 3;

function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function hash32(input) {
  let hash = 2166136261;
  for (const char of String(input)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeSeedValue(seedValue) {
  const raw = String(seedValue ?? "").trim();
  return raw || "seed-1";
}

export function seededRandom(seedValue) {
  let state = hash32(normalizeSeedValue(seedValue)) || 0x9e3779b9;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function defaultSeed(source) {
  const basis = [
    source?.id ?? "project",
    source?.revision ?? 0,
    source?.metadata?.title ?? "",
    source?.basic?.key ?? "",
    source?.basic?.bpm ?? ""
  ].join(":");
  return `dc-${hash32(basis).toString(16).padStart(8, "0")}`;
}

function normalizeLocks(locks = {}) {
  return Object.fromEntries(CORE_AXES.map(({ id }) => [id, Boolean(locks[id])]));
}

function normalizeDistance(distance) {
  const number = Math.trunc(Number(distance));
  if (!Number.isFinite(number) || number < DIVERGENCE_DISTANCE_MIN || number > DIVERGENCE_DISTANCE_MAX) {
    throw new Error(`Divergence Distanceは${DIVERGENCE_DISTANCE_MIN}〜${DIVERGENCE_DISTANCE_MAX}で指定してください。`);
  }
  return number;
}

function nodeIdFor(parentId, seedValue, branchRound, slot) {
  return `branch-${hash32(`${parentId}:${seedValue}:${branchRound}:${slot}`).toString(16).padStart(8, "0")}`;
}

function snapshotState(session) {
  return {
    activeNodeId: session.activeNodeId,
    frozenNodeId: session.frozenNodeId,
    branchRound: session.branchRound,
    locks: clone(session.locks),
    distance: session.distance,
    nodes: clone(session.nodes)
  };
}

export function createDivergenceSession(source, {
  seedValue = defaultSeed(source),
  locks = {},
  distance = DEFAULT_DIVERGENCE_DISTANCE,
  mode = "composer",
  constraints = {}
} = {}) {
  if (!source || typeof source !== "object") throw new Error("SeedにするProjectが必要です。");
  const normalizedSeed = normalizeSeedValue(seedValue);
  const root = {
    id: "root",
    parentId: null,
    childIds: [],
    label: "Original",
    seedValue: normalizedSeed,
    operation: "seed",
    distance: 0,
    changedAxes: [],
    kept: true,
    frozen: false,
    payload: clone(source),
    meta: {}
  };
  return {
    version: 1,
    mode,
    seedValue: normalizedSeed,
    constraints: clone(constraints),
    locks: normalizeLocks(locks),
    distance: normalizeDistance(distance),
    activeNodeId: root.id,
    frozenNodeId: null,
    branchRound: 0,
    nodes: { [root.id]: root },
    snapshots: {}
  };
}

export function getDivergenceNode(session, nodeId = session?.activeNodeId) {
  const node = session?.nodes?.[nodeId];
  if (!node) throw new Error("Branchが見つかりません。");
  return node;
}

export function selectDivergenceNode(session, nodeId) {
  getDivergenceNode(session, nodeId);
  const next = clone(session);
  next.activeNodeId = nodeId;
  return next;
}

export function setDivergenceLocks(session, locks) {
  const next = clone(session);
  next.locks = normalizeLocks({ ...next.locks, ...locks });
  return next;
}

export function setDivergenceDistance(session, distance) {
  const next = clone(session);
  next.distance = normalizeDistance(distance);
  return next;
}

export function branchDivergence(session, {
  parentId = session?.activeNodeId,
  count = 5,
  distance = session?.distance ?? DEFAULT_DIVERGENCE_DISTANCE,
  locks = session?.locks ?? {},
  operation = "mutate",
  labelPrefix = "Branch",
  transform
} = {}) {
  if (typeof transform !== "function") throw new Error("Branch用のTransform関数が必要です。");
  const amount = Math.max(1, Math.min(8, Math.trunc(Number(count) || 1)));
  const next = clone(session);
  const parent = getDivergenceNode(next, parentId);
  const normalizedDistance = normalizeDistance(distance);
  const normalizedLocks = normalizeLocks(locks);
  const round = next.branchRound + 1;
  const branches = [];

  for (let slot = 0; slot < amount; slot += 1) {
    const seedValue = `${parent.seedValue}-${round}-${slot + 1}-${normalizedDistance}`;
    const random = seededRandom(seedValue);
    const context = {
      seedValue,
      random,
      distance: normalizedDistance,
      distanceRatio: normalizedDistance / DIVERGENCE_DISTANCE_MAX,
      locks: clone(normalizedLocks),
      slot,
      branchRound: round,
      constraints: clone(next.constraints)
    };
    const result = transform(clone(parent.payload), context) ?? {};
    const payload = clone(result.payload ?? result.project ?? result);
    const changedAxes = [...new Set(Array.isArray(result.changedAxes) ? result.changedAxes : [])];
    const illegal = changedAxes.filter((axis) => normalizedLocks[axis]);
    if (illegal.length > 0) throw new Error(`Lock中の軸が変更されました: ${illegal.join(", ")}`);
    const id = nodeIdFor(parent.id, seedValue, round, slot);
    const node = {
      id,
      parentId: parent.id,
      childIds: [],
      label: `${labelPrefix} ${String.fromCharCode(65 + slot)}`,
      seedValue,
      operation,
      distance: normalizedDistance,
      changedAxes,
      kept: false,
      frozen: false,
      payload,
      meta: clone(result.meta ?? {})
    };
    next.nodes[id] = node;
    next.nodes[parent.id].childIds = [...new Set([...next.nodes[parent.id].childIds, id])];
    branches.push(clone(node));
  }

  next.branchRound = round;
  next.locks = normalizedLocks;
  next.distance = normalizedDistance;
  if (branches[0]) next.activeNodeId = branches[0].id;
  return { session: next, branches };
}

export function keepDivergenceBranch(session, nodeId = session?.activeNodeId) {
  getDivergenceNode(session, nodeId);
  const next = clone(session);
  next.nodes[nodeId].kept = true;
  next.activeNodeId = nodeId;
  return next;
}

// Keepを外す。Original(root)とFreeze済みの案は外せない。派生関係・Payloadは変えない。
export function unkeepDivergenceBranch(session, nodeId = session?.activeNodeId) {
  const node = getDivergenceNode(session, nodeId);
  if (node.id === "root") throw new Error("Original（元案）のKeepは外せません。");
  if (node.frozen) throw new Error("Freeze済みの案のKeepは外せません。");
  const next = clone(session);
  next.nodes[nodeId].kept = false;
  return next;
}

// Keepライブラリの案を、現在のBranch Treeへ「Originalの子」として呼び出す。
// 同じライブラリ案は1回だけ追加し、2回目以降は選択するだけ(冪等)。branchRoundは進めない。
export function importDivergenceBranch(session, entry) {
  if (!entry || typeof entry !== "object" || !entry.id || !entry.payload || typeof entry.payload !== "object") {
    throw new Error("呼び出すKeep案のデータが不正です。");
  }
  const next = clone(session);
  const root = getDivergenceNode(next, "root");
  const id = `branch-${hash32(`library:${entry.id}`).toString(16).padStart(8, "0")}`;
  if (!next.nodes[id]) {
    next.nodes[id] = {
      id,
      parentId: root.id,
      childIds: [],
      label: `Keep: ${entry.label ?? "案"}`,
      seedValue: String(entry.seedValue ?? ""),
      operation: "library",
      distance: Number.isFinite(entry.distance) ? entry.distance : 0,
      changedAxes: Array.isArray(entry.changedAxes) ? [...entry.changedAxes] : [],
      kept: true,
      frozen: false,
      payload: clone(entry.payload),
      meta: {
        summary: entry.summary ?? "",
        fromLibrary: true,
        libraryId: entry.id,
        sourceRevision: entry.sourceRevision ?? null
      }
    };
    next.nodes[root.id].childIds = [...new Set([...next.nodes[root.id].childIds, id])];
  }
  next.activeNodeId = id;
  return { session: next, node: clone(next.nodes[id]) };
}

export function snapshotDivergence(session, label = "") {
  const next = clone(session);
  const id = `snapshot-${next.branchRound}-${Object.keys(next.snapshots).length + 1}`;
  next.snapshots[id] = {
    id,
    label: String(label || `Snapshot ${Object.keys(next.snapshots).length + 1}`),
    seedValue: getDivergenceNode(next).seedValue,
    state: snapshotState(next)
  };
  return { session: next, snapshot: clone(next.snapshots[id]) };
}

export function restoreDivergenceSnapshot(session, snapshotId) {
  const snapshot = session?.snapshots?.[snapshotId];
  if (!snapshot) throw new Error("Snapshotが見つかりません。");
  const next = clone(session);
  const state = clone(snapshot.state);
  next.activeNodeId = state.activeNodeId;
  next.frozenNodeId = state.frozenNodeId;
  next.branchRound = state.branchRound;
  next.locks = state.locks;
  next.distance = state.distance;
  next.nodes = state.nodes;
  return next;
}

export function freezeDivergenceBranch(session, nodeId = session?.activeNodeId) {
  getDivergenceNode(session, nodeId);
  const next = clone(session);
  Object.values(next.nodes).forEach((node) => { node.frozen = false; });
  next.nodes[nodeId].frozen = true;
  next.nodes[nodeId].kept = true;
  next.activeNodeId = nodeId;
  next.frozenNodeId = nodeId;
  return { session: next, project: clone(next.nodes[nodeId].payload), node: clone(next.nodes[nodeId]) };
}

export function branchTree(session) {
  const walk = (id, depth = 0) => {
    const node = getDivergenceNode(session, id);
    return [
      {
        id: node.id,
        parentId: node.parentId,
        label: node.label,
        depth,
        seedValue: node.seedValue,
        distance: node.distance,
        changedAxes: clone(node.changedAxes),
        kept: node.kept,
        frozen: node.frozen
      },
      ...node.childIds.flatMap((childId) => walk(childId, depth + 1))
    ];
  };
  return walk("root");
}
