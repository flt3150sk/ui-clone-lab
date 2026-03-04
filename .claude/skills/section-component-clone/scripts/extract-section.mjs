#!/usr/bin/env node

/**
 * Extract a specific section from a URL.
 *
 * Usage:
 *   node extract-section.mjs <url> <output-dir> --selector "<css-selector>" [options]
 *
 * Options:
 *   --selector <sel>   CSS selector for the target section (required)
 *   --viewport WxH     Set viewport size (default: 1280x720)
 *   --nth N            Which match to use if selector matches multiple (default: 0 = first)
 *
 * Outputs:
 *   - screenshot.png        (section-only screenshot at 2x scale)
 *   - page-screenshot.png   (full-page context screenshot)
 *   - dom.html              (section's HTML subtree)
 *   - layout.json           (element tree with computed styles, rooted at the section)
 *   - assets/               (images, icons, SVGs within the section)
 *   - assets-map.json       (URL → local path mapping)
 *
 * Requires: playwright
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";

// ─── Configuration ───────────────────────────────────────────────
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE_FACTOR = 2;
const SETTLE_TIME_MS = 2000;
const NAVIGATION_TIMEOUT_MS = 30000;
const MAX_DEPTH = 20;
const ASSET_DOWNLOAD_TIMEOUT_MS = 5000;

// ─── Parse CLI args ─────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const positional = [];
  let viewport = DEFAULT_VIEWPORT;
  let selector = null;
  let nth = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--viewport" && args[i + 1]) {
      const [w, h] = args[i + 1].split("x").map(Number);
      if (w > 0 && h > 0) viewport = { width: w, height: h };
      i++;
    } else if (args[i] === "--selector" && args[i + 1]) {
      selector = args[i + 1];
      i++;
    } else if (args[i] === "--nth" && args[i + 1]) {
      nth = parseInt(args[i + 1], 10);
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  if (!positional[0]) {
    console.error(
      'Usage: node extract-section.mjs <url> <output-dir> --selector "<css-selector>" [--viewport WxH] [--nth N]'
    );
    process.exit(1);
  }

  if (!selector) {
    console.error("Error: --selector is required");
    process.exit(1);
  }

  return {
    url: positional[0],
    outputDir: resolve(positional[1] || "./output"),
    viewport,
    selector,
    nth,
  };
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const { url, outputDir, viewport, selector, nth } = parseArgs();

  mkdirSync(outputDir, { recursive: true });

  console.log(`🔍 Extracting section: ${selector}`);
  console.log(`   URL:      ${url}`);
  console.log(`   Output:   ${outputDir}`);
  console.log(`   Viewport: ${viewport.width}x${viewport.height}`);
  if (nth > 0) console.log(`   Nth:      ${nth}`);
  console.log();

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
  });

  const page = await context.newPage();

  // ─── Stabilization ──────────────────────────────────────────
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.id = "__section-extract-stabilize__";
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
      *:focus { outline: none !important; }
      * { caret-color: transparent !important; }
    `;
    const attach = () => {
      if (document.head) document.head.appendChild(style);
      else
        document.addEventListener("DOMContentLoaded", () =>
          document.head.appendChild(style)
        );
    };
    attach();
  });

  // ─── Navigate ────────────────────────────────────────────────
  console.log("⏳ Navigating...");
  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  await page.evaluateHandle(() => document.fonts.ready).catch(() => {});

  // ─── Loading Detection ───────────────────────────────────────
  console.log("⏳ Waiting for content to finish loading...");
  await page
    .waitForFunction(
      () => {
        const loadingSelectors = [
          '[data-loading="true"]',
          ".loading",
          ".skeleton",
          ".spinner",
          '[aria-busy="true"]',
          ".shimmer",
        ];
        for (const sel of loadingSelectors) {
          const el = document.querySelector(sel);
          if (el && el.offsetParent !== null) return false;
        }
        return true;
      },
      { timeout: 15000 }
    )
    .catch(() => {
      console.log(
        "  ⚠️  Some loading indicators may still be present (timed out)"
      );
    });

  // ─── Scroll to trigger lazy content ─────────────────────────
  console.log("⏳ Scrolling to trigger lazy content...");
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 300));
    }
    window.scrollTo(0, 0);
  });

  await page
    .waitForFunction(
      () => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.length === 0 || images.every((img) => img.complete);
      },
      { timeout: 10000 }
    )
    .catch(() => {});

  await page.waitForTimeout(SETTLE_TIME_MS);

  // ─── Find target element ─────────────────────────────────────
  console.log(`🎯 Finding element: ${selector}${nth > 0 ? ` (nth: ${nth})` : ""}`);
  const locator = page.locator(selector).nth(nth);

  try {
    await locator.waitFor({ state: "visible", timeout: 10000 });
  } catch {
    console.error(`❌ Element not found or not visible: ${selector}`);
    await browser.close();
    process.exit(1);
  }

  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // ─── Section screenshot ──────────────────────────────────────
  console.log("📸 Taking section screenshot...");
  const sectionBuf = await locator.screenshot();
  writeFileSync(join(outputDir, "screenshot.png"), sectionBuf);

  // ─── Full page context screenshot ────────────────────────────
  console.log("📸 Taking full-page context screenshot...");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: join(outputDir, "page-screenshot.png"),
    fullPage: true,
  });

  // ─── DOM subtree ─────────────────────────────────────────────
  console.log("📄 Saving section DOM...");
  const domHtml = await locator.evaluate((el) => el.outerHTML);
  writeFileSync(join(outputDir, "dom.html"), domHtml, "utf-8");

  // ─── Style Extraction (section-rooted) ───────────────────────
  console.log("🎨 Extracting styles...");
  const layoutData = await page.evaluate(
    ({ sel, nthIdx, maxDepth }) => {
      const LAYOUT_PROPS = [
        "display",
        "position",
        "boxSizing",
        "marginTop",
        "marginRight",
        "marginBottom",
        "marginLeft",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth",
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomRightRadius",
        "borderBottomLeftRadius",
        "overflow",
        "overflowX",
        "overflowY",
        "flexDirection",
        "flexWrap",
        "justifyContent",
        "alignItems",
        "alignSelf",
        "flexGrow",
        "flexShrink",
        "flexBasis",
        "gridTemplateColumns",
        "gridTemplateRows",
        "gap",
        "rowGap",
        "columnGap",
        "zIndex",
        "width",
        "height",
        "minWidth",
        "minHeight",
        "maxWidth",
        "maxHeight",
      ];

      const TYPO_PROPS = [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "lineHeight",
        "letterSpacing",
        "textAlign",
        "whiteSpace",
        "textDecoration",
        "textTransform",
      ];

      const COLOR_PROPS = [
        "color",
        "backgroundColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
        "boxShadow",
        "opacity",
      ];

      const SKIP_TAGS = new Set([
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "LINK",
        "META",
        "HEAD",
        "BR",
        "WBR",
        "TEMPLATE",
        "SLOT",
      ]);

      const viewportWidth = window.innerWidth;

      function extractStyles(styles, propList) {
        const result = {};
        for (const prop of propList) {
          const val = styles[prop];
          if (val !== undefined && val !== "") result[prop] = val;
        }
        return result;
      }

      function getDirectText(el) {
        let text = "";
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const t = node.textContent?.trim();
            if (t) text += (text ? " " : "") + t;
          }
        }
        return text || undefined;
      }

      function extractElement(el, depth) {
        if (depth > maxDepth) return null;
        if (SKIP_TAGS.has(el.tagName)) return null;

        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();

        if (styles.display === "none") return null;
        if (styles.visibility === "hidden" && el.children.length === 0)
          return null;
        if (rect.width === 0 && rect.height === 0 && el.children.length === 0)
          return null;

        const children = [];
        for (const child of el.children) {
          const extracted = extractElement(child, depth + 1);
          if (extracted) children.push(extracted);
        }

        const node = {
          tag: el.tagName.toLowerCase(),
          depth,
          rect: {
            x: Math.round(rect.x * 10) / 10,
            y: Math.round(rect.y * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
          },
          layout: extractStyles(styles, LAYOUT_PROPS),
          typography: extractStyles(styles, TYPO_PROPS),
          colors: extractStyles(styles, COLOR_PROPS),
        };

        // ─── Centering & Sizing Hints ──────────────────────────
        const hints = {};

        const computedMaxWidth = styles.getPropertyValue("max-width");
        if (computedMaxWidth && computedMaxWidth !== "none")
          hints.maxWidth = computedMaxWidth;

        const ml = parseFloat(styles.marginLeft) || 0;
        const mr = parseFloat(styles.marginRight) || 0;
        const parentEl = el.parentElement;
        const parentWidth = parentEl
          ? parentEl.getBoundingClientRect().width
          : viewportWidth;

        if (rect.width > 0 && rect.width < parentWidth - 1) {
          const marginDiff = Math.abs(ml - mr);
          if (ml > 0 && mr > 0 && marginDiff < 5) hints.centered = true;
        }

        if (Math.abs(rect.width - viewportWidth) < 2) hints.fullWidth = true;

        const inlineWidth = el.style.width;
        const inlineMargin = el.style.margin;
        if (
          inlineWidth &&
          (inlineWidth.includes("%") || inlineWidth === "auto")
        )
          hints.cssWidth = inlineWidth;
        if (inlineMargin && inlineMargin.includes("auto"))
          hints.cssMargin = inlineMargin;

        if (Object.keys(hints).length > 0) node.hints = hints;

        if (el.id) node.id = el.id;
        if (el.className && typeof el.className === "string") {
          const classes = el.className.trim().split(/\s+/).filter(Boolean);
          if (classes.length > 0) node.classes = classes;
        }

        const text = getDirectText(el);
        if (text) node.text = text;
        if (children.length > 0) node.children = children;

        if (el.tagName === "IMG") {
          node.src = el.getAttribute("src");
          node.alt = el.getAttribute("alt") || undefined;
          node.naturalWidth = el.naturalWidth;
          node.naturalHeight = el.naturalHeight;
        }
        if (el.tagName === "A") node.href = el.getAttribute("href");
        if (el.tagName === "SVG") node.viewBox = el.getAttribute("viewBox");
        if (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) {
          node.inputType = el.getAttribute("type");
          node.placeholder = el.getAttribute("placeholder") || undefined;
        }
        if (
          el.tagName === "BUTTON" ||
          el.getAttribute("role") === "button"
        )
          node.role = "button";

        return node;
      }

      const allEls = document.querySelectorAll(sel);
      const targetEl = allEls[nthIdx];
      if (!targetEl) return null;

      const targetRect = targetEl.getBoundingClientRect();

      return {
        url: window.location.href,
        title: document.title,
        selector: sel,
        nthIndex: nthIdx,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        extractedAt: new Date().toISOString(),
        sectionRect: {
          x: Math.round(targetRect.x),
          y: Math.round(targetRect.y),
          width: Math.round(targetRect.width),
          height: Math.round(targetRect.height),
        },
        tree: extractElement(targetEl, 0),
      };
    },
    { sel: selector, nthIdx: nth, maxDepth: MAX_DEPTH }
  );

  if (!layoutData || !layoutData.tree) {
    console.error(`❌ Failed to extract layout data for: ${selector}`);
    await browser.close();
    process.exit(1);
  }

  writeFileSync(
    join(outputDir, "layout.json"),
    JSON.stringify(layoutData, null, 2),
    "utf-8"
  );

  // ─── Asset Collection ────────────────────────────────────────
  console.log("📦 Collecting assets within section...");
  const assetData = await page.evaluate(
    ({ sel, nthIdx }) => {
      const allEls = document.querySelectorAll(sel);
      const el = allEls[nthIdx];
      if (!el) return [];

      const assets = [];

      // Images within the section
      el.querySelectorAll("img").forEach((img) => {
        if (img.src && !img.src.startsWith("data:")) {
          assets.push({
            type: "image",
            url: img.src,
            width: img.naturalWidth,
            height: img.naturalHeight,
            alt: img.alt || "",
          });
        }
      });

      // CSS background images within the section
      const seen = new Set();
      el.querySelectorAll("*").forEach((child) => {
        const bg = getComputedStyle(child).backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) {
          const matches = bg.matchAll(/url\(["']?([^"')]+)["']?\)/g);
          for (const m of matches) {
            if (!m[1].startsWith("data:") && !seen.has(m[1])) {
              seen.add(m[1]);
              assets.push({ type: "background", url: m[1] });
            }
          }
        }
      });

      // Inline SVGs within the section (icon-sized only)
      el.querySelectorAll("svg").forEach((svg, i) => {
        const rect = svg.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.width <= 200 &&
          rect.height > 0 &&
          rect.height <= 200
        ) {
          assets.push({
            type: "svg",
            content: svg.outerHTML,
            viewBox: svg.getAttribute("viewBox") || "",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            index: i,
          });
        }
      });

      return assets;
    },
    { sel: selector, nthIdx: nth }
  );

  // ─── Download Assets ─────────────────────────────────────────
  const assetsDir = join(outputDir, "assets");
  mkdirSync(assetsDir, { recursive: true });

  const assetMap = {};
  const downloadedUrls = new Set();
  let downloadCount = 0;
  let svgCount = 0;

  // Save inline SVGs
  for (const asset of assetData) {
    if (asset.type === "svg") {
      const filename = `icon-${asset.index}.svg`;
      writeFileSync(join(assetsDir, filename), asset.content, "utf-8");
      assetMap[`svg-${asset.index}`] = {
        localPath: `assets/${filename}`,
        viewBox: asset.viewBox,
        width: asset.width,
        height: asset.height,
      };
      svgCount++;
    }
  }

  // Download remote assets
  console.log("⬇️  Downloading remote assets...");
  for (const asset of assetData) {
    if (asset.type === "svg") continue;
    if (!asset.url || downloadedUrls.has(asset.url)) continue;
    downloadedUrls.add(asset.url);

    try {
      const assetUrl = new URL(asset.url);
      const pathParts = assetUrl.pathname.split("/");
      const rawName = pathParts[pathParts.length - 1] || "asset";
      const safeName = rawName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 120);
      const filename = safeName || `asset-${downloadCount}`;

      const response = await fetch(asset.url, {
        signal: AbortSignal.timeout(ASSET_DOWNLOAD_TIMEOUT_MS),
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(join(assetsDir, filename), buffer);
        assetMap[asset.url] = {
          localPath: `assets/${filename}`,
          type: asset.type,
          width: asset.width,
          height: asset.height,
        };
        downloadCount++;
      }
    } catch {
      // Skip failed downloads silently
    }
  }

  writeFileSync(
    join(outputDir, "assets-map.json"),
    JSON.stringify(assetMap, null, 2),
    "utf-8"
  );

  // ─── Summary ─────────────────────────────────────────────────
  function countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children)
      for (const child of node.children) count += countNodes(child);
    return count;
  }

  const nodeCount = countNodes(layoutData.tree);
  const { sectionRect } = layoutData;

  console.log();
  console.log("✅ Section extraction complete!");
  console.log(`   Selector:  ${selector}`);
  console.log(`   Rect:      ${sectionRect.width}x${sectionRect.height}px @ (${sectionRect.x}, ${sectionRect.y})`);
  console.log(`   Elements:  ${nodeCount}`);
  console.log(`   Assets:    ${downloadCount} downloaded, ${svgCount} SVGs saved`);
  console.log();
  console.log("📁 Output files:");
  console.log(`   ${join(outputDir, "screenshot.png")}       ← section only`);
  console.log(`   ${join(outputDir, "page-screenshot.png")}  ← full page context`);
  console.log(`   ${join(outputDir, "dom.html")}`);
  console.log(`   ${join(outputDir, "layout.json")}`);
  console.log(`   ${join(outputDir, "assets-map.json")}`);

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
