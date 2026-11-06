import { expect, test } from "@playwright/test";
import { REVIEW_QUEUE } from "../lib/fixtures/disclosures";

const queue = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Review queue" });
const rows = (page: import("@playwright/test").Page) => queue(page).locator("tbody tr");
const detail = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Disclosure detail" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads the console with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.reload();
  await expect(page).toHaveTitle("Patent Review Console");
  await expect(page.getByRole("heading", { level: 1, name: "Patent Review Console" })).toBeVisible();
  await expect(rows(page)).toHaveCount(REVIEW_QUEUE.length);
  expect(errors).toEqual([]);
});

test("summary cards match the queue", async ({ page }) => {
  const summary = page.getByRole("region", { name: "Queue summary" });
  const labels = { needs_info: "Needs info", in_review: "In review", ready_to_file: "Ready to file", on_hold: "On hold" } as const;
  for (const [status, label] of Object.entries(labels)) {
    const count = REVIEW_QUEUE.filter((d) => d.status === status).length;
    await expect(summary.locator(".summary-card", { hasText: label }).locator("strong")).toHaveText(String(count));
  }
});

test("every row opens its disclosure in the detail panel", async ({ page }) => {
  for (const [i, d] of REVIEW_QUEUE.entries()) {
    await rows(page).nth(i).click();
    await expect(rows(page).nth(i)).toHaveAttribute("aria-selected", "true");
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText(d.title);
    await expect(detail(page).getByText(d.sessionId)).toBeVisible();
    await expect(detail(page).getByText(d.notes[0].body)).toBeVisible();
    await expect(detail(page).locator(".chip-missing")).toHaveCount(d.upstream.sections_missing.length);
  }
});

test("keyboard users can move through the queue", async ({ page }) => {
  await rows(page).nth(0).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(rows(page).nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText(REVIEW_QUEUE[1].title);
});

test("layout does not overflow horizontally", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
