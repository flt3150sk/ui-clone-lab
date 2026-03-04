#!/usr/bin/env node

/**
 * playwright-inspect.mjs (v2)
 *
 * セクションの全要素を1回のブラウザセッションで抽出し、NDJSON に保存する。
 * 全要素に compound selector を付与し、class/id なし要素も :nth-child で一意に識別。
 *
 * Usage:
 *   node playwright-inspect.mjs <url> <selector> [options]
 *
 * Options:
 *   --out-dir <dir>   出力先（screenshot.png + nodes-{hash}.ndjson）
 *   --viewport WxH   ビューポートサイズ (default: 1280x720)
 *   --sp              --viewport 390x844 のショートハンド
 *   --depth N         ツリー深さ (default: 8)
 *   --tree            stdout に TREE も出力する（デバッグ用）
 *
 * stdout: ✅ {hash} | nodes-{hash}.ndjson ({N} nodes) | screenshot.png
 *
 * NDJSON フォーマット（1行1ノード）:
 *   {"sel":"header.is-fixed > div.container > a:nth-child(1)","tag":"a","rect":{...},"css":{...}}
 *   → Grep でセレクタ名・プロパティ名・値を検索可能
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { resolve } from "path";

// ─── CLI ─────────────────────────────────────────────────────────
function parseArgs() {
  const raw = process.argv.slice(2);
  const pos = [];
  let viewport = { width: 1280, height: 720 };
  let depth = 8;
  let outDir = null;
  let printTree = false;

  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a === "--sp") {
      viewport = { width: 390, height: 844 };
    } else if (a === "--viewport" && raw[i + 1]) {
      const [w, h] = raw[++i].split("x").map(Number);
      if (w > 0 && h > 0) viewport = { width: w, height: h };
    } else if (a === "--depth" && raw[i + 1]) {
      depth = parseInt(raw[++i], 10);
    } else if (a === "--out-dir" && raw[i + 1]) {
      outDir = resolve(raw[++i]);
    } else if (a === "--tree") {
      printTree = true;
    } else if (a === "--nodes" || a === "--assets") {
      // v1 オプション: 後方互換のため無視（警告のみ）
      if (raw[i + 1] && !raw[i + 1].startsWith("--")) i++;
      process.stderr.write(`⚠️  ${a} は v2 では不要です（全要素を自動収集します）\n`);
    } else {
      pos.push(a);
    }
  }

  if (!pos[0] || !pos[1]) {
    console.error(
      "Usage: node playwright-inspect.mjs <url> <selector>\n" +
        "  [--viewport WxH] [--sp] [--depth N]\n" +
        "  [--out-dir <dir>] [--tree]"
    );
    process.exit(1);
  }

  return { url: pos[0], selector: pos[1], viewport, depth, outDir, printTree };
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  const { url, selector, viewport, depth, outDir, printTree } = parseArgs();

  // 決定論的ハッシュ（同じ条件なら同じ ID）
  const hash = createHash("sha256")
    .update(`${url}|${selector}|${viewport.width}x${viewport.height}`)
    .digest("hex")
    .slice(0, 8);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();

  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent =
        "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }";
      document.head?.appendChild(s);
    });
  });

  process.stderr.write(`⏳ Loading ${url} ...\n`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluateHandle(() => document.fonts.ready).catch(() => {});

  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = Math.min(document.body.scrollHeight, 8000);
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);

  const loc = page.locator(selector).first();
  try {
    await loc.waitFor({ state: "visible", timeout: 10000 });
  } catch {
    console.error(`❌ Not found or not visible: ${selector}`);
    await browser.close();
    process.exit(1);
  }

  // スクリーンショット保存
  let screenshotPath = null;
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    screenshotPath = resolve(outDir, "screenshot.png");
    writeFileSync(screenshotPath, await loc.screenshot());
  }

  // ─── ページ内で全要素を一括抽出 ──────────────────────────────────
  const result = await page.evaluate(
    ({ sel, maxDepth }) => {
      const SKIP = new Set([
        "SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "HEAD", "BR", "TEMPLATE",
      ]);

      // 省略するデフォルト値
      const SKIP_VALS = new Set([
        "none", "normal", "auto", "static", "visible", "start", "ltr",
        "rgba(0, 0, 0, 0)", "transparent", "nowrap", "400",
        "0px", "0px 0px", "0px 0px 0px 0px",
      ]);

      const CSS_PROPS = [
        "display", "position", "zIndex", "overflow",
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
        "marginTop", "marginRight", "marginBottom", "marginLeft",
        "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
        "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
        "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius",
        "backgroundColor", "color", "boxShadow", "opacity",
        "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignSelf",
        "gap", "rowGap", "columnGap",
        "gridTemplateColumns", "gridTemplateRows",
        "width", "height", "maxWidth", "minWidth",
        "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing",
        "textAlign", "textDecoration", "textTransform", "whiteSpace",
      ];

      /**
       * compound selector を生成する。
       * - id があればそこで打ち切り（グローバルに一意）
       * - class があれば tag.class1.class2
       * - なければ tag:nth-child(N)
       * - rootEl から el までのパスを " > " で結合
       */
      function getCompoundSel(el, rootEl) {
        const segments = [];
        let cur = el;

        while (cur) {
          const tag = cur.tagName.toLowerCase();
          const id = cur.id;
          const cls =
            typeof cur.className === "string"
              ? cur.className.trim().split(/\s+/).filter(Boolean).slice(0, 2)
              : [];

          let seg;
          if (id) {
            seg = `#${id}`;
            segments.unshift(seg);
            break; // id は一意なので祖先は省略
          } else if (cls.length) {
            seg = `${tag}.${cls.join(".")}`;
          } else {
            const parent = cur.parentElement;
            if (parent) {
              const idx = Array.from(parent.children).indexOf(cur) + 1;
              seg = `${tag}:nth-child(${idx})`;
            } else {
              seg = tag;
            }
          }

          segments.unshift(seg);
          if (cur === rootEl) break;
          cur = cur.parentElement;
          if (!cur) break;
        }

        return segments.join(" > ");
      }

      function getRect(el) {
        const b = el.getBoundingClientRect();
        return {
          x: Math.round(b.x),
          y: Math.round(b.y),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      }

      function getCSS(el) {
        const cs = window.getComputedStyle(el);
        const result = {};
        for (const prop of CSS_PROPS) {
          const val = cs[prop];
          if (val && val !== "" && !SKIP_VALS.has(val)) {
            result[prop] = val;
          }
        }
        return result;
      }

      function directText(el) {
        let t = "";
        for (const n of el.childNodes) {
          if (n.nodeType === 3) {
            const s = n.textContent?.trim();
            if (s) t += (t ? " " : "") + s;
          }
        }
        return t || null;
      }

      function collectNodes(el, rootEl, d, acc) {
        if (d > maxDepth || SKIP.has(el.tagName)) return;
        const cs = window.getComputedStyle(el);
        if (cs.display === "none") return;

        const rect = getRect(el);
        if (rect.w === 0 && rect.h === 0 && !el.children.length) return;

        const node = {
          sel: getCompoundSel(el, rootEl),
          tag: el.tagName.toLowerCase(),
          rect,
          css: getCSS(el),
        };

        const txt = directText(el);
        if (txt) node.txt = txt.slice(0, 80);

        if (el.tagName === "IMG") {
          node.src = el.getAttribute("src");
          if (el.alt) node.alt = el.alt;
          node.natural = { w: el.naturalWidth, h: el.naturalHeight };
        }
        if (el.tagName === "A") {
          const href = el.getAttribute("href");
          if (href) node.href = href;
        }
        if (el.tagName === "INPUT") {
          node.itype = el.type;
          if (el.placeholder) node.ph = el.placeholder;
        }

        acc.push(node);

        for (const child of el.children) {
          collectNodes(child, rootEl, d + 1, acc);
        }
      }

      const rootEl = document.querySelector(sel);
      if (!rootEl) return { err: `Not found: ${sel}` };

      const nodes = [];
      collectNodes(rootEl, rootEl, 0, nodes);

      return {
        nodes,
        vp: { w: window.innerWidth, h: window.innerHeight },
      };
    },
    { sel: selector, maxDepth: depth }
  );

  await browser.close();

  if (result.err) {
    console.error("❌", result.err);
    process.exit(1);
  }

  // ─── NDJSON 保存 ──────────────────────────────────────────────────
  let ndjsonPath = null;
  if (outDir) {
    ndjsonPath = resolve(outDir, `nodes-${hash}.ndjson`);
    const lines = result.nodes.map((n) => JSON.stringify(n));
    writeFileSync(ndjsonPath, lines.join("\n") + "\n");
  }

  // stdout: 1行サマリーのみ
  const ndLabel = ndjsonPath
    ? ` | nodes-${hash}.ndjson (${result.nodes.length} nodes)`
    : ` | (${result.nodes.length} nodes, --out-dir 未指定のため未保存)`;
  const ssLabel = screenshotPath ? ` | screenshot.png` : "";
  console.log(`✅ ${hash}${ndLabel}${ssLabel}`);

  // --tree フラグ時のみ TREE を stdout に出力（デバッグ用）
  if (printTree) {
    console.log(`\n--- TREE ---`);
    for (const n of result.nodes) {
      const depth = (n.sel.match(/ > /g) || []).length;
      const ind = "  ".repeat(depth);
      const rect = `[${n.rect.w}x${n.rect.h} @ ${n.rect.x},${n.rect.y}]`;
      const txt = n.txt ? ` "${n.txt.slice(0, 30)}"` : "";
      const src = n.src ? ` src=${n.src.split("/").pop()}` : "";
      console.log(`${ind}${n.sel.split(" > ").pop()}${txt}${src}  ${rect}`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
