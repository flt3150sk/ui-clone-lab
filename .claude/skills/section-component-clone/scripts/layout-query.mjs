#!/usr/bin/env node

/**
 * Safely query layout.json without dumping the entire file into context.
 *
 * Usage:
 *   node layout-query.mjs <layout.json> <command> [args...]
 *
 * Commands:
 *   tree [maxDepth]          Print compact tree structure (default depth: 4)
 *   node <selector|#id|.cls> Print key CSS values for a matching node
 *   root                     Print root element summary
 *   children                 Print direct children of root
 *   text                     Print all text nodes
 *   find <keyword>           Find nodes whose class/id/text contains keyword
 *
 * All output is compact — safe to include in context.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function usage() {
  console.error(
    "Usage: node layout-query.mjs <layout.json> <tree|root|children|node|text|find> [args]"
  );
  process.exit(1);
}

const [, , jsonPath, command, ...args] = process.argv;
if (!jsonPath || !command) usage();

const data = JSON.parse(readFileSync(resolve(jsonPath), "utf-8"));
const tree = data.tree;

// ─── Helpers ────────────────────────────────────────────────────
function shortRect(r) {
  return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
}

function shortStyle(node) {
  const l = node.layout || {};
  const c = node.colors || {};
  const t = node.typography || {};
  const parts = [];
  if (l.display && l.display !== "block") parts.push(l.display);
  if (l.position && l.position !== "static") parts.push(`pos:${l.position}`);
  if (l.flexDirection && l.display === "flex")
    parts.push(l.flexDirection === "column" ? "col" : "row");
  if (l.alignItems && l.alignItems !== "normal") parts.push(`ai:${l.alignItems}`);
  if (l.justifyContent && l.justifyContent !== "normal")
    parts.push(`jc:${l.justifyContent}`);
  const pt = parseFloat(l.paddingTop) || 0;
  const pb = parseFloat(l.paddingBottom) || 0;
  const pl = parseFloat(l.paddingLeft) || 0;
  const pr = parseFloat(l.paddingRight) || 0;
  if (pt || pb || pl || pr)
    parts.push(`pad:${pt}/${pr}/${pb}/${pl}`);
  if (c.backgroundColor && c.backgroundColor !== "rgba(0, 0, 0, 0)")
    parts.push(`bg:${c.backgroundColor}`);
  if (t.fontSize && t.fontSize !== "14px") parts.push(`fs:${t.fontSize}`);
  if (t.fontWeight && t.fontWeight !== "400" && t.fontWeight !== "500")
    parts.push(`fw:${t.fontWeight}`);
  return parts.join(" | ");
}

function label(node) {
  const id = node.id ? `#${node.id}` : "";
  const cls = (node.classes || []).slice(0, 2).join(".");
  const tag = node.tag;
  return `${tag}${id}${cls ? "." + cls : ""}`;
}

// ─── Commands ───────────────────────────────────────────────────

if (command === "root") {
  const n = tree;
  console.log("=== ROOT ===");
  console.log("tag:    ", n.tag);
  console.log("id:     ", n.id || "(none)");
  console.log("classes:", (n.classes || []).join(", ") || "(none)");
  console.log("rect:   ", shortRect(n.rect));
  console.log("bg:     ", n.colors?.backgroundColor || "");
  console.log("border-bottom:", n.layout?.borderBottomWidth, n.colors?.borderBottomColor);
  console.log("z-index:", n.layout?.zIndex || "auto");
  console.log("children:", (n.children || []).length);
  process.exit(0);
}

if (command === "children") {
  const children = tree.children || [];
  console.log(`=== ${children.length} CHILDREN ===`);
  children.forEach((c, i) => {
    console.log(`${i}  ${label(c).padEnd(40)} ${shortRect(c.rect)}  ${shortStyle(c)}`);
  });
  process.exit(0);
}

if (command === "tree") {
  const maxDepth = parseInt(args[0] || "4", 10);
  function printTree(node, depth) {
    if (depth > maxDepth) return;
    const indent = "  ".repeat(depth);
    const text = node.text ? ` "${node.text.slice(0, 25)}"` : "";
    const src = node.src ? ` src=${node.src.split("/").pop()}` : "";
    console.log(
      `${indent}${label(node)}${text}${src}  [${shortRect(node.rect)}]  ${shortStyle(node)}`
    );
    (node.children || []).forEach((c) => printTree(c, depth + 1));
  }
  printTree(tree, 0);
  process.exit(0);
}

if (command === "text") {
  function findText(node) {
    if (node.text) {
      console.log(`${label(node).padEnd(40)} "${node.text.slice(0, 60)}"`);
    }
    (node.children || []).forEach(findText);
  }
  findText(tree);
  process.exit(0);
}

if (command === "find") {
  const keyword = (args[0] || "").toLowerCase();
  if (!keyword) { console.error("Usage: find <keyword>"); process.exit(1); }
  function findNodes(node) {
    const id = (node.id || "").toLowerCase();
    const cls = (node.classes || []).join(" ").toLowerCase();
    const text = (node.text || "").toLowerCase();
    if (id.includes(keyword) || cls.includes(keyword) || text.includes(keyword)) {
      console.log(`${label(node).padEnd(40)} [${shortRect(node.rect)}]  ${shortStyle(node)}`);
    }
    (node.children || []).forEach(findNodes);
  }
  findNodes(tree);
  process.exit(0);
}

if (command === "node") {
  const query = args[0];
  if (!query) { console.error("Usage: node <#id|.class|tagname>"); process.exit(1); }
  let found = null;
  function findNode(n) {
    if (found) return;
    const matchId = query.startsWith("#") && n.id === query.slice(1);
    const matchCls = query.startsWith(".") && (n.classes || []).includes(query.slice(1));
    const matchTag = !query.startsWith("#") && !query.startsWith(".") && n.tag === query;
    if (matchId || matchCls || matchTag) { found = n; return; }
    (n.children || []).forEach(findNode);
  }
  findNode(tree);
  if (!found) { console.log("Not found:", query); process.exit(0); }
  const n = found;
  const l = n.layout || {};
  const c = n.colors || {};
  const t = n.typography || {};
  console.log(`=== ${label(n)} ===`);
  console.log("rect:         ", shortRect(n.rect));
  console.log("display:      ", l.display);
  console.log("position:     ", l.position);
  console.log("padding:      ", `top:${l.paddingTop} right:${l.paddingRight} bottom:${l.paddingBottom} left:${l.paddingLeft}`);
  console.log("margin:       ", `top:${l.marginTop} right:${l.marginRight} bottom:${l.marginBottom} left:${l.marginLeft}`);
  console.log("flex:         ", l.flexDirection, l.justifyContent, l.alignItems);
  console.log("gap:          ", l.gap);
  console.log("bg:           ", c.backgroundColor);
  console.log("color:        ", c.color);
  console.log("border-bottom:", l.borderBottomWidth, c.borderBottomColor);
  console.log("font:         ", t.fontSize, t.fontWeight, t.fontFamily?.split(",")[0]);
  console.log("line-height:  ", t.lineHeight);
  console.log("z-index:      ", l.zIndex);
  console.log("hints:        ", JSON.stringify(n.hints || {}));
  console.log("children:     ", (n.children || []).length);
  process.exit(0);
}

usage();
