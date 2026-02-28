#!/usr/bin/env node

/**
 * Extract DOM structure, computed styles, and screenshot from a URL.
 *
 * Usage: node extract-styles.mjs <url> <output-dir>
 *
 * Outputs:
 *   - screenshot.png  (full-page screenshot at 2x scale)
 *   - dom.html        (raw DOM HTML)
 *   - layout.json     (structured element tree with computed styles)
 *
 * Requires: playwright (globally installed via `npm install -g playwright`)
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";

// ─── Configuration ───────────────────────────────────────────────
const VIEWPORT = { width: 1280, height: 720 };
const DEVICE_SCALE_FACTOR = 2;
const SETTLE_TIME_MS = 2000;
const NAVIGATION_TIMEOUT_MS = 30000;
const MAX_DEPTH = 20;

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const url = process.argv[2];
  const outputDir = resolve(process.argv[3] || "./output");

  if (!url) {
    console.error("Usage: node extract-styles.mjs <url> <output-dir>");
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });

  console.log(`🔍 Extracting: ${url}`);
  console.log(`📁 Output:     ${outputDir}`);
  console.log();

  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: "en-US",
    timezoneId: "UTC",
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

  // Settle time for any remaining async rendering
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
  const layoutData = await page.evaluate((maxDepth) => {
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

    // Build a unique CSS selector path for an element
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

    // Get only the direct text content (not from child elements)
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

    // Extract specified CSS properties from computed styles
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

    // Recursively extract an element and its children
    function extractElement(el, depth) {
      if (depth > maxDepth) return null;
      if (SKIP_TAGS.has(el.tagName)) return null;

      const styles = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // Skip invisible elements
      if (styles.display === "none") return null;
      if (styles.visibility === "hidden" && el.children.length === 0) return null;
      if (rect.width === 0 && rect.height === 0 && el.children.length === 0) return null;

      // Extract children first
      const children = [];
      for (const child of el.children) {
        const extracted = extractElement(child, depth + 1);
        if (extracted) children.push(extracted);
      }

      // Build node object
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

      // Optional identification fields
      if (el.id) node.id = el.id;
      if (el.className && typeof el.className === "string") {
        const classes = el.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) node.classes = classes;
      }

      // Text content
      const text = getDirectText(el);
      if (text) node.text = text;

      // Children
      if (children.length > 0) node.children = children;

      // Element-specific attributes
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
  }, MAX_DEPTH);

  // ─── Save layout JSON ───────────────────────────────────────
  writeFileSync(
    join(outputDir, "layout.json"),
    JSON.stringify(layoutData, null, 2),
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
  console.log();
  console.log("📁 Output files:");
  console.log(`   ${join(outputDir, "screenshot.png")}`);
  console.log(`   ${join(outputDir, "dom.html")}`);
  console.log(`   ${join(outputDir, "layout.json")}`);

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
