import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

const NAME = "Habit Kit";
const DESCRIPTION = "A habit tracker with streaks and reminders.";

// Steps 3 and 4 start folded at phone widths. The toggle is not rendered at all
// from md up, so on desktop this is a no-op.
const expand = async (page: Page, name: RegExp) => {
  const toggle = page.getByRole("button", { name });
  if (!(await toggle.isVisible())) return;
  if ((await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
};

test("builds, copies and invalidates a prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const generate = page.getByRole("button", { name: /Generate Prompt/ });
  const output = page.getByRole("textbox", { name: "Then build the app" });
  // The step rail only exists once something has been generated. The title half of
  // each tab label is hidden at phone widths, so match on the short label.
  const tab = (name: RegExp) => page.getByRole("tab", { name });

  // The output panel is not rendered at all until something has been generated.
  await expect(page.getByText("Add a name and a description to generate")).toBeVisible();
  await expect(output).toHaveCount(0);

  // Clicking while incomplete must flag the missing field and move focus to it.
  const nameField = page.getByRole("textbox", { name: "Name" });
  await generate.click();
  await expect(nameField).toBeFocused();
  await expect(nameField).toHaveAttribute("aria-invalid", "true");
  // Both empty fields are flagged, not just the one that took focus.
  await expect(page.getByText("Required", { exact: true })).toHaveCount(2);
  await expect(output).toHaveCount(0);

  // Generate needs both a name and a description; a name alone is not enough.
  await page.getByRole("textbox", { name: "Name" }).fill(NAME);
  await expect(page.getByText("Add a description to generate")).toBeVisible();
  await generate.click();
  await expect(page.getByRole("textbox", { name: "Description" })).toBeFocused();
  await page.getByRole("textbox", { name: "Description" }).fill(DESCRIPTION);
  await expect(generate).toBeEnabled();

  await expand(page, /Features/);
  await page.getByRole("switch", { name: "Auth", exact: true }).click();
  await generate.click();

  // Step 1 opens selected, since it is the one you run first. Step 2 is a click away.
  const setup = page.getByRole("textbox", { name: "Run in this tab" });
  await expect(tab(/Setup/)).toHaveAttribute("aria-selected", "true");
  await expect(setup).toContainText("_habit_kit");
  await expect(setup).toContainText("Do not build anything yet");
  await expect(output).toHaveCount(0);

  // Step 2 is the icon, pasted in the new tab before anything is built.
  await tab(/Icon/).click();
  const iconPrompt = page.getByRole("textbox", { name: "Paste in the new tab" });
  await expect(iconPrompt).toContainText('A modern 3D app icon for a tool called "Habit Kit"');
  await expect(iconPrompt).toContainText("app/icon.png");
  await expect(iconPrompt).toContainText("before the app itself is built");
  await expect(output).toHaveCount(0);

  // Step 3 is the build, same tab, once the icon is in. The arrow keys have to move
  // between steps for the rail to be a real tablist.
  await page.keyboard.press("ArrowRight");
  await expect(tab(/Build/)).toHaveAttribute("aria-selected", "true");
  await expect(output).toContainText(DESCRIPTION);
  await expect(output).toContainText("appName = Habit Kit");
  await expect(output).toContainText("App type: Web App");
  await expect(output).toContainText("Stack: Next.js");
  await expect(output).toContainText("Authentication:");
  // Audit ships on by default, so its section and skill appear without being touched.
  await expect(output).toContainText("Audit:");
  await expect(output).toContainText("Skills to run, in order:");
  await expect(output).toContainText("/repo-audit");
  // The icon is already made by this point, so the build must not redo it.
  await expect(output).toContainText("The app icon is already in the repo");

  const copy = page.getByRole("button", { name: "Copy the build prompt" });
  await copy.click();
  await expect(copy).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await output.inputValue());

  // Changing a setting must flag the on-screen prompt as out of date, otherwise
  // Copy silently hands over text that no longer matches the form.
  await expand(page, /Features/);
  const stale = page.getByText("Settings changed - regenerate");
  await expect(stale).toHaveCount(0);
  await page.getByRole("switch", { name: "Open Source", exact: true }).click();
  await expect(stale).toBeVisible();

  await page.getByRole("button", { name: /Regenerate Prompt/ }).click();
  await expect(stale).toHaveCount(0);
  await expect(output).not.toContainText("/repo-open-source-audit");
});

test("the app type radiogroup is operable with the arrow keys", async ({ page }) => {
  await page.goto("/");
  await expand(page, /App type/);
  const web = page.getByRole("radio", { name: /Web App/ });
  await expect(web).toBeChecked();

  await web.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Chrome Extension/ })).toBeChecked();
  await expect(web).not.toBeChecked();

  await page.keyboard.press("ArrowLeft");
  await expect(web).toBeChecked();
});

test("a blocked clipboard write is surfaced instead of silently doing nothing", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.goto("/");

  await page.getByRole("textbox", { name: "Name" }).fill(NAME);
  await page.getByRole("textbox", { name: "Description" }).fill(DESCRIPTION);
  await page.getByRole("button", { name: /Generate Prompt/ }).click();
  await page.getByRole("tab", { name: /Build/ }).click();
  await page.getByRole("button", { name: "Copy the build prompt" }).click();

  await expect(page.getByRole("button", { name: "Copy the build prompt" })).toContainText("Copy manually");
  await expect(page.getByText("Copying failed", { exact: false })).toBeAttached();

  // The prompt should be selected so it can still be copied by hand.
  const selected = await page.evaluate(() => {
    const el = document.activeElement as HTMLTextAreaElement | null;
    return el?.tagName === "TEXTAREA" && el.selectionEnd - el.selectionStart > 0;
  });
  expect(selected).toBe(true);
});

test("nothing is clipped and the page never scrolls sideways", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Description" }).fill(DESCRIPTION);
  await page.getByRole("textbox", { name: "Name" }).fill(NAME);
  await page.getByRole("button", { name: /Generate Prompt/ }).click();
  await page.getByRole("tab", { name: /Build/ }).click();
  await expect(page.getByRole("textbox", { name: "Then build the app" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  // Every visible label must fit its box. The app type cards were laid out 2 across
  // at phone widths and silently truncated to "Chrome Ext...".
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll("main span, main h1, main h2, main label")]
      .filter((el) => el.children.length === 0 && (el as HTMLElement).offsetParent !== null)
      // Screen-reader-only text is clipped to a 1px box on purpose.
      .filter((el) => !el.closest(".sr-only"))
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean),
  );
  expect(clipped).toEqual([]);
});

test("open source and private can never both be selected", async ({ page }) => {
  await page.goto("/");
  await expand(page, /Features/);
  const openSource = page.getByRole("switch", { name: "Open Source", exact: true });
  const isPublic = page.getByRole("switch", { name: "Public", exact: true });

  await expect(openSource).toBeChecked();
  await expect(isPublic).toBeChecked();

  // Going private has to drop open source, otherwise the prompt asks to publish a
  // repo it just said to keep private.
  await isPublic.click();
  await expect(page.getByRole("switch", { name: "Private", exact: true })).not.toBeChecked();
  await expect(openSource).not.toBeChecked();

  // And turning open source back on has to restore public.
  await openSource.click();
  await expect(openSource).toBeChecked();
  await expect(isPublic).toBeChecked();
});

// The real recogniser needs a microphone and a network speech service, so the tests
// drive a stand-in with the same shape and check the wiring around it.
const fakeSpeech = () => {
  class FakeRecognition {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    static starts = 0;
    start() {
      FakeRecognition.starts++;
      (window as unknown as { __speech?: FakeRecognition }).__speech = this;
    }
    stop() {
      this.onend?.();
    }
  }
  const w = window as unknown as Record<string, unknown>;
  w.SpeechRecognition = FakeRecognition;
  w.__starts = () => FakeRecognition.starts;
  delete w.webkitSpeechRecognition;
};

test("talking fills the description and leaves anything already typed alone", async ({ page }) => {
  await page.addInitScript(fakeSpeech);
  await page.goto("/");

  const description = page.getByRole("textbox", { name: "Description" });
  await description.fill("An app");

  const mic = page.getByRole("button", { name: "Talk instead of typing" });
  await mic.click();
  await expect(page.getByRole("button", { name: "Stop talking" })).toBeVisible();
  await expect(page.getByText("Say what you want to build", { exact: false })).toBeVisible();

  // Interim words are replaced as they settle, never appended twice.
  const say = (transcript: string, isFinal: boolean) =>
    page.evaluate(
      ({ transcript, isFinal }) => {
        const r = (window as unknown as { __speech: { onresult: (e: unknown) => void } }).__speech;
        const result = Object.assign([{ transcript }], { isFinal });
        r.onresult({ resultIndex: 0, results: Object.assign([result], { length: 1 }) });
      },
      { transcript, isFinal },
    );

  await say("that counts", false);
  await expect(description).toHaveValue("An app that counts");
  await say("that counts my chores", true);
  await expect(description).toHaveValue("An app that counts my chores");

  await page.getByRole("button", { name: "Stop talking" }).click();
  await expect(mic).toBeVisible();
});

test("generating stops the mic, so it cannot keep writing behind the prompt", async ({ page }) => {
  await page.addInitScript(fakeSpeech);
  await page.goto("/");

  await page.getByRole("textbox", { name: "Name" }).fill(NAME);
  await page.getByRole("textbox", { name: "Description" }).fill(DESCRIPTION);
  await page.getByRole("button", { name: "Talk instead of typing" }).click();
  await expect(page.getByRole("button", { name: "Stop talking" })).toBeVisible();

  await page.getByRole("button", { name: /Generate Prompt/ }).click();
  await expect(page.getByRole("button", { name: "Talk instead of typing" })).toBeVisible();
  // Stopped for good: the session ending must not start another one.
  await page.evaluate(() => (window as unknown as { __speech: { onend: () => void } }).__speech.onend());
  await expect(page.getByRole("button", { name: "Talk instead of typing" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __starts: () => number }).__starts())).toBe(1);

  // An incomplete form still stops it, since the click is what ends the dictation.
  await page.getByRole("button", { name: "Talk instead of typing" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("");
  await page.getByRole("button", { name: /Regenerate Prompt/ }).click();
  await expect(page.getByRole("button", { name: "Talk instead of typing" })).toBeVisible();
});

test("no microphone button where the browser cannot do speech", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
  });
  await page.goto("/");

  await expect(page.getByRole("textbox", { name: "Description" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Talk instead of typing/ })).toHaveCount(0);
});

test("the page is allowed to use the microphone it offers", async ({ page }) => {
  await page.goto("/");

  // Permissions-Policy: microphone=() blocks the Web Speech API in Chromium, so the
  // mic button would render and then fail with a permission error.
  const allowed = await page.evaluate(() => {
    const policy = (document as unknown as { featurePolicy?: { allowsFeature: (f: string) => boolean } }).featurePolicy;
    return policy ? policy.allowsFeature("microphone") : null;
  });
  if (allowed !== null) expect(allowed).toBe(true);
});

test("a pause does not end the dictation, only the stop button does", async ({ page }) => {
  await page.addInitScript(fakeSpeech);
  await page.goto("/");

  const description = page.getByRole("textbox", { name: "Description" });
  await page.getByRole("button", { name: "Talk instead of typing" }).click();

  const settle = (transcript: string) =>
    page.evaluate((transcript) => {
      const r = (window as unknown as { __speech: { onresult: (e: unknown) => void } }).__speech;
      r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript }], { isFinal: true })] });
    }, transcript);

  // The browser ends a session on its own after a pause. That must start the next
  // one, keep what was said, and leave the button in its listening state.
  await settle("an app for my dinosaur");
  await page.evaluate(() => (window as unknown as { __speech: { onend: () => void } }).__speech.onend());
  await expect(page.getByRole("button", { name: "Stop talking" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __starts: () => number }).__starts())).toBe(2);

  // The next session starts its results over; the earlier words must survive it.
  await settle("that collects stars");
  await expect(description).toHaveValue("an app for my dinosaur that collects stars");

  await page.getByRole("button", { name: "Stop talking" }).click();
  await page.evaluate(() => (window as unknown as { __speech: { onend: () => void } }).__speech.onend());
  await expect(page.getByRole("button", { name: "Talk instead of typing" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __starts: () => number }).__starts())).toBe(2);
});
