#!/usr/bin/env node

/**
 * 生成したコンポーネントの preview ページをスクリーンショット撮影する。
 *
 * Usage:
 *   node screenshot-clone.mjs <url> --viewport pc|sp [--selector "<sel>"]
 *
 * Options:
 *   --viewport pc|sp   pc=1200x800, sp=390x844 (デフォルト: pc)
 *   --selector <sel>   特定要素のみ撮影 (省略時: ページ全体)
 *
 * Output:
 *   snapshots/clone-{vp}.png
 *
 * Requires: playwright
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";

const VIEWPORTS = {
  pc: { width: 1200, height: 800 },
  sp: { width: 390, height: 844 },
};
const DEVICE_SCALE_FACTOR = 2;

function parseArgs() {
  const args = process.argv.slice(2);
  const positional = [];
  let vp = "pc";
  let selector = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--viewport" && args[i + 1]) { vp = args[i + 1]; i++; }
    else if (args[i] === "--selector" && args[i + 1]) { selector = args[i + 1]; i++; }
    else positional.push(args[i]);
  }

  if (!positional[0]) {
    console.error("Usage: node screenshot-clone.mjs <url> --viewport pc|sp [--selector <sel>]");
    process.exit(1);
  }

  const viewport = VIEWPORTS[vp];
  if (!viewport) { console.error(`Invalid viewport: ${vp}`); process.exit(1); }

  return { url: positional[0], viewport, vpName: vp, selector };
}

async function main() {
  const { url, viewport, vpName, selector } = parseArgs();
  const snapshotDir = resolve("./snapshots");
  mkdirSync(snapshotDir, { recursive: true });

  console.log(`Screenshot: ${url} (${vpName} ${viewport.width}x${viewport.height})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // Stabilization
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
      *:focus { outline: none !important; }
      * { caret-color: transparent !important; }
    `;
    if (document.head) document.head.appendChild(style);
    else document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluateHandle(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(1500);

  const outPath = join(snapshotDir, `clone-${vpName}.png`);

  if (selector) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: "visible", timeout: 10000 });
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const buf = await locator.screenshot();
      writeFileSync(outPath, buf);
    } catch {
      console.error(`Element not found: ${selector}. Taking full page screenshot.`);
      await page.screenshot({ path: outPath, fullPage: true });
    }
  } else {
    await page.screenshot({ path: outPath, fullPage: true });
  }

  console.log(`Saved: ${outPath}`);
  await browser.close();
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
