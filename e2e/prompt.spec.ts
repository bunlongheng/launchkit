import { expect, test } from "@playwright/test";

const NAME = "Habit Kit";
const DESCRIPTION = "A habit tracker with streaks and reminders.";

test("builds, copies and invalidates a prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const generate = page.getByRole("button", { name: /Generate Prompt/ });
  const output = page.getByRole("textbox", { name: "Paste in the new tab" });

  // The output panel is not rendered at all until something has been generated.
  await expect(page.getByText("Add a name and a description to generate")).toBeVisible();
  await expect(output).toHaveCount(0);

  // Clicking while incomplete must flag the missing field and move focus to it.
  const nameField = page.getByRole("textbox", { name: "Name your app" });
  await generate.click();
  await expect(nameField).toBeFocused();
  await expect(nameField).toHaveAttribute("aria-invalid", "true");
  // Both empty fields are flagged, not just the one that took focus.
  await expect(page.getByText("Required", { exact: true })).toHaveCount(2);
  await expect(output).toHaveCount(0);

  // Generate needs both a name and a description; a name alone is not enough.
  await page.getByRole("textbox", { name: "Name your app" }).fill(NAME);
  await expect(page.getByText("Add a description to generate")).toBeVisible();
  await generate.click();
  await expect(page.getByRole("textbox", { name: "What do you want to build?" })).toBeFocused();
  await page.getByRole("textbox", { name: "What do you want to build?" }).fill(DESCRIPTION);
  await expect(generate).toBeEnabled();

  await page.getByRole("switch", { name: "Auth", exact: true }).click();
  await generate.click();

  await expect(output).toContainText(DESCRIPTION);
  await expect(output).toContainText("appName = Habit Kit");
  await expect(output).toContainText("App type: Web App");
  await expect(output).toContainText("Stack: Next.js");
  await expect(output).toContainText("Authentication:");
  // Audit ships on by default, so its section and skill appear without being touched.
  await expect(output).toContainText("Audit:");
  await expect(output).toContainText("Skills to run, in order:");
  await expect(output).toContainText("/repo-audit");

  // Step 1 carries the repo and alias setup; step 2 carries the build.
  const setup = page.getByRole("textbox", { name: "Run in this tab" });
  await expect(setup).toContainText("_habit_kit");
  await expect(setup).toContainText("Do not build anything yet");

  const copy = page.getByRole("button", { name: "Copy the build prompt" });
  await copy.click();
  await expect(copy).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await output.inputValue());

  // Changing a setting must flag the on-screen prompt as out of date, otherwise
  // Copy silently hands over text that no longer matches the form.
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

  await page.getByRole("textbox", { name: "Name your app" }).fill(NAME);
  await page.getByRole("textbox", { name: "What do you want to build?" }).fill(DESCRIPTION);
  await page.getByRole("button", { name: /Generate Prompt/ }).click();
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
  await page.getByRole("textbox", { name: "What do you want to build?" }).fill(DESCRIPTION);
  await page.getByRole("textbox", { name: "Name your app" }).fill(NAME);
  await page.getByRole("button", { name: /Generate Prompt/ }).click();
  await expect(page.getByRole("textbox", { name: "Paste in the new tab" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  // Every visible label must fit its box. The app type cards were laid out 2 across
  // at phone widths and silently truncated to "Chrome Ext...".
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll("main span, main h1, main h2, main label")]
      .filter((el) => el.children.length === 0 && (el as HTMLElement).offsetParent !== null)
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean),
  );
  expect(clipped).toEqual([]);
});

test("open source and private can never both be selected", async ({ page }) => {
  await page.goto("/");
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
