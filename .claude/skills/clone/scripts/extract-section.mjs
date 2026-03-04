#!/usr/bin/env node

/**
 * URL の指定セクションから DOM構造・computed styles・スクリーンショット・アセットを抽出する。
 *
 * Usage:
 *   node extract-section.mjs <url> --selector "<css-selector>" --viewport pc|sp
 *
 * Options:
 *   --selector <sel>   対象要素の CSS selector (必須)
 *   --viewport pc|sp   pc=1200x800, sp=390x844 (デフォルト: pc)
 *   --nth N            selector が複数ヒットした場合の index (デフォルト: 0)
 *
 * Outputs (snapshots/ にフラット出力):
 *   ref-{vp}.png       セクションスクリーンショット (2x scale)
 *   layout-{vp}.json   要素ツリー + computed styles
 *   dom.html           セクション outerHTML
 *
 * Assets (public/assets/ にDL):
 *   画像・SVG・背景画像
 *
 * Requires: playwright
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";

// ─── Viewport Presets ────────────────────────────────────────────
const VIEWPORTS = {
  pc: { width: 1200, height: 800 },
  sp: { width: 390, height: 844 },
};
const DEVICE_SCALE_FACTOR = 2;
const SETTLE_TIME_MS = 2000;
const NAVIGATION_TIMEOUT_MS = 30000;
const MAX_DEPTH = 20;
const ASSET_DOWNLOAD_TIMEOUT_MS = 5000;

// ─── Parse CLI args ─────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const positional = [];
  let vp = "pc";
  let selector = null;
  let nth = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--viewport" && args[i + 1]) {
      vp = args[i + 1];
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

  if (!positional[0] || !selector) {
    console.error('Usage: node extract-section.mjs <url> --selector "<css-selector>" --viewport pc|sp');
    process.exit(1);
  }

  const viewport = VIEWPORTS[vp];
  if (!viewport) {
    console.error(`Invalid viewport: ${vp}. Use "pc" or "sp".`);
    process.exit(1);
  }

  return { url: positional[0], viewport, vpName: vp, selector, nth };
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const { url, viewport, vpName, selector, nth } = parseArgs();
  const snapshotDir = resolve("./snapshots");
  const assetsDir = resolve("./public/assets");

  mkdirSync(snapshotDir, { recursive: true });
  mkdirSync(assetsDir, { recursive: true });

  console.log(`Extracting: ${selector} from ${url}`);
  console.log(`Viewport: ${vpName} (${viewport.width}x${viewport.height})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // ─── Stabilization: アニメーション・トランジション無効化 ─────
  await page.addInitScript(() => {
    const style = document.createElement("style");
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
    if (document.head) document.head.appendChild(style);
    else document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
  });

  // ─── Navigate ─────────────────────────────────────────────────
  await page.goto(url, { waitUntil: "networkidle", timeout: NAVIGATION_TIMEOUT_MS });
  await page.evaluateHandle(() => document.fonts.ready).catch(() => {});

  // ─── Loading Detection ────────────────────────────────────────
  await page.waitForFunction(() => {
    const sels = ['.loading', '.skeleton', '.spinner', '[aria-busy="true"]', '.shimmer'];
    return sels.every(s => { const el = document.querySelector(s); return !el || el.offsetParent === null; });
  }, { timeout: 15000 }).catch(() => {});

  // ─── Lazy-load trigger ────────────────────────────────────────
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 300));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return imgs.length === 0 || imgs.every(img => img.complete);
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(SETTLE_TIME_MS);

  // ─── Find target element ──────────────────────────────────────
  const locator = page.locator(selector).nth(nth);
  try {
    await locator.waitFor({ state: "visible", timeout: 10000 });
  } catch {
    console.error(`Element not found: ${selector}`);
    await browser.close();
    process.exit(1);
  }
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // ─── Section screenshot → ref-{vp}.png ────────────────────────
  const screenshotBuf = await locator.screenshot();
  writeFileSync(join(snapshotDir, `ref-${vpName}.png`), screenshotBuf);

  // ─── DOM HTML → dom.html ──────────────────────────────────────
  const domHtml = await locator.evaluate(el => el.outerHTML);
  writeFileSync(join(snapshotDir, "dom.html"), domHtml, "utf-8");

  // ─── Style Extraction → layout-{vp}.json ──────────────────────
  const layoutData = await page.evaluate(({ sel, nthIdx, maxDepth }) => {
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
      "zIndex", "width", "height", "minWidth", "minHeight", "maxWidth", "maxHeight",
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
    const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "BR", "WBR", "TEMPLATE", "SLOT"]);

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
      if (depth > maxDepth || SKIP_TAGS.has(el.tagName)) return null;
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
      // Centering hints
      const hints = {};
      const maxW = styles.getPropertyValue("max-width");
      if (maxW && maxW !== "none") hints.maxWidth = maxW;
      const ml = parseFloat(styles.marginLeft) || 0;
      const mr = parseFloat(styles.marginRight) || 0;
      const parentW = el.parentElement ? el.parentElement.getBoundingClientRect().width : window.innerWidth;
      if (rect.width > 0 && rect.width < parentW - 1 && ml > 0 && mr > 0 && Math.abs(ml - mr) < 5) hints.centered = true;
      if (Math.abs(rect.width - window.innerWidth) < 2) hints.fullWidth = true;
      if (Object.keys(hints).length > 0) node.hints = hints;

      if (el.id) node.id = el.id;
      if (el.className && typeof el.className === "string") {
        const classes = el.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) node.classes = classes;
      }
      const text = getDirectText(el);
      if (text) node.text = text;
      if (children.length > 0) node.children = children;

      if (el.tagName === "IMG") { node.src = el.getAttribute("src"); node.alt = el.getAttribute("alt") || undefined; }
      if (el.tagName === "A") node.href = el.getAttribute("href");
      if (el.tagName === "SVG") node.viewBox = el.getAttribute("viewBox");
      if (el.tagName === "BUTTON" || el.getAttribute("role") === "button") node.role = "button";

      return node;
    }

    const target = document.querySelectorAll(sel)[nthIdx];
    if (!target) return null;
    const targetRect = target.getBoundingClientRect();
    return {
      url: window.location.href,
      title: document.title,
      selector: sel,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      extractedAt: new Date().toISOString(),
      sectionRect: {
        x: Math.round(targetRect.x), y: Math.round(targetRect.y),
        width: Math.round(targetRect.width), height: Math.round(targetRect.height),
      },
      tree: extractElement(target, 0),
    };
  }, { sel: selector, nthIdx: nth, maxDepth: MAX_DEPTH });

  if (!layoutData?.tree) {
    console.error(`Failed to extract layout: ${selector}`);
    await browser.close();
    process.exit(1);
  }
  writeFileSync(join(snapshotDir, `layout-${vpName}.json`), JSON.stringify(layoutData, null, 2), "utf-8");

  // ─── Asset Download → public/assets/ ──────────────────────────
  const assetData = await page.evaluate(({ sel, nthIdx }) => {
    const el = document.querySelectorAll(sel)[nthIdx];
    if (!el) return [];
    const assets = [];
    el.querySelectorAll("img").forEach(img => {
      if (img.src && !img.src.startsWith("data:"))
        assets.push({ type: "image", url: img.src, alt: img.alt || "" });
    });
    const seen = new Set();
    el.querySelectorAll("*").forEach(child => {
      const bg = getComputedStyle(child).backgroundImage;
      if (bg && bg !== "none" && bg.includes("url(")) {
        for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
          if (!m[1].startsWith("data:") && !seen.has(m[1])) { seen.add(m[1]); assets.push({ type: "background", url: m[1] }); }
        }
      }
    });
    el.querySelectorAll("svg").forEach((svg, i) => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.width <= 200 && r.height > 0 && r.height <= 200)
        assets.push({ type: "svg", content: svg.outerHTML, viewBox: svg.getAttribute("viewBox") || "", index: i });
    });
    return assets;
  }, { sel: selector, nthIdx: nth });

  let dlCount = 0, svgCount = 0;
  const downloaded = new Set();
  for (const asset of assetData) {
    if (asset.type === "svg") {
      writeFileSync(join(assetsDir, `icon-${asset.index}.svg`), asset.content, "utf-8");
      svgCount++;
      continue;
    }
    if (!asset.url || downloaded.has(asset.url)) continue;
    downloaded.add(asset.url);
    try {
      const u = new URL(asset.url);
      const name = (u.pathname.split("/").pop() || `asset-${dlCount}`).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
      const res = await fetch(asset.url, {
        signal: AbortSignal.timeout(ASSET_DOWNLOAD_TIMEOUT_MS),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        writeFileSync(join(assetsDir, name), Buffer.from(await res.arrayBuffer()));
        dlCount++;
      }
    } catch { /* skip */ }
  }

  // ─── Summary ──────────────────────────────────────────────────
  function countNodes(n) { return n ? 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0) : 0; }
  console.log(`\nDone: ${countNodes(layoutData.tree)} elements, ${dlCount} images, ${svgCount} SVGs`);
  console.log(`  snapshots/ref-${vpName}.png`);
  console.log(`  snapshots/layout-${vpName}.json`);
  console.log(`  snapshots/dom.html`);

  await browser.close();
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
