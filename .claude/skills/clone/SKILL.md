---
name: clone
description: "URLの指定セクションをPlaywrightで自動抽出し、Next.js + Tailwind CSSのReactコンポーネントとしてピクセルパーフェクトに再現するスキル。VRT (PC: 1200px, SP: 390px) で mismatch < 10% になるまでフィードバックループを回す。以下の場合に使用：(1) URLからUIをクローン・再現したい場合、(2) セクション・コンポーネント単位の実装、(3)「このURLをクローンして」「このヘッダーを再現して」等の指示。"
---

# Clone Skill

URL の指定セクションを React + Tailwind CSS コンポーネントとして再現する。

## Scripts

### extract-section.mjs

セクションの DOM・computed styles・スクリーンショット・アセットを抽出。

```bash
node .claude/skills/clone/scripts/extract-section.mjs <url> --selector "<sel>" --viewport pc|sp
```

出力: `snapshots/ref-{vp}.png`, `snapshots/layout-{vp}.json`, `snapshots/dom.html`, `public/assets/`

### screenshot-clone.mjs

生成コンポーネントの preview ページをスクリーンショット撮影。

```bash
node .claude/skills/clone/scripts/screenshot-clone.mjs <url> --viewport pc|sp [--selector "<sel>"]
```

出力: `snapshots/clone-{vp}.png`

### vrt-compare.mjs

ref と clone の画像をピクセル比較。

```bash
node .claude/skills/clone/scripts/vrt-compare.mjs --viewport pc|sp [--no-open]
```

出力: `snapshots/diff-{vp}.png`, `snapshots/report-{vp}.json`

## コンテキスト管理

layout.json は巨大になるため、LLM に渡す前に jq で必要部分だけ抽出する:

```bash
# トップレベル構造
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect, layout: {display: .layout.display, flexDirection: .layout.flexDirection, gap: .layout.gap, justifyContent: .layout.justifyContent, alignItems: .layout.alignItems}}]}' snapshots/layout-pc.json

# タイポグラフィ
jq '[.. | select(.typography?.fontSize?) | {tag, text, typography}] | unique_by(.typography)' snapshots/layout-pc.json

# 色
jq '[.. | select(.colors?.backgroundColor? and .colors.backgroundColor != "rgba(0, 0, 0, 0)") | {tag, colors}] | unique_by(.colors)' snapshots/layout-pc.json
```

## VRT 基準

- PC (1200px): mismatch < 10%
- SP (390px): mismatch < 10%
- 両方クリアするまでフィードバックループを回す
