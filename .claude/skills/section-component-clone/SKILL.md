---
name: section-component-clone
description: "URLの特定セクションだけをNext.js + Tailwind CSSのReactコンポーネントとして実装するスキル。フルページVRTをFeedback Loopから排除し、指定セクション単位のVRTのみで閾値をクリアする。以下の場合に必ずこのスキルを使用すること：(1) ページの特定のセクション・部品だけをコンポーネントとしてクローンしたい場合、(2) 「ヒーローセクションを作って」「このカードをコンポーネントにして」「このナビゲーションを再現して」のような指示、(3) フルページではなくパーツ・セクション単位での実装が求められる場合、(4) セクション指定VRT・コンポーネントクローンに言及した場合。"
---

# Section Component Clone

URLの指定セクションをNext.js + Tailwind CSSのReactコンポーネントとして実装するスキル。
**フルページVRTはFeedback Loopに含めない。指定セクション単位のVRTのみで品質を保証する。**

## 基本思想

**指定セクションだけを見る。ページ全体の一致は不要。**

まず再現、次に安定化。Tailwindの任意値（`[16px]`、`[rgb(34,34,34)]`）でピクセルを合わせ、
セクションVRTで検証し、合格したらリファクタリングする。

差分修正の優先順位：**レイアウト → タイポグラフィ → 色 → 細部**

## 前提条件

- Playwright（グローバル）、Node.js 18+、Next.js + Tailwind CSSプロジェクト
- VRT用：`pnpm add -D pixelmatch pngjs`

## ワークフロー

```
URL + セクション指定 → 抽出(PC+SP) → コンポーネント実装 → セクションVRT → 修正ループ → 完了
```

| Phase | 目的 | 主要スクリプト |
|---|---|---|
| 1. セクション特定 | 対象セレクタを確認する | — |
| 2. 抽出 | スクリーンショット + 全要素CSS を NDJSON に保存 | `playwright-inspect.mjs` |
| 3. 実装 | NDJSON を Grep しながら Reactコンポーネントを構築 | — |
| 4. VRT & 修正ループ | セクション単位VRTで閾値クリアまで反復 | `vrt-sections.mjs` |

---

## Phase 1：セクション特定

URLとターゲットセクションのCSSセレクタを確認する。

セレクタが不明な場合：
1. ブラウザのDevToolsで要素を検査してid/classを確認する
2. または `playwright-inspect.mjs --tree` でツリーを stdout に出力して確認する

**セレクタの例：**
- `#hero` — idがheroの要素
- `.hero-section` — classがhero-sectionの要素
- `header` — headerタグ
- `section:nth-of-type(2)` — 2番目のsection

---

## Phase 2：抽出

**抽出は1回。全要素の CSS を NDJSON に保存する。以降の調査は Grep で行う。**

```bash
# PC版（1280x720）
node .claude/skills/section-component-clone/scripts/playwright-inspect.mjs \
  <url> "<css-selector>" \
  --out-dir ./snapshots/ref-pc

# SP版（390x844）が必要な場合
node .claude/skills/section-component-clone/scripts/playwright-inspect.mjs \
  <url> "<css-selector>" \
  --out-dir ./snapshots/ref-sp \
  --sp
```

**stdout（1行のみ）：**
```
✅ a1b2c3d4 | nodes-a1b2c3d4.ndjson (42 nodes) | screenshot.png
```

**ファイル出力：**
- `<out-dir>/screenshot.png` — セクションのスクリーンショット（2x DPR）
- `<out-dir>/nodes-{hash}.ndjson` — 全要素の compound selector + full CSS（1行1ノード）

### NDJSON の構造

各行が1ノード。compound selector が主キー。

```jsonl
{"sel":"header.is-fixed","tag":"header","rect":{"x":0,"y":0,"w":1280,"h":222},"css":{"display":"block","position":"relative","zIndex":"1020","backgroundColor":"rgb(255,255,255)","borderBottomWidth":"1px","borderBottomColor":"rgb(224,224,224)"}}
{"sel":"header.is-fixed > div.container > div.header.is-hide--sp > h1.header__logo > a:nth-child(1)","tag":"a","rect":{...},"css":{"color":"rgb(35,24,21)"},"href":"/"}
{"sel":"header.is-fixed > div.container > div.header.is-hide--sp > h1.header__logo > img.header__logoImg","tag":"img","rect":{"x":546,"y":50,"w":188,"h":48},"src":"img-logo.png","natural":{"w":188,"h":48}}
```

- **class/id なし要素** は `tag:nth-child(N)` で一意に識別される
- **id がある要素** は `#id` で打ち切り（例：`#keywordSearch`）
- hash は `url + selector + viewport` の SHA256 先頭8文字（決定論的）

### CSS値の取得（Grep）

```bash
# セレクタ名で検索
Grep "header__logo" snapshots/ref-pc/nodes-a1b2c3d4.ndjson

# CSSプロパティで検索
Grep "letterSpacing" snapshots/ref-pc/nodes-a1b2c3d4.ndjson

# 色で検索
Grep "rgb(35, 24" snapshots/ref-pc/nodes-a1b2c3d4.ndjson

# img src を確認
Grep '"tag":"img"' snapshots/ref-pc/nodes-a1b2c3d4.ndjson
```

### 画像URLの組み立て

NDJSON の `src` フィールドはファイル名のみの場合がある。ベースURLと組み合わせてURLを組み立てる。

```bash
# NDJSON の img ノード例
{"sel":"...img.header__logoImg","tag":"img","src":"img-logo.png","natural":{"w":188,"h":48}}

# → 実装では外部URLをそのまま src に使う（ダウンロード不要）
# src="https://example.com/path/to/img-logo.png"
```

完全なURLが必要な場合は `--tree` フラグで TREE 出力を確認するか、ブラウザの DevTools で確認する。

### デバッグ用ツリー出力

```bash
# --tree フラグで stdout にも TREE を出力（デバッグ時のみ）
node .claude/skills/section-component-clone/scripts/playwright-inspect.mjs \
  <url> "<css-selector>" --out-dir ./snapshots/ref-pc --tree
```

---

## Phase 3：コンポーネント実装

詳細は `references/implementation-guide.md` を参照。

### コーディング前の必須確認

コードを1行も書く前に `screenshot.png` と NDJSON を照合する。
これを怠ると、数値を想像で実装してしまいVRTで大量の差分が出る。

```bash
# ルート要素の CSS を確認
Grep '"sel":"header' snapshots/ref-pc/nodes-a1b2c3d4.ndjson | head -1

# padding / margin を確認
Grep "padding\|margin" snapshots/ref-pc/nodes-a1b2c3d4.ndjson

# テキスト内容を確認（"txt" フィールド）
Grep '"txt"' snapshots/ref-pc/nodes-a1b2c3d4.ndjson
```

### 出力先

```
src/components/<ComponentName>.tsx   # 実装コンポーネント
public/assets/<component-name>/     # ダウンロード済みアセット（VRT後に必要な場合のみ）
```

### ref コメントの必須記入

コンポーネントファイルの先頭に **ref hash を必ずコメントで記入する**。
VRT修正時の Grep 起点になる。

```tsx
// ref: a1b2c3d4  ← 抽出時の hash
// src: https://www.orbis.co.jp/ (header)
export function OrbisHeader() {
  ...
}
```

コンポーネントの**ルート要素**は、ソースのセレクタと同じid/classを持たせること。
（例：ソースが `header.is-fixed` なら `<header className="is-fixed">` を維持する）
これはPhase 4のVRTで同一セレクタを使うために必要。

### プレビューページの作成

VRT実行のために、コンポーネントのみをレンダリングするプレビューページを作成する：

```tsx
// src/app/preview/<component-name>/page.tsx
import { ComponentName } from "@/components/ComponentName";

export default function PreviewPage() {
  return <ComponentName />;
}
```

---

## Phase 4：セクションVRT & 修正ループ

フルページVRTは不要。セクション単位VRTのみで品質を保証する。

### VRT実行

```bash
# pnpm dev でサーバーを起動してから実行

# 1. クローンのスクリーンショットを撮影（PC）
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/preview/<component-name>', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const el = p.locator('<css-selector>').first();
  require('fs').mkdirSync('snapshots/vrt-pc', { recursive: true });
  require('fs').writeFileSync('snapshots/vrt-pc/clone.png', await el.screenshot());
  await b.close();
})();
"

# 2. 比較実行（PC）
node .claude/skills/ui-clone/scripts/vrt-compare.mjs \
  snapshots/ref-pc/screenshot-1x.png \
  snapshots/vrt-pc/clone.png \
  snapshots/vrt-pc \
  --suffix pc --no-open

# SP版（必要な場合）は --sp / viewport:390x844 で同様に実行
```

**3. 結果確認**

```bash
node -e "
const r = require('./snapshots/vrt-pc/vrt-report-pc.json');
const ok = r.comparison.mismatchPercent < 1 ? '✅' : '🔴';
console.log(ok, 'PC', r.comparison.mismatchPercent + '%');
console.log('Diff regions:', r.regions.length);
r.regions.forEach(reg => {
  console.log(' ', reg.x+','+reg.y, reg.width+'x'+reg.height, '=', reg.width*reg.height + 'px area');
});
"
```

### 成功条件

`summary.json` の `mismatchPercent` が以下を両方クリアすること：
- PC版：< 1%
- SP版：< 1%（SP版が必要な場合）

```bash
# 結果確認
node -e "
const r = require('./snapshots/vrt-pc/summary.json');
r.sections.forEach(s => {
  const ok = s.mismatchPercent < 5 ? '✅' : '🔴';
  console.log(ok, s.name, s.mismatchPercent + '%');
});
console.log('Weighted total:', r.weightedMismatchPercent + '%');
"
```

### 修正の進め方

1. `summary.json` で不一致率を確認
2. `<section-name>/diff.png` で差分箇所を視覚的に特定
3. **コンポーネントの ref hash を確認して NDJSON を Grep する**（playwright の再実行は不要）
4. 修正後に再VRTで確認（推測で直し続けない）

```bash
# Step 3 の具体例：差分が出た要素の CSS を NDJSON から取得
# まずコンポーネントから ref hash を確認
Grep "ref:" src/components/OrbisHeader.tsx
# → // ref: a1b2c3d4

# 問題のセレクタを Grep（ブラウザを起動せずに済む）
Grep "headerNav__listItem" snapshots/ref-pc/nodes-a1b2c3d4.ndjson
Grep "fontSize\|letterSpacing" snapshots/ref-sp/nodes-a1b2c3d4.ndjson
```

### diff ピクセル分析

差分が多い場合、行・列ごとのミスマッチを集計すると原因箇所が特定しやすい：

```bash
node -e "
const { PNG } = require('pngjs');
const fs = require('fs');
const diff = PNG.sync.read(fs.readFileSync('snapshots/vrt-pc/vrt-diff-pc.png'));
// 行ごとのミスマッチ数
const rowMismatch = new Array(diff.height).fill(0);
for (let y = 0; y < diff.height; y++)
  for (let x = 0; x < diff.width; x++) {
    const i = (y * diff.width + x) * 4;
    if (diff.data[i] > 200 && diff.data[i+1] < 100) rowMismatch[y]++;
  }
rowMismatch.forEach((n,y) => { if (n > 0) console.log('y='+y+':', n+'px'); });
"
```

ミスマッチが集中している y 行 → その y に対応する要素を NDJSON で特定 → 縦位置ずれを修正する。

### ストール検知

各イテレーションで不一致率を記録し、改善が停滞したら停止する。

| 条件 | アクション |
|---|---|
| 改善 < 1pp が2回連続 | 停止してユーザーに報告 |
| 不一致率が前回より悪化 | 直前の修正をrevertして停止 |
| 7回到達 | 強制停止 |
| PC/SP両方で < 1% | 成功として停止 |

停止時は不一致率の推移と残りの主要差分をユーザーに報告する。

---

## 最終出力

```
src/components/<ComponentName>.tsx    # 実装コンポーネント（PC+SPレスポンシブ対応）
src/app/preview/<name>/page.tsx  # プレビューページ
public/assets/<component-name>/     # ダウンロード済みアセット
```

`snapshots/` は `.gitignore` で除外。コミットされるのは実装コードのみ。

---

## スクリプトリファレンス

| スクリプト | 用途 | 使い方 |
|---|---|---|
| `scripts/playwright-inspect.mjs` | **構造解析（メイン）** | `node <s> <url> "<sel>" --out-dir <dir> [--sp] [--depth N] [--tree]` |
| `scripts/extract-section.mjs` | アセット一括DL（必要時のみ） | `node <s> <url> <out> --selector "<sel>" [--viewport WxH]` |
| `ui-clone/scripts/vrt-compare.mjs` | スクリーンショット比較VRT | `node <s> <src.png> <clone.png> <out-dir> [--suffix name] [--no-open]` |

### playwright-inspect.mjs オプション早見表

```
--out-dir <dir>   screenshot.png + nodes-{hash}.ndjson の保存先（必須）
--depth N         ツリー深さ（default: 8）
--sp              SP viewport (390x844) のショートハンド
--viewport WxH    任意のビューポートサイズ
--tree            stdout に TREE も出力する（デバッグ用）
```

### NDJSON Grep チートシート

```bash
# セレクタ名で検索（部分一致）
Grep "header__logo" snapshots/ref-pc/nodes-{hash}.ndjson

# タグで絞る
Grep '"tag":"img"' snapshots/ref-pc/nodes-{hash}.ndjson

# CSS プロパティ値で絞る
Grep "borderRadius\|boxShadow\|letterSpacing" snapshots/ref-pc/nodes-{hash}.ndjson

# テキスト内容を全件確認
Grep '"txt"' snapshots/ref-pc/nodes-{hash}.ndjson

# href 一覧（ナビリンク確認）
Grep '"href"' snapshots/ref-pc/nodes-{hash}.ndjson
```

## リファレンス

| ファイル | 内容 |
|---|---|
| `references/implementation-guide.md` | ツリー出力 → コンポーネント実装ガイド |

## トラブルシューティング

- **セレクタが見つからない** — `--tree` フラグでツリーを確認してid/classを特定する
- **NDJSON が少なすぎる** — `--depth` を増やす（default 8 で通常は十分）
- **差分が多すぎる** — `diff.png` を確認して差分の種類（レイアウト/色/フォント）を特定してから Grep で値を取得する
- **ループが収束しない** — ストール検知が発動したら無理に続けない。画像差異が大部分なら画像URLを確認する
- **フォント差異** — ソースと同じWebフォントを `next/font` で読み込む。フォントのみに起因する差異は ~0.5% が限界
- **疑似要素（::before/::after）の差異** — `playwright-inspect.mjs` は疑似要素を取得できない。元サイトの CSS を DevTools で確認して手動で再現する。ナビ矢印など小さな要素への影響は ~0.1% 程度で閾値 1% には影響しない
- **画像の完全URLが不明** — `Grep '"src"' nodes-{hash}.ndjson` でファイル名を確認し、ベースURLと組み合わせる
- **ソースとクローンでセレクタが一致しない** — コンポーネントのルート要素のid/classがソースと一致しているか確認する
