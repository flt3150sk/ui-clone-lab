---
name: ui-clone
description: "Clone and reproduce web UIs pixel-perfectly from URLs using Playwright-based extraction and automated comparison. Use this skill whenever: (1) the user provides a web URL and wants to recreate/clone/reproduce its UI in Next.js + Tailwind CSS, (2) the user mentions UI cloning, website reproduction, pixel-perfect matching, or visual regression testing, (3) the user wants to compare their implementation against a reference URL, or (4) the user pastes a URL and says 'clone this', 'reproduce this', 'make this in Next.js', etc. Even partial triggers like 'this URL looks nice, can you build it?' should activate this skill."
---

# UI Clone

Clone any web UI from a URL into pixel-perfect Next.js + Tailwind CSS code through automated extraction, structured comparison, and iterative repair.

## Core Philosophy

The order is: **reproduce first, stabilize, then abstract.**

Don't try to write "clean CSS" upfront. Get the pixels matching first, verify with data, then refactor. Arbitrary Tailwind values (`[16px]`, `[rgb(34,34,34)]`) are perfectly fine during reproduction — swap them for semantic tokens only after visual parity is confirmed.

## Priority Order

When fixing differences, always work in this order:
1. **Layout** (display, position, sizing, spacing, flex/grid) — most impactful, causes cascading issues
2. **Typography** (font-family, size, weight, line-height) — highly visible
3. **Colors** (text, background, border colors) — noticeable but non-structural
4. **Details** (shadows, opacity, border-radius fine-tuning) — last mile

## Prerequisites

Before starting, verify:
- Playwright is installed globally: `npm ls -g playwright`
- Node.js 18+ is available
- The project is a Next.js app with Tailwind CSS

For VRT (Phase 4), install these dev dependencies:
```bash
pnpm add -D pixelmatch pngjs
```

## Workflow Overview

```
URL → Extract Source → Implement in Next.js → Extract Clone → JSON Diff → Fix → Re-extract → ... → Pixel Match → Done
```

The process has 6 phases. Phases 0-1 capture the "truth". Phase 2 builds the implementation. Phase 3 is the iterative repair loop (the core). Phase 4 is final pixel verification. Phase 5 is optional cleanup.

---

## Phase 0: VRT Stabilization

**Purpose:** Ensure consistent, reproducible captures across runs.

The extraction script (`scripts/extract-styles.mjs`) handles stabilization automatically:
- Viewport fixed at 1280x720
- deviceScaleFactor fixed at 2
- All CSS animations and transitions disabled
- `networkidle` wait + 2s settle time
- `reducedMotion: 'reduce'` context setting
- Caret hidden to prevent cursor blink artifacts

### Custom Stabilization

If the target page requires special handling:

**Login/Auth:** Add cookie injection or login steps before extraction:
```javascript
// Add to extract-styles.mjs before page.goto()
await context.addCookies([{ name: 'session', value: '...', domain: '...' }]);
```

**Lazy content:** Add scroll-to-bottom before capture:
```javascript
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, 0));
```

**Web fonts:** Wait for fonts to load:
```javascript
await page.evaluateHandle(() => document.fonts.ready);
```

---

## Phase 1: Extract Source of Truth

Run the extraction script on the target URL:

```bash
node .claude/skills/ui-clone/scripts/extract-styles.mjs <url> ./snapshots/source
```

This produces three files:
| File | Purpose |
|---|---|
| `screenshot.png` | Full-page screenshot (visual reference + Phase 4 input) |
| `dom.html` | Raw DOM HTML (structure reference) |
| `layout.json` | Computed styles tree (Source of Truth for Phase 3) |

### Analyzing the Extracted Data

After extraction, read `layout.json` and identify:

1. **Page regions** — Header, hero, content sections, sidebar, footer
2. **Layout patterns** — Which containers use flex vs grid, absolute positioning
3. **Component boundaries** — Repeated structures that should become React components
4. **Typography system** — Distinct font-size/weight/family combinations in use
5. **Color palette** — All unique colors (group similar ones)

See `references/extraction-schema.md` for the full JSON schema.

---

## Phase 2: Next.js Implementation

Build the page based on extracted data. Read `references/implementation-guide.md` for detailed guidance.

### Key Principles

1. **Match the DOM hierarchy** — Keep your component tree similar to the source structure. If the source has `header > nav > ul > li`, build it similarly.

2. **Use exact values first** — Use Tailwind arbitrary values for exact pixel matching:
   ```jsx
   // Good: exact match first
   <div className="w-[1200px] px-[24px] py-[16px] text-[14px] text-[rgb(51,51,51)]">
   ```

3. **Work section-by-section** — Don't try to build the entire page at once. Build header, verify it, then move to the next section.

4. **Handle images** — For images, either:
   - Download source images to `public/` and reference them
   - Use placeholder images with matching dimensions
   - Use `next/image` with the source URL (if CORS allows)

5. **Handle fonts** — Check what fonts the source uses (from `typography.fontFamily` in layout.json) and load them via `next/font` or CDN.

### After Implementation

Start your dev server and extract the clone:

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Extract clone
node .claude/skills/ui-clone/scripts/extract-styles.mjs http://localhost:3000/<path> ./snapshots/clone
```

---

## Phase 3: AI Repair Loop

This is the core of the process. Use structured JSON comparison — not images — for iterative fixing.

### Run Comparison

```bash
node .claude/skills/ui-clone/scripts/compare-layouts.mjs ./snapshots/source ./snapshots/clone --output ./snapshots/diff.json
```

The script outputs:
- **Console summary** — Quick overview of match/mismatch counts by category
- **diff.json** — Full structured diff with per-element property comparisons

### Reading the Diff

The diff contains matched elements with property differences, sorted by severity:

```json
{
  "selector": "body > header > nav",
  "tag": "nav",
  "sourceRect": { "width": 1280, "height": 64 },
  "cloneRect": { "width": 1280, "height": 60 },
  "diffs": {
    "rect": { "height": { "source": 64, "clone": 60, "diff": 4 } },
    "layout": { "paddingTop": { "source": "16px", "clone": "12px" } },
    "colors": { "backgroundColor": { "source": "rgb(255,255,255)", "clone": "rgb(250,250,250)" } }
  }
}
```

### Fix Strategy

1. **Fix layout/rect diffs first** — They cause cascading position shifts in child elements
2. **Fix one section at a time** — Changing a parent's padding affects all children's positions
3. **Re-extract after each batch of fixes** — Don't accumulate fixes blindly
4. **Ignore sub-threshold diffs** — The script uses tolerance thresholds (2px for position, 5 for RGB channels)

### Loop Process

```
Read diff → Fix highest-priority diffs → Re-extract clone → Re-compare → Check improvement → Repeat
```

Typically takes 3-5 iterations to reach minimal diff. Stop when:
- Layout diffs are all within tolerance
- Typography matches
- Colors are close (exact RGB match isn't always possible due to rendering differences)

---

## Phase 4: VRT Final Verification

After Phase 3 achieves minimal JSON diff, do pixel-level comparison:

```bash
node .claude/skills/ui-clone/scripts/vrt-compare.mjs ./snapshots/source/screenshot.png ./snapshots/clone/screenshot.png ./snapshots/vrt
```

Outputs:
- `diff.png` — Visual diff (red pixels = differences)
- `report.json` — Mismatch statistics with bounding boxes

### Interpreting Results

| Mismatch % | Status | Action |
|---|---|---|
| < 1% | Excellent | Near pixel-perfect — likely just font rendering |
| 1-5% | Good | Check diff.png for remaining issues |
| > 5% | Needs work | Go back to Phase 3 with diff regions as guidance |

If specific regions show mismatch, extract their bounding boxes from `report.json` and focus fixes on those areas.

---

## Phase 5: Design Cleanup (Optional)

After achieving visual parity, optionally improve code quality:

1. **Design token extraction** — Cluster similar colors/spacing values into CSS variables or Tailwind theme extensions
2. **Tailwind normalization** — Replace arbitrary values with standard Tailwind classes where they match (e.g., `p-[16px]` → `p-4`)
3. **Component extraction** — Factor repeated patterns into reusable React components
4. **Responsive handling** — Add breakpoints if the source is responsive

**Always re-run Phase 4 after refactoring** to ensure no visual regressions.

---

## Script Reference

| Script | Purpose | Usage |
|---|---|---|
| `scripts/extract-styles.mjs` | Extract screenshot + DOM + styles from URL | `node <script> <url> <output-dir>` |
| `scripts/compare-layouts.mjs` | Compare two layout.json files | `node <script> <source-dir> <clone-dir> [--output diff.json]` |
| `scripts/vrt-compare.mjs` | Pixel-level screenshot comparison | `node <script> <source.png> <clone.png> [output-dir]` |

## Reference Files

| File | When to read |
|---|---|
| `references/extraction-schema.md` | Understanding the layout.json structure and all extracted properties |
| `references/implementation-guide.md` | Detailed guidance for translating extracted data to Next.js + Tailwind |

## Troubleshooting

### Extraction fails or hangs
- Check if the URL is accessible: `curl -I <url>`
- Increase timeout: Edit `extract-styles.mjs` timeout parameter
- Try with `headless: false` to see what's happening

### Too many diffs in comparison
- Fix parent elements first — child diffs often auto-resolve
- Check if the clone has extra wrapper divs changing the depth
- Ensure both pages use the same viewport

### Font rendering differences
- Use the same web fonts as the source (not system fonts)
- Load fonts via `next/font` for optimal rendering
- Some sub-pixel differences are unavoidable — accept < 1% mismatch

### Dynamic content differences
- Mock or fix dynamic content (dates, counters) before capture
- Use the same data/state for both captures
