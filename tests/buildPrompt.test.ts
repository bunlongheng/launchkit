import { test } from "node:test";
import assert from "node:assert/strict";
import { APP_TYPES, buildPrompt, DEFAULT_FEATURES } from "../lib/buildPrompt.ts";
import type { Features } from "../lib/buildPrompt.ts";

const all = (v: boolean): Features => ({
  openSource: v, deploy: v, isPublic: v, auth: v, audit: v, onboard: v,
});

test("includes the trimmed description first", () => {
  const out = buildPrompt({ description: "  A habit tracker  ", features: DEFAULT_FEATURES, appType: "web" });
  assert.ok(out.startsWith("Build the following application:\n\nA habit tracker"));
});

test("maps every option to Yes/No and Public/Private", () => {
  const off = buildPrompt({ description: "x", features: all(false), appType: "tui" });
  assert.match(off, /Open source: No/);
  assert.match(off, /Deploy: No/);
  assert.match(off, /Visibility: Private/);
  assert.match(off, /Authentication: No/);
  assert.match(off, /Audit: No/);
  assert.match(off, /Onboard existing local app: No/);
  assert.match(off, /App type: TUI/);
  assert.match(off, /Stack: Rust/);

  const on = buildPrompt({ description: "x", features: all(true), appType: "web" });
  assert.match(on, /Open source: Yes/);
  assert.match(on, /Visibility: Public/);
  assert.match(on, /App type: Web App/);
  assert.match(on, /Stack: Next\.js/);
});

test("conditional sections appear only when enabled", () => {
  const off = buildPrompt({ description: "x", features: all(false), appType: "web" });
  assert.doesNotMatch(off, /^Audit:$/m);
  assert.doesNotMatch(off, /^Onboard local app:$/m);
  assert.doesNotMatch(off, /^Deploy:$/m);
  assert.doesNotMatch(off, /^Authentication:$/m);
  assert.doesNotMatch(off, /^Open source:$/m);

  const on = buildPrompt({ description: "x", features: all(true), appType: "web" });
  assert.match(on, /^Audit:\n- Review security/m);
  assert.match(on, /^Onboard local app:\n- Inspect the existing repository first/m);
  assert.match(on, /^Deploy:\n- Add production-ready deployment configuration/m);
  assert.match(on, /^Authentication:\n- Add authentication with secure, httpOnly session cookies/m);
  assert.match(on, /^Open source:\n- Add an MIT LICENSE file/m);
});

test("always includes the before and after coding steps", () => {
  const out = buildPrompt({ description: "x", features: DEFAULT_FEATURES, appType: "web" });
  assert.match(out, /Before coding:\n1\. Inspect the project\./);
  assert.match(out, /After coding:\n- Run lint[\s\S]*- Summarize what changed/);
});

test("skills are listed last, in run order, only for the toggles that map to one", () => {
  const none = buildPrompt({
    description: "x",
    features: { ...all(false), deploy: true, auth: true },
    appType: "web",
  });
  assert.doesNotMatch(none, /Skills to run/);

  const every = buildPrompt({ description: "x", features: all(true), appType: "web" });
  assert.match(
    every,
    /Skills to run, in order:\n1\. \/onboard\n2\. \/repo-audit\n3\. \/repo-public-audit\n4\. \/repo-open-source-audit$/,
  );

  const one = buildPrompt({
    description: "x",
    features: { ...all(false), audit: true },
    appType: "web",
  });
  assert.match(one, /Skills to run, in order:\n1\. \/repo-audit$/);
});

test("every app type carries a label and an implied stack", () => {
  assert.deepEqual(APP_TYPES.map((a) => a.key), ["web", "chrome", "tui", "native"]);
  for (const { key, label, stack } of APP_TYPES) {
    assert.ok(label.length > 0, `${key} needs a label`);
    assert.ok(stack.length > 0, `${key} needs a stack`);
    const out = buildPrompt({ description: "x", features: DEFAULT_FEATURES, appType: key });
    assert.match(out, new RegExp(`App type: ${label.replace(/[.]/g, "\\.")}`));
  }
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
      appType: "web",
    });
    assert.match(only, heading, `${key} on should emit its section`);

    const without = buildPrompt({
      description: "x",
      features: { ...all(true), [key]: false },
      appType: "web",
    });
    assert.doesNotMatch(without, heading, `${key} off should drop its section`);
  }
});
