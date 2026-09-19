import { test } from "node:test";
import assert from "node:assert/strict";
import { addToHistory, HISTORY_MAX, parseHistory, type HistoryEntry } from "../lib/history.ts";
import { DEFAULT_FEATURES, DEFAULT_TAB_COLOR } from "../lib/buildPrompt.ts";

const entry = (name: string, tabColor = "#112233"): HistoryEntry => ({
  name, description: "x", features: DEFAULT_FEATURES, appType: "web", tabColor, at: 1,
});

test("history keeps the newest first and stops at 10", () => {
  let list: HistoryEntry[] = [];
  for (let i = 0; i < 14; i++) list = addToHistory(list, entry(`App ${i}`));
  assert.equal(list.length, HISTORY_MAX);
  assert.equal(list[0].name, "App 13");
  assert.equal(list.at(-1)?.name, "App 4");
});

test("regenerating the same app moves it up instead of duplicating it", () => {
  const list = addToHistory(addToHistory([entry("Ice Creams")], entry("Habit Kit")), entry("ice creams", "#abcdef"));
  assert.equal(list.length, 2);
  assert.equal(list[0].tabColor, "#abcdef", "the newer record wins");
  assert.equal(list[1].name, "Habit Kit");
});

test("junk in storage reads as no history rather than throwing", () => {
  assert.deepEqual(parseHistory(null), []);
  assert.deepEqual(parseHistory("{not json"), []);
  assert.deepEqual(parseHistory('{"name":"x"}'), []);
  assert.deepEqual(parseHistory('[{"name":"x"}]'), []);
});

test("an older record is filled in, never trusted as-is", () => {
  const [restored] = parseHistory('[{"name":"Old","description":"y","tabColor":"nope"}]');
  assert.equal(restored.tabColor, DEFAULT_TAB_COLOR);
  assert.equal(restored.appType, "web");
  assert.deepEqual(restored.features, DEFAULT_FEATURES);
});
