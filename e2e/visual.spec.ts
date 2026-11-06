import { expect, test } from "@playwright/test";
import { REVIEW_QUEUE } from "../lib/fixtures/disclosures";

// Pixel baselines are rendered in the pinned Playwright Docker image (see scripts/playwright-docker.sh)
// so fonts match between local runs and CI. Refresh them with `npm run test:e2e:update`.

test("full page (default selection)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("console-default.png", { fullPage: true });
});

test("detail panel for each status", async ({ page }) => {
  await page.goto("/");
  const seen = new Set<string>();
  for (const [i, d] of REVIEW_QUEUE.entries()) {
    if (seen.has(d.status)) continue;
    seen.add(d.status);
    await page.getByRole("region", { name: "Review queue" }).locator("tbody tr").nth(i).click();
    await expect(page.getByRole("complementary", { name: "Disclosure detail" })).toHaveScreenshot(`detail-${d.status}.png`);
  }
});
