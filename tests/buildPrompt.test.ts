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

  const on = buildPrompt({ description: "x", features: all(true), stack: "nextjs" });
  assert.match(on, /Open source: Yes/);
  assert.match(on, /Visibility: Public/);
  assert.match(on, /Stack: Next\.js/);
});

test("conditional sections appear only when enabled", () => {
  const off = buildPrompt({ description: "x", features: all(false), stack: "nextjs" });
  assert.doesNotMatch(off, /^Audit:$/m);
  assert.doesNotMatch(off, /^Onboard local app:$/m);
  assert.doesNotMatch(off, /^Deploy:$/m);
  assert.doesNotMatch(off, /^Authentication:$/m);
  assert.doesNotMatch(off, /^Open source:$/m);

  const on = buildPrompt({ description: "x", features: all(true), stack: "nextjs" });
  assert.match(on, /^Audit:\n- Review security/m);
  assert.match(on, /^Onboard local app:\n- Inspect the existing repository first/m);
  assert.match(on, /^Deploy:\n- Add production-ready deployment configuration/m);
  assert.match(on, /^Authentication:\n- Add authentication with secure, httpOnly session cookies/m);
  assert.match(on, /^Open source:\n- Add an MIT LICENSE file/m);
});

test("always includes the before and after coding steps", () => {
  const out = buildPrompt({ description: "x", features: DEFAULT_FEATURES, stack: "nextjs" });
  assert.match(out, /Before coding:\n1\. Inspect the project\./);
  assert.match(out, /After coding:\n- Run lint[\s\S]*- Summarize what changed/);
});

test("skills are listed last, in run order, only for the toggles that map to one", () => {
  const none = buildPrompt({
    description: "x",
    features: { ...all(false), deploy: true, auth: true },
    stack: "nextjs",
  });
  assert.doesNotMatch(none, /Skills to run/);

  const every = buildPrompt({ description: "x", features: all(true), stack: "nextjs" });
  assert.match(
    every,
    /Skills to run, in order:\n1\. \/onboard\n2\. \/repo-audit\n3\. \/repo-public-audit\n4\. \/repo-open-source-audit$/,
  );

  const one = buildPrompt({
    description: "x",
    features: { ...all(false), audit: true },
    stack: "nextjs",
  });
  assert.match(one, /Skills to run, in order:\n1\. \/repo-audit$/);
});

test("stack labels cover every stack", () => {
  assert.deepEqual(Object.keys(STACK_LABELS).sort(), ["nextjs", "other"]);
});

test("each guidance section is driven by its own toggle alone", () => {
  const SECTIONS: [keyof Features, RegExp][] = [
    ["audit", /^Audit:$/m],
    ["onboard", /^Onboard local app:$/m],
    ["auth", /^Authentication:$/m],
    ["deploy", /^Deploy:$/m],
    ["openSource", /^Open source:$/m],
  ];

  for (const [key, heading] of SECTIONS) {
    const only = buildPrompt({
      description: "x",
      features: { ...all(false), [key]: true },
      stack: "nextjs",
    });
    assert.match(only, heading, `${key} on should emit its section`);

    const without = buildPrompt({
      description: "x",
      features: { ...all(true), [key]: false },
      stack: "nextjs",
    });
    assert.doesNotMatch(without, heading, `${key} off should drop its section`);
  }
});
