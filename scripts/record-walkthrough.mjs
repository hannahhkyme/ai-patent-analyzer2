// Records a paced, captioned walkthrough of the console as artifacts/walkthrough-<date>.webm (+ .mp4 if ffmpeg
// is available). Starts `next start` itself unless BASE_URL points at a running server.
// The title card shows the latest suite results from reports/unit.json and reports/e2e.json when present.
import { chromium } from "@playwright/test";
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "artifacts");
const date = new Date().toISOString().slice(0, 10);
const PORT = Number(process.env.RECORD_PORT ?? 3200);
const PAUSE = Number(process.env.RECORD_PAUSE_MS ?? 2200);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(path.join(root, file), "utf8"));
  } catch {
    return null;
  }
}

function suiteSummary() {
  const lines = [];
  const unit = readJson("reports/unit.json");
  if (unit) lines.push(`Unit + component: ${unit.numPassedTests}/${unit.numTotalTests} passed`);
  const e2e = readJson("reports/e2e.json");
  if (e2e?.stats) {
    const { expected = 0, unexpected = 0, flaky = 0 } = e2e.stats;
    lines.push(`E2E + visual: ${expected + flaky}/${expected + unexpected + flaky} passed${flaky ? ` (${flaky} flaky)` : ""}`);
  }
  return lines;
}

function gitSha() {
  if (process.env.GIT_SHA) return process.env.GIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
  } catch {
    return "unknown";
  }
}

async function startServer() {
  if (process.env.BASE_URL) return { url: process.env.BASE_URL, stop: () => {} };
  if (!existsSync(path.join(root, ".next", "BUILD_ID"))) execSync("npm run build", { cwd: root, stdio: "inherit" });
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: root, stdio: "ignore" });
  const url = `http://127.0.0.1:${PORT}`;
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => child.kill() };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error(`next start did not come up on ${url}`);
}

async function caption(page, text) {
  await page.evaluate((t) => {
    let el = document.getElementById("__walkthrough_caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "__walkthrough_caption";
      el.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;max-width:80%;" +
        "background:rgba(17,24,39,.92);color:#fff;font:600 18px/1.4 system-ui,sans-serif;padding:12px 20px;" +
        "border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.25);text-align:center;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function titleCard(page, lines) {
  await page.setContent(`<!doctype html><body style="margin:0;height:100vh;display:grid;place-items:center;
    background:#111827;color:#fff;font-family:system-ui,sans-serif"><div style="text-align:center">
    <div style="font-size:16px;letter-spacing:.12em;text-transform:uppercase;opacity:.7">Weekly regression check</div>
    <h1 style="font-size:44px;margin:12px 0 24px">Patent Review Console</h1>
    ${lines.map((l) => `<div style="font-size:22px;margin:6px 0">${l}</div>`).join("")}</div></body>`);
  await page.waitForTimeout(PAUSE * 1.6);
}

const server = await startServer();
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();

try {
  const results = suiteSummary();
  await titleCard(page, [`${date} · commit ${gitSha()}`, ...(results.length ? results : ["Suite results not provided"])]);

  await page.goto(server.url);
  await page.getByRole("region", { name: "Review queue" }).waitFor();
  await caption(page, "Review queue loads with every disclosure, status and completeness");
  await page.waitForTimeout(PAUSE);

  await page.getByRole("region", { name: "Queue summary" }).scrollIntoViewIfNeeded();
  await caption(page, "Summary cards count disclosures by review status");
  await page.waitForTimeout(PAUSE);

  const rows = page.getByRole("region", { name: "Review queue" }).locator("tbody tr");
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    await row.hover();
    await row.click();
    const title = await page.getByRole("complementary", { name: "Disclosure detail" }).getByRole("heading", { level: 2 }).innerText();
    const status = await row.locator(".status").innerText();
    await caption(page, `${i + 1}/${count} · ${title} — ${status}`);
    await page.waitForTimeout(PAUSE);
  }

  await rows.first().focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await caption(page, "Keyboard: Tab + Enter selects a disclosure");
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: path.join(outDir, `walkthrough-${date}-desktop.png`) });

  await page.setViewportSize({ width: 412, height: 800 });
  await caption(page, "Narrow screens stack the detail panel under the queue");
  await page.waitForTimeout(PAUSE);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(PAUSE);
  await page.screenshot({ path: path.join(outDir, `walkthrough-${date}-mobile.png`) });

  await page.setViewportSize({ width: 1280, height: 800 });
  await titleCard(page, ["No regressions", ...results]);
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  server.stop();
  if (video) {
    const webm = path.join(outDir, `walkthrough-${date}.webm`);
    renameSync(await video.path(), webm);
    console.log(`video: ${path.relative(root, webm)}`);
    try {
      const mp4 = webm.replace(/\.webm$/, ".mp4");
      execSync(`ffmpeg -y -loglevel error -i "${webm}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${mp4}"`);
      console.log(`video: ${path.relative(root, mp4)}`);
    } catch {
      console.log("ffmpeg not available; skipped mp4 conversion");
    }
  }
}
