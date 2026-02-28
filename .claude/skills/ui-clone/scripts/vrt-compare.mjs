#!/usr/bin/env node

/**
 * Visual Regression Test — pixel-level screenshot comparison.
 *
 * Usage: node vrt-compare.mjs <source.png> <clone.png> [output-dir]
 *
 * Outputs:
 *   - diff.png     (visual diff — red pixels mark differences)
 *   - report.json  (mismatch stats + bounding boxes of diff regions)
 *
 * Requires: pixelmatch, pngjs
 *   Install: pnpm add -D pixelmatch pngjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

// Dynamic imports for optional dependencies
async function loadDeps() {
  try {
    const [{ PNG }, pixelmatch] = await Promise.all([
      import("pngjs"),
      import("pixelmatch"),
    ]);
    return { PNG, pixelmatch: pixelmatch.default || pixelmatch };
  } catch (err) {
    console.error("❌ Missing dependencies. Install them with:");
    console.error("   pnpm add -D pixelmatch pngjs");
    process.exit(1);
  }
}

// ─── Image Utilities ─────────────────────────────────────────────

// Crop or pad image data to target dimensions
function normalizeImageData(img, targetWidth, targetHeight) {
  if (img.width === targetWidth && img.height === targetHeight) {
    return img.data;
  }

  const data = Buffer.alloc(targetWidth * targetHeight * 4, 0);

  const copyWidth = Math.min(img.width, targetWidth);
  const copyHeight = Math.min(img.height, targetHeight);

  for (let y = 0; y < copyHeight; y++) {
    for (let x = 0; x < copyWidth; x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = (y * targetWidth + x) * 4;
      data[dstIdx] = img.data[srcIdx];
      data[dstIdx + 1] = img.data[srcIdx + 1];
      data[dstIdx + 2] = img.data[srcIdx + 2];
      data[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }

  return data;
}

// Find bounding boxes of contiguous diff regions using flood fill
function findDiffRegions(diffData, width, height) {
  const visited = new Uint8Array(width * height);
  const regions = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const rgbaIdx = pixelIdx * 4;

      // pixelmatch colors diff pixels in red (R > 200, G < 100)
      if (diffData[rgbaIdx] > 200 && diffData[rgbaIdx + 1] < 100 && !visited[pixelIdx]) {
        // Flood fill to find contiguous region
        const queue = [[x, y]];
        let minX = x, maxX = x, minY = y, maxY = y;
        visited[pixelIdx] = 1;

        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          // Check 4 neighbors with step size for performance
          const step = 2;
          for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const nPixelIdx = ny * width + nx;
            const nRgbaIdx = nPixelIdx * 4;

            if (!visited[nPixelIdx] && diffData[nRgbaIdx] > 200 && diffData[nRgbaIdx + 1] < 100) {
              visited[nPixelIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }

        // Add padding around the region
        const pad = 10;
        regions.push({
          x: Math.max(0, minX - pad),
          y: Math.max(0, minY - pad),
          width: Math.min(width, maxX + pad + 1) - Math.max(0, minX - pad),
          height: Math.min(height, maxY + pad + 1) - Math.max(0, minY - pad),
        });
      }
    }
  }

  return mergeOverlappingRegions(regions);
}

// Merge overlapping bounding boxes
function mergeOverlappingRegions(regions) {
  if (regions.length === 0) return [];

  const merged = [...regions];
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const a = merged[i];
        const b = merged[j];

        // Check overlap
        if (
          a.x <= b.x + b.width &&
          a.x + a.width >= b.x &&
          a.y <= b.y + b.height &&
          a.y + a.height >= b.y
        ) {
          // Merge
          const x = Math.min(a.x, b.x);
          const y = Math.min(a.y, b.y);
          merged[i] = {
            x,
            y,
            width: Math.max(a.x + a.width, b.x + b.width) - x,
            height: Math.max(a.y + a.height, b.y + b.height) - y,
          };
          merged.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return merged.sort((a, b) => a.y - b.y || a.x - b.x);
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  const sourcePath = process.argv[2];
  const clonePath = process.argv[3];
  const outputDir = resolve(process.argv[4] || "./snapshots/vrt");

  if (!sourcePath || !clonePath) {
    console.error("Usage: node vrt-compare.mjs <source.png> <clone.png> [output-dir]");
    process.exit(1);
  }

  const { PNG, pixelmatch } = await loadDeps();

  mkdirSync(outputDir, { recursive: true });

  console.log("Loading images...");
  const sourceImg = PNG.sync.read(readFileSync(resolve(sourcePath)));
  const cloneImg = PNG.sync.read(readFileSync(resolve(clonePath)));

  // Use the common area for comparison
  const width = Math.min(sourceImg.width, cloneImg.width);
  const height = Math.min(sourceImg.height, cloneImg.height);

  console.log(`Source:  ${sourceImg.width}x${sourceImg.height}`);
  console.log(`Clone:   ${cloneImg.width}x${cloneImg.height}`);
  console.log(`Compare: ${width}x${height}`);

  if (sourceImg.width !== cloneImg.width || sourceImg.height !== cloneImg.height) {
    console.log("⚠️  Image sizes differ — comparing overlapping area only");
  }

  // Normalize to same size
  const sourceData = normalizeImageData(sourceImg, width, height);
  const cloneData = normalizeImageData(cloneImg, width, height);

  // Create diff image
  const diff = new PNG({ width, height });

  console.log("Comparing pixels...");
  const mismatchCount = pixelmatch(sourceData, cloneData, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false, // Anti-aliasing differences are not real mismatches
  });

  const totalPixels = width * height;
  const mismatchPercent = ((mismatchCount / totalPixels) * 100).toFixed(2);

  // Save diff image
  const diffPath = join(outputDir, "diff.png");
  writeFileSync(diffPath, PNG.sync.write(diff));

  // Find diff regions
  console.log("Analyzing diff regions...");
  const regions = findDiffRegions(diff.data, width, height);

  // Build report
  const report = {
    source: {
      path: resolve(sourcePath),
      width: sourceImg.width,
      height: sourceImg.height,
    },
    clone: {
      path: resolve(clonePath),
      width: cloneImg.width,
      height: cloneImg.height,
    },
    comparison: {
      width,
      height,
      totalPixels,
      mismatchCount,
      mismatchPercent: parseFloat(mismatchPercent),
    },
    regions,
    diffImage: diffPath,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(
    join(outputDir, "report.json"),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  // Print results
  console.log();
  console.log("═══════════════════════════════════════════");
  console.log("  VRT Results");
  console.log("═══════════════════════════════════════════");
  console.log();
  console.log(
    `  Mismatch: ${mismatchCount.toLocaleString()} / ${totalPixels.toLocaleString()} pixels (${mismatchPercent}%)`
  );

  if (parseFloat(mismatchPercent) < 1) {
    console.log("  Status:   ✅ EXCELLENT — Near pixel-perfect match");
  } else if (parseFloat(mismatchPercent) < 5) {
    console.log("  Status:   🟡 GOOD — Minor differences detected");
  } else {
    console.log("  Status:   🔴 NEEDS WORK — Significant differences");
  }

  console.log(`  Diff regions: ${regions.length}`);
  if (regions.length > 0) {
    console.log();
    for (const region of regions.slice(0, 10)) {
      console.log(
        `    📍 (${region.x}, ${region.y}) — ${region.width}x${region.height}px`
      );
    }
    if (regions.length > 10) {
      console.log(`    ... and ${regions.length - 10} more`);
    }
  }

  console.log();
  console.log(`  📄 Diff image:  ${diffPath}`);
  console.log(`  📄 Report:      ${join(outputDir, "report.json")}`);
  console.log();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
