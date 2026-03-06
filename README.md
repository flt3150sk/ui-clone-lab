# UI Clone Lab

URL の UI セクションを React + Tailwind CSS コンポーネントとして自動再現するシステム。

## Quick Start

```bash
/ui-clone https://example.com header components/Header
```

引数:

- `url` — 対象ページの URL
- `selector` — CSS selector (header, .nav, #hero 等)
- `componentPath` — 出力先 (components/Header → src/components/Header.tsx)

## 仕組み

```
URL + selector
  ↓
Phase 1: Playwright で抽出 (PC 1200px + SP 390px)
  → snapshots/ref-pc.png, ref-sp.png, layout-pc.json, layout-sp.json
  ↓
Phase 2: layout.json を jq で解析 → レイアウト構造を言語化
  ↓
Phase 3: React + Tailwind CSS コンポーネント生成
  → src/components/{Component}.tsx
  → src/app/preview/{slug}/page.tsx
  ↓
Phase 4: VRT フィードバックループ (PC + SP < 10% まで)
  → snapshots/clone-pc.png, diff-pc.png, report-pc.json
  ↓
Phase 5: Tailwind リファクタリング + VRT 再検証
  ↓
Done
```

## アーキテクチャ

### Skills (外部ツール)

| Script                 | 役割                                                  |
| ---------------------- | ----------------------------------------------------- |
| `extract-section.mjs`  | URL のセクションから DOM/CSS/screenshot/assets を抽出 |
| `screenshot-clone.mjs` | 生成コンポーネントの preview ページを撮影             |
| `vrt-compare.mjs`      | ref と clone の画像をピクセル比較                     |

### Subagents (LLM 思考役割)

| Agent                        | 役割                                   | Model   |
| ---------------------------- | -------------------------------------- | ------- |
| `ui-selector-finder`         | 曖昧な指定から CSS selector を特定     | haiku   |
| `ui-layout-analyzer`         | layout.json を jq で解析し構造を言語化 | sonnet  |
| `ui-component-generator`     | React + Tailwind コンポーネント生成    | inherit |
| `ui-tailwind-refactor-agent` | Tailwind リファクタリング              | inherit |
| `ui-visual-validator`        | VRT diff 分析 → 修正方針提示           | sonnet  |

### Command

`/ui-clone` — 全フローを orchestrate

## ディレクトリ構造

```
.claude/
  commands/
    ui-clone.md              ← スラッシュコマンド
  agents/
    ui-selector-finder.md    ← selector 特定
    ui-layout-analyzer.md    ← レイアウト解析
    ui-component-generator.md ← コンポーネント生成
    ui-tailwind-refactor-agent.md ← リファクタリング
    ui-visual-validator.md   ← VRT 分析
  skills/
    clone/
      SKILL.md
      scripts/
        extract-section.mjs
        screenshot-clone.mjs
        vrt-compare.mjs
      references/
        extraction-schema.md

snapshots/                   ← gitignored, コマンド実行ごとに削除→再生成
  ref-pc.png, ref-sp.png
  layout-pc.json, layout-sp.json
  dom.html
  clone-pc.png, clone-sp.png
  diff-pc.png, diff-sp.png
  report-pc.json, report-sp.json

public/assets/               ← DL した画像・SVG (Next.js から参照)
```

## コンテキスト管理

layout.json は巨大なため、LLM に丸ごと渡さない。jq で必要部分だけ抽出:

```bash
# 構造概要
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect}]}' snapshots/layout-pc.json

# タイポグラフィ (ユニーク)
jq '[.. | select(.typography?.fontSize?) | {tag, text, fontSize: .typography.fontSize}] | unique_by(.fontSize)' snapshots/layout-pc.json

# 色 (ユニーク)
jq '[.. | select(.colors?.backgroundColor? and .colors.backgroundColor != "rgba(0, 0, 0, 0)") | {tag, colors}] | unique' snapshots/layout-pc.json
```

## Tailwind CSS ルール

- デザイントークンなし
- arbitrary values を使用: `gap-[24px]`, `px-[16px]`, `bg-[#ffffff]`, `text-[#333]`
- PC ファースト + `md:` ブレークポイントでレスポンシブ

## VRT 基準

- PC (1200px): mismatch < 10%
- SP (390px): mismatch < 10%
- 両方クリアするまでフィードバックループ (最大 5 回)

## 前提条件

- Node.js 18+
- pnpm
- Playwright: `pnpm add -D playwright`
- pixelmatch + pngjs: `pnpm add -D pixelmatch pngjs`
- jq: `brew install jq`

## Dev Server

```bash
pnpm dev
```

http://localhost:3000 で開発サーバーが起動します。
