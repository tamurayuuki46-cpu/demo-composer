import assert from "node:assert/strict";
import { createDefaultProject, createProjectStore, validateProject } from "../src/core/project-state.js";
import { MAX_SECTIONS, MAX_SECTION_BARS, MAX_TOTAL_BARS, getSections } from "../src/core/section-ops.js";
import {
  SECTION_ROLES, SKELETON_RECIPES, energyShape, getSkeletonRecipe, recipeTotalBars, sectionsFromRecipe, validateRecipe
} from "../src/arrange/skeleton-recipes.js";

assert.equal(SKELETON_RECIPES.length, 8);
assert.equal(new Set(SKELETON_RECIPES.map((recipe) => recipe.id)).size, 8, "ids are unique");

for (const recipe of SKELETON_RECIPES) {
  assert.equal(validateRecipe(recipe), true, recipe.id);
  assert.ok(recipeTotalBars(recipe) <= MAX_TOTAL_BARS);
  assert.ok(recipe.sections.length <= MAX_SECTIONS);
  assert.ok(recipe.sections.every((item) => item.bars <= MAX_SECTION_BARS));
  assert.ok(recipe.sections.some((item) => item.energy === "high"), `${recipe.id} has a peak`);

  // 適用 → Project検証を通り、最後のSectionにtransitionが無い、名前は重複しない
  const sections = sectionsFromRecipe(recipe);
  assert.equal(sections.length, recipe.sections.length);
  assert.equal(sections[sections.length - 1].transition, undefined);
  assert.equal(new Set(sections.map((section) => section.id)).size, sections.length);
  assert.equal(new Set(sections.map((section) => section.name)).size, sections.length, `${recipe.id} names are unique`);
  sections.forEach((section, index) => assert.equal(section.energy, recipe.sections[index].energy));

  const store = createProjectStore(createDefaultProject());
  store.setSections(sections);
  assert.equal(validateProject(store.getSnapshot()), true);
  assert.equal(getSections(store.getSnapshot()).length, sections.length);
  store.undo();
  assert.equal(getSections(store.getSnapshot()).length, getSections(createDefaultProject()).length, "undo restores");
}

// 音符・コードは変えない
const project = createDefaultProject();
project.chords = Array.from({ length: 8 }, (_, bar) => ({ startTick: bar * 1920, durationTick: 1920, root: 0, quality: "major", degree: "I" }));
const store = createProjectStore(project);
store.setSections(sectionsFromRecipe("sad-to-release"));
assert.equal(store.getSnapshot().chords.length, 8, "chords untouched");

assert.equal(getSkeletonRecipe("nope"), null);
assert.throws(() => sectionsFromRecipe("nope"));
assert.equal(energyShape(["low", "mid", "high"]), "▂▅█");
assert.ok(Object.keys(SECTION_ROLES).length >= 7);
assert.equal(recipeTotalBars(getSkeletonRecipe("first-chorus")), 60);
console.log("Skeleton recipe smoke test passed.");
