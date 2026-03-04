#!/usr/bin/env node

/**
 * Take a screenshot of a specific element on a web page using Playwright.
 *
 * Usage:
 *   node screenshot.mjs <url> <selector> <output-path> [options]
 *
 * Options:
 *   --viewport WxH          Viewport size (default: 1280x800)
 *   --device-scale-factor N  Device pixel ratio (default: 2)
 *   --full-page              Capture full page instead of element
 *   --wait N                 Additional wait time in ms after load (default: 2000)
 *   --timeout N              Navigation timeout in ms (default: 30000)
 *
 * Examples:
 *   # PC header screenshot
 *   node screenshot.mjs http://localhost:3000/preview/orbis-header "header" out/pc.png --viewport 1280x800
 *
 *   # SP header screenshot
 *   node screenshot.mjs http://localhost:3000/preview/orbis-header "header" out/sp.png --viewport 390x844
 *
 * Requires: playwright
 */

import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    url: args[0],
    selector: args[1],
    output: args[2],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    fullPage: false,
    wait: 2000,
    timeout: 30000,
  };

  for (let i = 3; i < args.length; i++) {
    switch (args[i]) {
      case "--viewport": {
        const [w, h] = args[++i].split("x").map(Number);
        opts.viewport = { width: w, height: h };
        break;
      }
      case "--device-scale-factor":
        opts.deviceScaleFactor = Number(args[++i]);
        break;
      case "--full-page":
        opts.fullPage = true;
        break;
      case "--wait":
        opts.wait = Number(args[++i]);
        break;
      case "--timeout":
        opts.timeout = Number(args[++i]);
        break;
    }
  }

  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.url || !opts.selector || !opts.output) {
    console.error(
      "Usage: node screenshot.mjs <url> <selector> <output-path> [--viewport WxH] [--device-scale-factor N]"
    );
    process.exit(1);
  }

  const outputPath = resolve(opts.output);
  mkdirSync(dirname(outputPath), { recursive: true });

  console.log(`URL:      ${opts.url}`);
  console.log(`Selector: ${opts.selector}`);
  console.log(`Viewport: ${opts.viewport.width}x${opts.viewport.height}`);
  console.log(`Scale:    ${opts.deviceScaleFactor}x`);
  console.log(`Output:   ${outputPath}`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: opts.viewport,
      deviceScaleFactor: opts.deviceScaleFactor,
      locale: "ja-JP",
      timezoneId: "Asia/Tokyo",
    });

    const page = await context.newPage();

    // Disable animations for stable screenshots
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });

    console.log("Navigating...");
    await page.goto(opts.url, {
      waitUntil: "networkidle",
      timeout: opts.timeout,
    });

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);

    // Wait for all images to load
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
          )
      )
    );

    // Additional settle time
    if (opts.wait > 0) {
      console.log(`Waiting ${opts.wait}ms for render to settle...`);
      await page.waitForTimeout(opts.wait);
    }

    if (opts.fullPage) {
      await page.screenshot({ path: outputPath, fullPage: true });
    } else {
      const element = await page.$(opts.selector);
      if (!element) {
        console.error(`Element not found: ${opts.selector}`);
        process.exit(1);
      }
      await element.screenshot({ path: outputPath });
    }

    console.log(`Screenshot saved: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
