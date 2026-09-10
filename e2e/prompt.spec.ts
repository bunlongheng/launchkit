import { expect, test } from "@playwright/test";

const DESCRIPTION = "A habit tracker with streaks and reminders.";

test("builds, copies and invalidates a prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");

  const generate = page.getByRole("button", { name: /Generate Prompt/ });
  const output = page.getByRole("textbox", { name: "Generated prompt" });

  await expect(generate).toBeDisabled();
  await expect(output).toHaveValue("");

  await page.getByRole("textbox", { name: "What do you want to build?" }).fill(DESCRIPTION);
  await expect(generate).toBeEnabled();

  await page.getByRole("switch", { name: "Audit" }).click();
  await page.getByRole("radio", { name: "React / Vite" }).click();
  await generate.click();

  await expect(output).toContainText(DESCRIPTION);
  await expect(output).toContainText("Stack: React / Vite");
  await expect(output).toContainText("Audit:");

  const copy = page.getByRole("button", { name: "Copy" });
  await copy.click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await output.inputValue());

  // Changing a setting must flag the on-screen prompt as out of date, otherwise
  // Copy silently hands over text that no longer matches the form.
  const stale = page.getByText("Settings changed - regenerate");
  await expect(stale).toHaveCount(0);
  await page.getByRole("switch", { name: "Auth" }).click();
  await expect(stale).toBeVisible();

  await page.getByRole("button", { name: /Regenerate Prompt/ }).click();
  await expect(stale).toHaveCount(0);
  await expect(output).toContainText("Authentication:");
});

test("the stack radiogroup is operable with the arrow keys", async ({ page }) => {
  await page.goto("/");
  const nextjs = page.getByRole("radio", { name: "Next.js" });
  await expect(nextjs).toBeChecked();

  await nextjs.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "React / Vite" })).toBeChecked();
  await expect(nextjs).not.toBeChecked();
});
