#!/usr/bin/env node

/**
 * Extract DOM structure, computed styles, screenshot, and assets from a URL.
 *
 * Usage: node extract-styles.mjs <url> <output-dir> [--viewport WxH]
 *
 * Options:
 *   --viewport WxH   Set viewport size (default: 1280x720). Example: --viewport 390x844
 *
 * Outputs:
 *   - screenshot.png   (full-page screenshot at 2x scale)
 *   - dom.html         (raw DOM HTML)
 *   - layout.json      (structured element tree with computed styles)
 *   - assets/          (downloaded images, icons, SVGs)
 *   - assets-map.json  (URL → local path mapping for assets)
 *
 * Requires: playwright (npm install -D playwright)
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
function parseViewport(args) {
  const idx = args.indexOf("--viewport");
  if (idx !== -1 && args[idx + 1]) {
    const [w, h] = args[idx + 1].split("x").map(Number);
    if (w > 0 && h > 0) return { width: w, height: h };
  }
  return DEFAULT_VIEWPORT;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const url = process.argv[2];
  const outputDir = resolve(process.argv[3] || "./output");
  const VIEWPORT = parseViewport(process.argv);

  if (!url) {
    console.error("Usage: node extract-styles.mjs <url> <output-dir> [--viewport WxH]");
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });

  console.log(`🔍 Extracting: ${url}`);
  console.log(`📁 Output:     ${outputDir}`);
  console.log(`📐 Viewport:   ${VIEWPORT.width}x${VIEWPORT.height}`);
  console.log();

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
  });

  const page = await context.newPage();

  // ─── Phase 0: Stabilization ──────────────────────────────────
  await page.addInitScript(() => {
    // Inject stabilization CSS as early as possible
    const style = document.createElement("style");
    style.id = "__ui-clone-stabilize__";
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
      else document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
    };
    attach();
  });

  // ─── Navigate ────────────────────────────────────────────────
  console.log("⏳ Navigating...");
  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: NAVIGATION_TIMEOUT_MS,
  });

  // Wait for web fonts
  await page.evaluateHandle(() => document.fonts.ready).catch(() => {});

  // ─── Loading Detection ───────────────────────────────────────
  // Wait for common loading indicators (spinners, skeletons) to disappear
  console.log("⏳ Waiting for content to finish loading...");
  await page.waitForFunction(() => {
    const loadingSelectors = [
      '[data-loading="true"]', '[data-loading="loading"]',
      '.loading', '.skeleton', '.spinner',
      '[aria-busy="true"]', '.placeholder', '.shimmer',
      '[data-skeleton]', '.lazy-loading', '.is-loading',
    ];
    for (const sel of loadingSelectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return false;
    }
    return true;
  }, { timeout: 15000 }).catch(() => {
    console.log("  ⚠️  Some loading indicators may still be present (timed out)");
  });

  // Wait for all images to finish loading
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.length === 0 || images.every(img => img.complete);
  }, { timeout: 15000 }).catch(() => {
    console.log("  ⚠️  Some images may not have finished loading");
  });

  // Scroll to bottom and back to trigger lazy-loaded content
  console.log("⏳ Scrolling to trigger lazy content...");
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 300));
    }
    // Scroll back to top
    window.scrollTo(0, 0);
  });

  // Wait for lazy-loaded images after scroll
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.length === 0 || images.every(img => img.complete);
  }, { timeout: 10000 }).catch(() => {});

  // Final settle time
  await page.waitForTimeout(SETTLE_TIME_MS);

  // ─── Screenshot ──────────────────────────────────────────────
  console.log("📸 Taking screenshot...");
  await page.screenshot({
    path: join(outputDir, "screenshot.png"),
    fullPage: true,
  });

  // ─── DOM HTML ────────────────────────────────────────────────
  console.log("📄 Saving DOM...");
  const html = await page.content();
  writeFileSync(join(outputDir, "dom.html"), html, "utf-8");

  // ─── Style Extraction ────────────────────────────────────────
  console.log("🎨 Extracting styles...");
  const layoutData = await page.evaluate(({ maxDepth }) => {
    // Properties to extract per category
    const LAYOUT_PROPS = [
      "display", "position", "boxSizing",
      "marginTop", "marginRight", "marginBottom", "marginLeft",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius",
      "overflow", "overflowX", "overflowY",
      "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignSelf",
      "flexGrow", "flexShrink", "flexBasis",
      "gridTemplateColumns", "gridTemplateRows", "gap", "rowGap", "columnGap",
      "zIndex",
    ];

    const TYPO_PROPS = [
      "fontFamily", "fontSize", "fontWeight", "fontStyle",
      "lineHeight", "letterSpacing", "textAlign",
      "whiteSpace", "textDecoration", "textTransform",
    ];

    const COLOR_PROPS = [
      "color", "backgroundColor",
      "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
      "boxShadow", "opacity",
    ];

    const SKIP_TAGS = new Set([
      "SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "BR", "WBR",
      "TEMPLATE", "SLOT",
    ]);

    const viewportWidth = window.innerWidth;

    function buildSelector(el) {
      if (el === document.body) return "body";
      const parts = [];
      let current = el;
      while (current && current !== document.body) {
        let part = current.tagName.toLowerCase();
        if (current.id) {
          part = `${part}#${current.id}`;
          parts.unshift(part);
          break;
        }
        const parent = current.parentElement;
        if (parent) {
          const sameTag = Array.from(parent.children).filter(
            (c) => c.tagName === current.tagName
          );
          if (sameTag.length > 1) {
            const idx = sameTag.indexOf(current) + 1;
            part += `:nth-of-type(${idx})`;
          }
        }
        parts.unshift(part);
        current = current.parentElement;
      }
      return "body > " + parts.join(" > ");
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

    function extractStyles(styles, propList) {
      const result = {};
      for (const prop of propList) {
        const val = styles[prop];
        if (val !== undefined && val !== "") {
          result[prop] = val;
        }
      }
      return result;
    }

    function extractElement(el, depth) {
      if (depth > maxDepth) return null;
      if (SKIP_TAGS.has(el.tagName)) return null;

      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      if (styles.display === "none") return null;
      if (styles.visibility === "hidden" && el.children.length === 0) return null;
      if (rect.width === 0 && rect.height === 0 && el.children.length === 0) return null;

      const children = [];
      for (const child of el.children) {
        const extracted = extractElement(child, depth + 1);
        if (extracted) children.push(extracted);
      }

      const node = {
        tag: el.tagName.toLowerCase(),
        selector: buildSelector(el),
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

      // ─── Centering & Sizing Hints ─────────────────────────
      // Detect centering patterns lost in computed style conversion
      const hints = {};

      // Get max-width (computed returns "none" if not explicitly set)
      const computedMaxWidth = styles.getPropertyValue("max-width");
      if (computedMaxWidth && computedMaxWidth !== "none") {
        hints.maxWidth = computedMaxWidth;
      }

      // Detect horizontal centering:
      // Element width < parent width AND left/right margins are approximately equal
      const ml = parseFloat(styles.marginLeft) || 0;
      const mr = parseFloat(styles.marginRight) || 0;
      const parentEl = el.parentElement;
      const parentWidth = parentEl ? parentEl.getBoundingClientRect().width : viewportWidth;

      if (rect.width > 0 && rect.width < parentWidth - 1) {
        const marginDiff = Math.abs(ml - mr);
        // If left and right margins are both > 0 and nearly equal, it's centered
        if (ml > 0 && mr > 0 && marginDiff < 5) {
          hints.centered = true;
        }
      }

      // Detect full-width elements (width matches viewport or parent)
      if (Math.abs(rect.width - viewportWidth) < 2) {
        hints.fullWidth = true;
      }

      // Check for percentage or auto width from inline styles or CSS rules
      // element.style gives inline values; we also check via CSS properties
      const inlineWidth = el.style.width;
      const inlineMaxWidth = el.style.maxWidth;
      const inlineMargin = el.style.margin;
      if (inlineWidth && (inlineWidth.includes("%") || inlineWidth === "auto")) {
        hints.cssWidth = inlineWidth;
      }
      if (inlineMaxWidth) {
        hints.cssMaxWidth = inlineMaxWidth;
      }
      if (inlineMargin && (inlineMargin.includes("auto"))) {
        hints.cssMargin = inlineMargin;
      }

      // Only attach hints if there's something useful
      if (Object.keys(hints).length > 0) {
        node.hints = hints;
      }

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
      if (el.tagName === "A") {
        node.href = el.getAttribute("href");
      }
      if (el.tagName === "SVG") {
        node.viewBox = el.getAttribute("viewBox");
      }
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        node.inputType = el.getAttribute("type");
        node.placeholder = el.getAttribute("placeholder") || undefined;
      }
      if (el.tagName === "BUTTON" || el.getAttribute("role") === "button") {
        node.role = "button";
      }

      return node;
    }

    return {
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scrollHeight: document.body.scrollHeight,
      extractedAt: new Date().toISOString(),
      tree: extractElement(document.body, 0),
    };
  }, { maxDepth: MAX_DEPTH });

  // ─── Save layout JSON ───────────────────────────────────────
  writeFileSync(
    join(outputDir, "layout.json"),
    JSON.stringify(layoutData, null, 2),
    "utf-8"
  );

  // ─── Asset Collection & Download ────────────────────────────
  console.log("📦 Collecting assets (images, icons, SVGs)...");

  const assetData = await page.evaluate(() => {
    const assets = [];

    // Collect <img> sources
    document.querySelectorAll("img").forEach((img) => {
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

    // Collect favicon
    const favicons = document.querySelectorAll(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    favicons.forEach((link) => {
      if (link.href) {
        assets.push({ type: "favicon", url: link.href });
      }
    });

    // Collect CSS background images from visible elements
    const seen = new Set();
    document.querySelectorAll("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundImage;
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

    // Collect inline SVGs (as HTML content for saving)
    document.querySelectorAll("svg").forEach((svg, i) => {
      // Only save SVGs that look like icons (under 200x200 rendered size)
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.width <= 200 && rect.height > 0 && rect.height <= 200) {
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
  });

  // Download assets
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

  // Download remote assets (images, favicons, backgrounds)
  console.log("⬇️  Downloading remote assets...");
  for (const asset of assetData) {
    if (asset.type === "svg") continue;
    if (!asset.url || downloadedUrls.has(asset.url)) continue;
    downloadedUrls.add(asset.url);

    try {
      const assetUrl = new URL(asset.url);
      const pathParts = assetUrl.pathname.split("/");
      const rawName = pathParts[pathParts.length - 1] || "asset";
      // Sanitize filename: keep alphanumeric, dots, hyphens, underscores
      const safeName = rawName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 120);
      const filename = safeName || `asset-${downloadCount}`;

      const response = await fetch(asset.url, {
        signal: AbortSignal.timeout(ASSET_DOWNLOAD_TIMEOUT_MS),
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
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

  // Save asset map
  writeFileSync(
    join(outputDir, "assets-map.json"),
    JSON.stringify(assetMap, null, 2),
    "utf-8"
  );

  // ─── Summary ─────────────────────────────────────────────────
  function countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
      for (const child of node.children) {
        count += countNodes(child);
      }
    }
    return count;
  }

  const nodeCount = countNodes(layoutData.tree);
  console.log();
  console.log("✅ Extraction complete!");
  console.log(`   Elements extracted: ${nodeCount}`);
  console.log(`   Page title: ${layoutData.title}`);
  console.log(`   Scroll height: ${layoutData.scrollHeight}px`);
  console.log(`   Assets: ${downloadCount} downloaded, ${svgCount} SVGs saved`);
  console.log();
  console.log("📁 Output files:");
  console.log(`   ${join(outputDir, "screenshot.png")}`);
  console.log(`   ${join(outputDir, "dom.html")}`);
  console.log(`   ${join(outputDir, "layout.json")}`);
  console.log(`   ${join(outputDir, "assets-map.json")}`);
  console.log(`   ${join(outputDir, "assets/")} (${downloadCount + svgCount} files)`);

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
