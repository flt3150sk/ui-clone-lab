#!/usr/bin/env node

/**
 * VRT (Visual Regression Test) — ref と clone のスクリーンショットをピクセル比較する。
 *
 * Usage:
 *   node vrt-compare.mjs --viewport pc|sp [--no-open]
 *
 * 入力 (snapshots/ から読み込み):
 *   ref-{vp}.png     元サイトスクリーンショット
 *   clone-{vp}.png   生成コンポーネントスクリーンショット
 *
 * 出力 (snapshots/ にフラット出力):
 *   diff-{vp}.png      差分画像 (赤ピクセル = 差分)
 *   report-{vp}.json   差分率 + 差分リージョン
 *
 * Requires: pixelmatch, pngjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

async function loadDeps() {
  try {
    const [{ PNG }, pixelmatch] = await Promise.all([import("pngjs"), import("pixelmatch")]);
    return { PNG, pixelmatch: pixelmatch.default || pixelmatch };
  } catch {
    console.error("Missing deps. Run: pnpm add -D pixelmatch pngjs");
    process.exit(1);
  }
}

// サイズ正規化: 小さい方に合わせてクロップ or パディング
function normalizeImageData(img, tw, th) {
  if (img.width === tw && img.height === th) return img.data;
  const data = Buffer.alloc(tw * th * 4, 0);
  const cw = Math.min(img.width, tw), ch = Math.min(img.height, th);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = (y * img.width + x) * 4, di = (y * tw + x) * 4;
      data[di] = img.data[si]; data[di+1] = img.data[si+1];
      data[di+2] = img.data[si+2]; data[di+3] = img.data[si+3];
    }
  }
  return data;
}

// 差分リージョン検出 (flood fill)
function findDiffRegions(diffData, w, h) {
  const visited = new Uint8Array(w * h);
  const regions = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x, ri = pi * 4;
      if (diffData[ri] > 200 && diffData[ri+1] < 100 && !visited[pi]) {
        const queue = [[x, y]];
        let minX = x, maxX = x, minY = y, maxY = y;
        visited[pi] = 1;
        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
          for (const [dx, dy] of [[2,0],[-2,0],[0,2],[0,-2]]) {
            const nx = cx+dx, ny = cy+dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const npi = ny * w + nx, nri = npi * 4;
            if (!visited[npi] && diffData[nri] > 200 && diffData[nri+1] < 100) {
              visited[npi] = 1; queue.push([nx, ny]);
            }
          }
        }
        const pad = 10;
        regions.push({
          x: Math.max(0, minX-pad), y: Math.max(0, minY-pad),
          width: Math.min(w, maxX+pad+1) - Math.max(0, minX-pad),
          height: Math.min(h, maxY+pad+1) - Math.max(0, minY-pad),
        });
      }
    }
  }
  // マージ: 重なるリージョンを統合
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < regions.length; i++) {
      for (let j = i+1; j < regions.length; j++) {
        const a = regions[i], b = regions[j];
        if (a.x <= b.x+b.width && a.x+a.width >= b.x && a.y <= b.y+b.height && a.y+a.height >= b.y) {
          const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
          regions[i] = { x, y, width: Math.max(a.x+a.width, b.x+b.width)-x, height: Math.max(a.y+a.height, b.y+b.height)-y };
          regions.splice(j, 1); changed = true; break;
        }
      }
      if (changed) break;
    }
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}

async function main() {
  const args = process.argv.slice(2);
  const vpIdx = args.indexOf("--viewport");
  const vpName = (vpIdx !== -1 && args[vpIdx+1]) ? args[vpIdx+1] : "pc";
  if (!["pc", "sp"].includes(vpName)) { console.error('viewport must be "pc" or "sp"'); process.exit(1); }

  const dir = resolve("./snapshots");
  mkdirSync(dir, { recursive: true });

  const refPath = join(dir, `ref-${vpName}.png`);
  const clonePath = join(dir, `clone-${vpName}.png`);

  const { PNG, pixelmatch } = await loadDeps();

  const refImg = PNG.sync.read(readFileSync(refPath));
  const cloneImg = PNG.sync.read(readFileSync(clonePath));

  const w = Math.min(refImg.width, cloneImg.width);
  const h = Math.min(refImg.height, cloneImg.height);

  console.log(`Ref:   ${refImg.width}x${refImg.height}`);
  console.log(`Clone: ${cloneImg.width}x${cloneImg.height}`);
  console.log(`Compare: ${w}x${h}`);

  const refData = normalizeImageData(refImg, w, h);
  const cloneData = normalizeImageData(cloneImg, w, h);
  const diff = new PNG({ width: w, height: h });

  const mismatch = pixelmatch(refData, cloneData, diff.data, w, h, {
    threshold: 0.1,
    includeAA: false,
  });

  const total = w * h;
  const pct = ((mismatch / total) * 100).toFixed(2);

  // Output
  const diffPath = join(dir, `diff-${vpName}.png`);
  writeFileSync(diffPath, PNG.sync.write(diff));

  const regions = findDiffRegions(diff.data, w, h);
  const report = {
    viewport: vpName,
    ref: { width: refImg.width, height: refImg.height },
    clone: { width: cloneImg.width, height: cloneImg.height },
    comparison: { width: w, height: h, totalPixels: total, mismatchCount: mismatch, mismatchPercent: parseFloat(pct) },
    regions,
    timestamp: new Date().toISOString(),
  };
  const reportPath = join(dir, `report-${vpName}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  // Summary
  const status = parseFloat(pct) < 1 ? "PASS (< 10%)" : parseFloat(pct) < 5 ? "WARN" : "FAIL";
  console.log(`\nMismatch: ${pct}% (${mismatch.toLocaleString()} / ${total.toLocaleString()} px)`);
  console.log(`Status: ${status}`);
  console.log(`Diff regions: ${regions.length}`);
  regions.slice(0, 5).forEach(r => console.log(`  (${r.x}, ${r.y}) ${r.width}x${r.height}px`));
  console.log(`\n  ${diffPath}\n  ${reportPath}`);

  // Auto-open (macOS)
  if (!args.includes("--no-open")) {
    const { execSync } = await import("child_process");
    try { execSync(`open "${diffPath}"`, { stdio: "ignore" }); } catch {}
  }
}

main().catch(err => { console.error("Error:", err.message); process.exit(1); });
