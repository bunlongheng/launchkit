import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, DEFAULT_FEATURES, STACK_LABELS } from "../lib/buildPrompt.ts";
import type { Features } from "../lib/buildPrompt.ts";

const all = (v: boolean): Features => ({
  openSource: v, deploy: v, isPublic: v, auth: v, audit: v, onboard: v,
});

test("includes the trimmed description first", () => {
  const out = buildPrompt({ description: "  A habit tracker  ", features: DEFAULT_FEATURES, stack: "nextjs" });
  assert.ok(out.startsWith("Build the following application:\n\nA habit tracker"));
});

test("maps every option to Yes/No and Public/Private", () => {
  const off = buildPrompt({ description: "x", features: all(false), stack: "other" });
  assert.match(off, /Open source: No/);
  assert.match(off, /Deploy: No/);
  assert.match(off, /Visibility: Private/);
  assert.match(off, /Authentication: No/);
  assert.match(off, /Audit: No/);
  assert.match(off, /Onboard existing local app: No/);
  assert.match(off, /Stack: Other/);

  const on = buildPrompt({ description: "x", features: all(true), stack: "vite" });
  assert.match(on, /Open source: Yes/);
  assert.match(on, /Visibility: Public/);
  assert.match(on, /Stack: React \/ Vite/);
});

test("conditional sections appear only when enabled", () => {
  const off = buildPrompt({ description: "x", features: all(false), stack: "nextjs" });
  assert.doesNotMatch(off, /^Audit:$/m);
  assert.doesNotMatch(off, /^Onboard local app:$/m);
  assert.doesNotMatch(off, /^Deploy:$/m);

  const on = buildPrompt({ description: "x", features: all(true), stack: "nextjs" });
  assert.match(on, /^Audit:\n- Review security/m);
  assert.match(on, /^Onboard local app:\n- Inspect the existing repository first/m);
  assert.match(on, /^Deploy:\n- Add production-ready deployment configuration/m);
});

test("always ends with before/after coding steps", () => {
  const out = buildPrompt({ description: "x", features: DEFAULT_FEATURES, stack: "nextjs" });
  assert.match(out, /Before coding:\n1\. Inspect the project\./);
  assert.match(out, /After coding:\n- Run lint[\s\S]*- Summarize what changed$/);
});

test("stack labels cover every stack", () => {
  assert.deepEqual(Object.keys(STACK_LABELS).sort(), ["nextjs", "other", "vite"]);
});
