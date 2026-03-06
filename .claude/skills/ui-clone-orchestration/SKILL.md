---
name: ui-clone-orchestration
description: "URLの指定セクションをPlaywrightで自動抽出し、Next.js + Tailwind CSSのReactコンポーネントとしてピクセルパーフェクトに再現するオーケストレーションスキル。PC/SP の抽出・解析を並列実行し、VRT mismatch < 10% になるまでフィードバックループを回す。「このURLをクローンして」「このヘッダーを再現して」「UIをコピーして」等の指示で使用すること。URLからのUI再現、セクション・コンポーネント単位の実装に積極的に使用する。"
---

# UI Clone Orchestration

URL の指定セクションを React + Tailwind CSS コンポーネントとしてピクセルパーフェクトに再現する。
PC/SP の抽出・解析をサブエージェントで並列実行し、VRT フィードバックループで品質を担保する。

このスキル自体が Sub-agent型オーケストレーションパターンの実例。
SKILL.md はフロー制御のみ行い、専門処理は agents/ に委譲する。

---

## 引数

$ARGUMENTS を以下の形式でパース:

```
<url> <selector> <componentPath>
```

例: `https://example.com header components/Header`

- `url`: 対象ページの URL
- `selector`: 対象要素の CSS selector (header, .nav, #hero 等)
- `componentPath`: 出力先 (components/Header → src/components/Header.tsx)

---

## ワークフロー

### Phase 0: 準備

1. snapshots/ ディレクトリを削除して再作成:
```bash
rm -rf snapshots && mkdir -p snapshots
```

2. 引数をパース。componentPath から:
   - ComponentName: PascalCase (例: Header)
   - component-slug: kebab-case (例: header)
   - ファイルパス: src/{componentPath}.tsx

3. セレクターが曖昧な場合（例: 「ヘッダー」「ナビゲーション」）:
   `agents/selector-finder.md` を読んでサブエージェントに CSS セレクター特定を委譲する。

### Phase 1: 抽出（PC/SP 並列）

**2つのサブエージェントを同一ターンで並列 Spawn する。**

各サブエージェントに以下を指示:

```
extract-section.mjs を実行して、指定 URL のセクションを抽出せよ。

コマンド:
node .claude/skills/ui-clone-orchestration/scripts/extract-section.mjs "<url>" --selector "<selector>" --viewport <pc|sp>

完了したら、生成されたファイルを報告せよ:
- snapshots/ref-{vp}.png
- snapshots/layout-{vp}.json
- snapshots/dom.html (PC のみ)
- public/assets/ (PC のみ)
```

PC と SP を同時に実行することで、抽出時間を半減できる。

### Phase 2: レイアウト解析（PC/SP 並列）

Phase 1 完了後、**2つのサブエージェントを同一ターンで並列 Spawn する。**

各サブエージェントに `agents/layout-analyzer.md` を読ませ、以下を指示:

```
snapshots/layout-{vp}.json を解析し、コンポーネント生成に必要な情報を抽出せよ。
agents/layout-analyzer.md の手順に従うこと。
対象 viewport: <pc|sp>
```

**出力**: 各 viewport のレイアウト構造記述（テキスト）

この段階で ref スクリーンショット（snapshots/ref-pc.png, snapshots/ref-sp.png）を Read で目視確認する。
**ref の Read はここでの PC/SP 各1回のみ。以降は読まない。**

### Phase 3: コンポーネント生成

PC/SP 両方の解析結果を統合し、`agents/component-generator.md` を読んでサブエージェントにコンポーネント生成を委譲する。

**入力**: Phase 2 の PC/SP 解析結果 + ref スクリーンショットの情報
**出力**:
- `src/{componentPath}.tsx` — React + Tailwind CSS コンポーネント
- `src/app/preview/{component-slug}/page.tsx` — Preview ページ

### Phase 4: VRT フィードバックループ（目標: < 10%）

dev server を起動し、VRT を実行。両方 < 10% になるまでループする。

```bash
# dev server 起動 (バックグラウンド)
pnpm dev &

# Screenshot
node .claude/skills/ui-clone-orchestration/scripts/screenshot-clone.mjs http://localhost:3000/preview/{component-slug} --selector "{selector}" --viewport pc
node .claude/skills/ui-clone-orchestration/scripts/screenshot-clone.mjs http://localhost:3000/preview/{component-slug} --selector "{selector}" --viewport sp

# VRT
node .claude/skills/ui-clone-orchestration/scripts/vrt-compare.mjs --viewport pc --no-open
node .claude/skills/ui-clone-orchestration/scripts/vrt-compare.mjs --viewport sp --no-open
```

結果確認:
```bash
jq '.comparison.mismatchPercent' snapshots/report-pc.json && jq '.comparison.mismatchPercent' snapshots/report-sp.json
```

#### 診断チェック（ループ開始前）

VRT 初回実行後、修正に入る前に診断を実行:

```bash
# 寸法比較
jq '{ref: {w: .ref.width, h: .ref.height}, clone: {w: .clone.width, h: .clone.height}, diff: {w: (.clone.width - .ref.width), h: (.clone.height - .ref.height)}}' snapshots/report-pc.json && \
jq '{ref: {w: .ref.width, h: .ref.height}, clone: {w: .clone.width, h: .clone.height}, diff: {w: (.clone.width - .ref.width), h: (.clone.height - .ref.height)}}' snapshots/report-sp.json

# アセット画像の寸法
for img in public/assets/*.png public/assets/*.jpg; do [ -f "$img" ] && sips -g pixelWidth -g pixelHeight "$img"; done

# レスポンシブ画像チェック
grep -o '<source[^>]*>' snapshots/dom.html || echo "No <source> tags"

# Webフォント確認
grep -oE 'fonts\.googleapis\.com/css[^"'"'"']*' snapshots/dom.html || echo "No Google Fonts"
```

#### ループ手順

mismatch > 10% の場合、`agents/visual-validator.md` を読んでサブエージェントに差分診断を委譲する。

修正の優先順位:
1. スクリーンショット寸法の不一致（コンテナ幅、padding）
2. 画像の max-width/max-height 制約
3. grid/flex のテンプレート値
4. SP 用画像の不足

**トークン節約ルール:**
- clone スクリーンショットは読まない（diff 画像で差異が分かるため）
- diff 画像は初回のみ Read。2回目以降は report.json の座標で判断
- 修正前に方針を言語化してから修正する（試行錯誤による無駄ループ防止）

**最大 3 回ループ。** 3 回で < 10% 未達 → ユーザーに報告。

### Phase 5: Tailwind リファクタリング

< 10% 達成後、`agents/tailwind-refactor.md` を読んでサブエージェントにリファクタリングを委譲する。

リファクタリング後、VRT を再実行して mismatch が大幅に悪化していないか確認。
結果確認は report.json の数値のみ。diff 画像は悪化時のみ読む。

### Phase 6: 完了報告

```
## 完了

### 生成ファイル
- src/{componentPath}.tsx
- src/app/preview/{component-slug}/page.tsx

### VRT 結果
- PC: {mismatch}%
- SP: {mismatch}%

### Preview
http://localhost:3000/preview/{component-slug}
```

---

## トークン節約方針

画像の Read はトークンコストが高い (1画像 1,000〜3,000 tokens)。

| 画像種別 | Read 回数上限 | 代替手段 |
|---|---|---|
| ref スクリーンショット | PC/SP 各1回（Phase 2） | - |
| アセット画像 | **0回** | `sips -g pixelWidth -g pixelHeight` |
| clone スクリーンショット | **0回** | diff 画像で確認 |
| diff 画像 | 初回 + 最終確認のみ | report.json の座標 |

jq クエリは `&&` で1回の Bash にまとめる。

---

## エージェント

- `agents/selector-finder.md` — Phase 0: 曖昧なキーワードから CSS セレクターを特定
- `agents/layout-analyzer.md` — Phase 2: layout.json の DOM + CSS を解析して構造を言語化
- `agents/component-generator.md` — Phase 3: React + Tailwind CSS コンポーネントを生成
- `agents/visual-validator.md` — Phase 4: VRT レポートと diff 画像から問題箇所と修正方針を提示
- `agents/tailwind-refactor.md` — Phase 5: Tailwind CSS を保守性の高い構造にリファクタリング

## リファレンス

- `references/extraction-schema.md` — layout.json の構造定義と jq チートシート

## スクリプト

- `scripts/extract-section.mjs` — セクションの DOM・styles・スクリーンショット・アセットを抽出
- `scripts/screenshot-clone.mjs` — 生成コンポーネントのスクリーンショット撮影
- `scripts/vrt-compare.mjs` — ref と clone のピクセル比較
