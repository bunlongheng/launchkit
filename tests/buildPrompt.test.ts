import { test } from "node:test";
import assert from "node:assert/strict";
import { aliasFor, APP_TYPES, buildPrompt, buildSetupPrompt, DEFAULT_FEATURES } from "../lib/buildPrompt.ts";
import type { Features } from "../lib/buildPrompt.ts";

const all = (v: boolean): Features => ({
  openSource: v, deploy: v, isPublic: v, auth: v, audit: v, onboard: v,
});

test("the setup prompt names the alias and stops before building", () => {
  const out = buildSetupPrompt("  Ice Creams  ");
  assert.ok(out.startsWith("appName = Ice Creams"), "the name leads, trimmed");
  assert.match(out, /Create a new GitHub repo for it\./);
  // The alias must be identical in the step that creates it and the step that runs it.
  assert.match(out, /Add the Claude tab alias `_ice_creams`\./);
  assert.match(out, /run `_ice_creams`, and confirm the tab opens/);
  assert.match(out, /Do not build anything yet/);
});

test("the tab alias uses underscores only, never a dash", () => {
  for (const name of ["Ice Creams", "Habit-Kit", "  my cool app 2  ", "LaunchKit"]) {
    const alias = aliasFor(name);
    assert.ok(alias.startsWith("_"), `${name} alias must start with an underscore`);
    assert.doesNotMatch(alias, /-/, `${name} alias must not contain a dash`);
    assert.match(alias, /^_[a-z0-9_]+$/, `${name} alias must be shell-safe`);
  }
});

test("the build prompt leads with the name, then the trimmed description", () => {
  const out = buildPrompt({ name: "  Ice Creams  ", description: "  A habit tracker  ", features: DEFAULT_FEATURES, appType: "web" });
  assert.ok(out.startsWith("appName = Ice Creams"));
  assert.match(out, /Build the following application:\n\nA habit tracker/);
  // The bootstrap belongs to step 1 only; repeating it here would re-run the setup.
  assert.doesNotMatch(out, /Create a new GitHub repo for it\./);
});

test("maps every option to Yes/No and Public/Private", () => {
  const off = buildPrompt({ name: "Test App", description: "x", features: all(false), appType: "tui" });
  assert.match(off, /Open source: No/);
  assert.match(off, /Deploy: No/);
  assert.match(off, /Visibility: Private/);
  assert.match(off, /Authentication: No/);
  assert.match(off, /Audit: No/);
  assert.match(off, /Onboard into local apps: No/);
  assert.match(off, /App type: TUI/);
  assert.match(off, /Stack: Rust/);

  const on = buildPrompt({ name: "Test App", description: "x", features: all(true), appType: "web" });
  assert.match(on, /Open source: Yes/);
  assert.match(on, /Visibility: Public/);
  assert.match(on, /App type: Web App/);
  assert.match(on, /Stack: Next\.js/);
});

test("conditional sections appear only when enabled", () => {
  const off = buildPrompt({ name: "Test App", description: "x", features: all(false), appType: "web" });
  assert.doesNotMatch(off, /^Audit:$/m);
  assert.doesNotMatch(off, /^Onboard local app:$/m);
  assert.doesNotMatch(off, /^Deploy:$/m);
  assert.doesNotMatch(off, /^Authentication:$/m);
  assert.doesNotMatch(off, /^Open source:$/m);

  const on = buildPrompt({ name: "Test App", description: "x", features: all(true), appType: "web" });
  assert.match(on, /^Audit:\n- Review security/m);
  assert.match(on, /^Onboard local app:\n- Register the app in the local apps dashboard/m);
  assert.match(on, /^Deploy:\n- Add production-ready deployment configuration for Vercel/m);
  assert.match(on, /^Authentication:\n- Add authentication with secure, httpOnly session cookies/m);
  assert.match(on, /^Open source:\n- Publish the repository on GitHub/m);
});

test("always includes the before and after coding steps", () => {
  const out = buildPrompt({ name: "Test App", description: "x", features: DEFAULT_FEATURES, appType: "web" });
  assert.match(out, /Before coding:\n1\. Inspect the project\./);
  assert.match(out, /After coding:\n- Run lint[\s\S]*- Summarize what changed/);
});

test("skills are listed last, in run order, only for the toggles that map to one", () => {
  const none = buildPrompt({ name: "Test App", description: "x",
    features: { ...all(false), deploy: true, auth: true },
    appType: "web",
  });
  assert.doesNotMatch(none, /Skills to run/);

  const every = buildPrompt({ name: "Test App", description: "x", features: all(true), appType: "web" });
  assert.match(
    every,
    /Skills to run, in order:\n1\. \/onboard\n2\. \/repo-audit\n3\. \/repo-public-audit\n4\. \/repo-open-source-audit$/,
  );

  const one = buildPrompt({ name: "Test App", description: "x",
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
    const out = buildPrompt({ name: "Test App", description: "x", features: DEFAULT_FEATURES, appType: key });
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
    const only = buildPrompt({ name: "Test App", description: "x",
      features: { ...all(false), [key]: true },
      appType: "web",
    });
    assert.match(only, heading, `${key} on should emit its section`);

    const without = buildPrompt({ name: "Test App", description: "x",
      features: { ...all(true), [key]: false },
      appType: "web",
    });
    assert.doesNotMatch(without, heading, `${key} off should drop its section`);
  }
});
