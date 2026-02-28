#!/usr/bin/env node

/**
 * Compare two layout.json files and output a structured diff report.
 *
 * Usage: node compare-layouts.mjs <source-dir> <clone-dir> [--output diff.json]
 *
 * Matches elements between source and clone by tag, position, and text content,
 * then compares their computed styles. Reports:
 *   - Matched elements with style differences
 *   - Source-only elements (missing from clone)
 *   - Clone-only elements (extra in clone)
 *
 * Tolerance thresholds prevent noise from sub-pixel rendering differences.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

// ─── Tolerance Thresholds ────────────────────────────────────────
const RECT_TOLERANCE = 2; // px — position/size differences below this are ignored
const COLOR_TOLERANCE = 5; // RGB channel diff — small color rendering differences
const FONT_SIZE_TOLERANCE = 1; // px — sub-pixel font size differences

// ─── Argument Parsing ────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);

  let sourceDir = null;
  let cloneDir = null;
  let outputPath = null;

  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--output" && args[i + 1]) {
      outputPath = resolve(args[i + 1]);
      i++;
    } else {
      positional.push(args[i]);
    }
  }

  sourceDir = positional[0] ? resolve(positional[0]) : null;
  cloneDir = positional[1] ? resolve(positional[1]) : null;

  if (!sourceDir || !cloneDir) {
    console.error(
      "Usage: node compare-layouts.mjs <source-dir> <clone-dir> [--output diff.json]"
    );
    process.exit(1);
  }

  return { sourceDir, cloneDir, outputPath };
}

// ─── Tree Flattening ─────────────────────────────────────────────
// Convert tree to a flat array while preserving each element's context
function flattenTree(node, parentPath = "") {
  if (!node) return [];

  const currentPath = parentPath
    ? `${parentPath} > ${node.tag}`
    : node.tag;

  const flat = {
    tag: node.tag,
    id: node.id,
    classes: node.classes,
    selector: node.selector,
    depth: node.depth,
    text: node.text,
    path: currentPath,
    rect: node.rect,
    layout: node.layout || {},
    typography: node.typography || {},
    colors: node.colors || {},
  };

  const elements = [flat];

  if (node.children) {
    for (const child of node.children) {
      elements.push(...flattenTree(child, currentPath));
    }
  }

  return elements;
}

// ─── Color Parsing & Comparison ──────────────────────────────────
function parseColor(colorStr) {
  if (!colorStr) return null;
  const match = colorStr.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
  };
}

function colorsWithinTolerance(c1, c2) {
  const p1 = parseColor(c1);
  const p2 = parseColor(c2);
  if (!p1 || !p2) return c1 === c2;
  return (
    Math.abs(p1.r - p2.r) <= COLOR_TOLERANCE &&
    Math.abs(p1.g - p2.g) <= COLOR_TOLERANCE &&
    Math.abs(p1.b - p2.b) <= COLOR_TOLERANCE
  );
}

// ─── Size Parsing ────────────────────────────────────────────────
function parseSize(val) {
  if (val == null) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// ─── Element Matching ────────────────────────────────────────────
// Match source elements to clone elements using a scoring system:
//   - Tag match (required)
//   - Text content similarity
//   - Position proximity
//   - Depth similarity
function matchElements(sourceElements, cloneElements) {
  const matched = [];
  const usedClone = new Set();

  for (const src of sourceElements) {
    let bestMatch = null;
    let bestScore = -Infinity;

    for (let i = 0; i < cloneElements.length; i++) {
      if (usedClone.has(i)) continue;
      const cln = cloneElements[i];

      // Tag must match
      if (src.tag !== cln.tag) continue;

      let score = 10;

      // Text content match
      if (src.text && cln.text) {
        if (src.text === cln.text) {
          score += 20;
        } else if (
          src.text.includes(cln.text) ||
          cln.text.includes(src.text)
        ) {
          score += 10;
        }
      } else if (!src.text && !cln.text) {
        score += 2; // Both have no text — slight bonus
      }

      // Position similarity (lower penalty = better match)
      if (src.rect && cln.rect) {
        const dx = Math.abs(src.rect.x - cln.rect.x);
        const dy = Math.abs(src.rect.y - cln.rect.y);
        const dw = Math.abs(src.rect.width - cln.rect.width);
        const dh = Math.abs(src.rect.height - cln.rect.height);
        score -= (dx + dy + dw + dh) * 0.05;
      }

      // Size similarity bonus
      if (src.rect && cln.rect) {
        if (
          Math.abs(src.rect.width - cln.rect.width) < 10 &&
          Math.abs(src.rect.height - cln.rect.height) < 10
        ) {
          score += 5;
        }
      }

      // Depth match
      if (src.depth === cln.depth) score += 3;

      // ID match (strong signal)
      if (src.id && src.id === cln.id) score += 30;

      // Class overlap
      if (src.classes && cln.classes) {
        const overlap = src.classes.filter((c) => cln.classes.includes(c));
        score += overlap.length * 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { index: i, element: cln, score };
      }
    }

    if (bestMatch && bestScore > 5) {
      matched.push({
        source: src,
        clone: bestMatch.element,
        score: bestMatch.score,
      });
      usedClone.add(bestMatch.index);
    }
  }

  const sourceOnly = sourceElements.filter(
    (src) => !matched.some((m) => m.source === src)
  );
  const cloneOnly = cloneElements.filter((_, i) => !usedClone.has(i));

  return { matched, sourceOnly, cloneOnly };
}

// ─── Property Comparison ─────────────────────────────────────────
function compareProps(source, clone) {
  const diffs = { layout: {}, typography: {}, colors: {} };
  let hasDiffs = false;

  // Compare layout properties
  const allLayoutKeys = new Set([
    ...Object.keys(source.layout),
    ...Object.keys(clone.layout),
  ]);
  for (const key of allLayoutKeys) {
    const sVal = source.layout[key];
    const cVal = clone.layout[key];
    if (sVal === cVal) continue;

    // Apply tolerance for numeric values
    const sNum = parseSize(sVal);
    const cNum = parseSize(cVal);
    if (sNum !== null && cNum !== null && Math.abs(sNum - cNum) <= RECT_TOLERANCE) {
      continue;
    }

    // Skip default-equivalent differences
    if (isDefaultEquivalent(key, sVal, cVal)) continue;

    diffs.layout[key] = { source: sVal || "(missing)", clone: cVal || "(missing)" };
    hasDiffs = true;
  }

  // Compare typography properties
  const allTypoKeys = new Set([
    ...Object.keys(source.typography),
    ...Object.keys(clone.typography),
  ]);
  for (const key of allTypoKeys) {
    const sVal = source.typography[key];
    const cVal = clone.typography[key];
    if (sVal === cVal) continue;

    if (key === "fontSize") {
      const s = parseSize(sVal);
      const c = parseSize(cVal);
      if (s !== null && c !== null && Math.abs(s - c) <= FONT_SIZE_TOLERANCE) continue;
    }

    // Font family normalization: ignore quote differences
    if (key === "fontFamily" && sVal && cVal) {
      const normalize = (f) => f.replace(/['"]/g, "").toLowerCase().trim();
      if (normalize(sVal) === normalize(cVal)) continue;
    }

    diffs.typography[key] = { source: sVal || "(missing)", clone: cVal || "(missing)" };
    hasDiffs = true;
  }

  // Compare color properties
  const allColorKeys = new Set([
    ...Object.keys(source.colors),
    ...Object.keys(clone.colors),
  ]);
  for (const key of allColorKeys) {
    const sVal = source.colors[key];
    const cVal = clone.colors[key];
    if (sVal === cVal) continue;
    if (colorsWithinTolerance(sVal, cVal)) continue;

    diffs.colors[key] = { source: sVal || "(missing)", clone: cVal || "(missing)" };
    hasDiffs = true;
  }

  // Compare bounding rect
  const rectDiffs = {};
  if (source.rect && clone.rect) {
    for (const key of ["x", "y", "width", "height"]) {
      const diff = Math.abs(source.rect[key] - clone.rect[key]);
      if (diff > RECT_TOLERANCE) {
        rectDiffs[key] = {
          source: source.rect[key],
          clone: clone.rect[key],
          diff: Math.round(diff * 10) / 10,
        };
      }
    }
    if (Object.keys(rectDiffs).length > 0) {
      diffs.rect = rectDiffs;
      hasDiffs = true;
    }
  }

  return hasDiffs ? diffs : null;
}

// Check if two values are effectively equivalent despite textual difference
function isDefaultEquivalent(prop, val1, val2) {
  // "visible" and "" for overflow are effectively the same
  if (prop.startsWith("overflow")) {
    const defaults = new Set(["visible", ""]);
    if (defaults.has(val1 || "") && defaults.has(val2 || "")) return true;
  }
  // "auto" and "0" for z-index
  if (prop === "zIndex") {
    const defaults = new Set(["auto", "0", ""]);
    if (defaults.has(val1 || "") && defaults.has(val2 || "")) return true;
  }
  return false;
}

// ─── Report Generation ───────────────────────────────────────────
function generateReport(matched, sourceOnly, cloneOnly, sourceCount, cloneCount) {
  const diffs = [];

  for (const { source, clone } of matched) {
    const propDiffs = compareProps(source, clone);
    if (propDiffs) {
      diffs.push({
        selector: source.selector,
        tag: source.tag,
        text: source.text ? source.text.substring(0, 80) : undefined,
        sourceRect: source.rect,
        cloneRect: clone.rect,
        diffs: propDiffs,
      });
    }
  }

  // Sort by impact: rect diffs first, then layout count, then typography, then colors
  diffs.sort((a, b) => {
    const score = (d) =>
      (d.diffs.rect ? 100 : 0) +
      Object.keys(d.diffs.layout).length * 10 +
      Object.keys(d.diffs.typography).length * 5 +
      Object.keys(d.diffs.colors).length;
    return score(b) - score(a);
  });

  const summary = {
    totalSource: sourceCount,
    totalClone: cloneCount,
    matched: matched.length,
    withDiffs: diffs.length,
    noDiffs: matched.length - diffs.length,
    sourceOnly: sourceOnly.length,
    cloneOnly: cloneOnly.length,
    categories: {
      rect: diffs.filter((d) => d.diffs.rect).length,
      layout: diffs.filter((d) => Object.keys(d.diffs.layout).length > 0).length,
      typography: diffs.filter((d) => Object.keys(d.diffs.typography).length > 0).length,
      colors: diffs.filter((d) => Object.keys(d.diffs.colors).length > 0).length,
    },
  };

  return {
    summary,
    diffs,
    sourceOnly: sourceOnly.slice(0, 50).map((e) => ({
      selector: e.selector,
      tag: e.tag,
      text: e.text ? e.text.substring(0, 80) : undefined,
      rect: e.rect,
    })),
    cloneOnly: cloneOnly.slice(0, 50).map((e) => ({
      selector: e.selector,
      tag: e.tag,
      text: e.text ? e.text.substring(0, 80) : undefined,
      rect: e.rect,
    })),
  };
}

// ─── Console Output ──────────────────────────────────────────────
function printReport(report) {
  const { summary, diffs } = report;

  console.log();
  console.log("═══════════════════════════════════════════");
  console.log("  Layout Comparison Report");
  console.log("═══════════════════════════════════════════");
  console.log();
  console.log(`  Source elements:   ${summary.totalSource}`);
  console.log(`  Clone elements:    ${summary.totalClone}`);
  console.log(`  Matched:           ${summary.matched}`);
  console.log(`  With differences:  ${summary.withDiffs}`);
  console.log(`  Perfect matches:   ${summary.noDiffs}`);
  console.log(`  Source-only:       ${summary.sourceOnly}`);
  console.log(`  Clone-only:        ${summary.cloneOnly}`);
  console.log();
  console.log("  Differences by category:");
  console.log(`    Position/Size:  ${summary.categories.rect}`);
  console.log(`    Layout:         ${summary.categories.layout}`);
  console.log(`    Typography:     ${summary.categories.typography}`);
  console.log(`    Colors:         ${summary.categories.colors}`);

  if (diffs.length > 0) {
    console.log();
    console.log("───────────────────────────────────────────");
    console.log("  Top Differences (max 15)");
    console.log("───────────────────────────────────────────");

    for (const diff of diffs.slice(0, 15)) {
      const label = diff.text ? ` "${diff.text}"` : "";
      console.log();
      console.log(`  ${diff.selector}`);
      if (label) console.log(`    text:${label}`);

      if (diff.diffs.rect) {
        for (const [key, val] of Object.entries(diff.diffs.rect)) {
          console.log(
            `    rect.${key}: ${val.source} → ${val.clone} (Δ${val.diff}px)`
          );
        }
      }
      for (const cat of ["layout", "typography", "colors"]) {
        for (const [key, val] of Object.entries(diff.diffs[cat] || {})) {
          console.log(`    ${cat}.${key}: ${val.source} → ${val.clone}`);
        }
      }
    }
  }

  console.log();
  console.log("═══════════════════════════════════════════");
}

// ─── Main ────────────────────────────────────────────────────────
function main() {
  const { sourceDir, cloneDir, outputPath } = parseArgs();

  console.log("Loading layout data...");
  const sourceData = JSON.parse(
    readFileSync(join(sourceDir, "layout.json"), "utf-8")
  );
  const cloneData = JSON.parse(
    readFileSync(join(cloneDir, "layout.json"), "utf-8")
  );

  console.log("Flattening element trees...");
  const sourceElements = flattenTree(sourceData.tree);
  const cloneElements = flattenTree(cloneData.tree);

  console.log(`Source: ${sourceElements.length} elements`);
  console.log(`Clone:  ${cloneElements.length} elements`);

  console.log("Matching elements...");
  const { matched, sourceOnly, cloneOnly } = matchElements(
    sourceElements,
    cloneElements
  );

  const report = generateReport(
    matched,
    sourceOnly,
    cloneOnly,
    sourceElements.length,
    cloneElements.length
  );

  printReport(report);

  if (outputPath) {
    writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`📄 Full diff saved to: ${outputPath}`);
  } else {
    // Default: save to source directory
    const defaultPath = join(sourceDir, "..", "diff.json");
    writeFileSync(defaultPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`📄 Full diff saved to: ${defaultPath}`);
  }
}

main();
