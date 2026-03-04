## UI Clone Command

URL の指定セクションを React + Tailwind CSS コンポーネントとして再現する。

### 引数

$ARGUMENTS を以下の形式でパース:

```
<url> <selector> <componentPath>
```

例: `https://example.com header components/Header`

- `url`: 対象ページの URL
- `selector`: 対象要素の CSS selector (header, .nav, #hero 等)
- `componentPath`: 出力先 (components/Header → src/components/Header.tsx)

---

### 処理フロー

#### Phase 0: 準備

1. snapshots/ ディレクトリを削除して再作成:
```bash
rm -rf snapshots && mkdir -p snapshots
```

2. 引数をパース。componentPath から:
   - ComponentName: PascalCase (例: Header)
   - component-slug: kebab-case (例: header)
   - ファイルパス: src/{componentPath}.tsx

#### Phase 1: 抽出 (PC + SP)

extract-section.mjs を PC と SP で実行:

```bash
node .claude/skills/clone/scripts/extract-section.mjs "<url>" --selector "<selector>" --viewport pc
node .claude/skills/clone/scripts/extract-section.mjs "<url>" --selector "<selector>" --viewport sp
```

成果物: `snapshots/ref-pc.png`, `snapshots/ref-sp.png`, `snapshots/layout-pc.json`, `snapshots/layout-sp.json`, `snapshots/dom.html`, `public/assets/`

#### Phase 2: レイアウト解析

**layout.json は丸ごと読まない。** jq で必要部分だけ抽出してコンテキストに渡す。

```bash
# 構造概要 (PC)
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect, layout: {display: .layout.display, flexDirection: .layout.flexDirection, gap: .layout.gap, justifyContent: .layout.justifyContent, alignItems: .layout.alignItems}}]}' snapshots/layout-pc.json

# 構造概要 (SP)
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect, layout: {display: .layout.display, flexDirection: .layout.flexDirection, gap: .layout.gap, justifyContent: .layout.justifyContent, alignItems: .layout.alignItems}}]}' snapshots/layout-sp.json

# タイポグラフィ (ユニーク)
jq '[.. | select(.typography?.fontSize?) | {tag, text, fontSize: .typography.fontSize, fontWeight: .typography.fontWeight, lineHeight: .typography.lineHeight}] | unique_by({f: .fontSize, w: .fontWeight})' snapshots/layout-pc.json

# 色 (ユニーク)
jq '[.. | select(.colors?) | {bg: .colors.backgroundColor, fg: .colors.color}] | map(select(.bg != "rgba(0, 0, 0, 0)")) | unique' snapshots/layout-pc.json
```

スクリーンショット `snapshots/ref-pc.png` と `snapshots/ref-sp.png` を目視確認し、レイアウト構造を把握する。

ui-layout-analyzer エージェントに委譲して構造を言語化する。

#### Phase 3: コンポーネント生成

ui-component-generator エージェントの方針に従い、以下を生成:

1. `src/{componentPath}.tsx` — React + Tailwind CSS コンポーネント
2. `src/app/preview/{component-slug}/page.tsx` — Preview ページ

**Tailwind ルール:**
- デザイントークンなし
- arbitrary values 使用: `gap-[24px]`, `px-[16px]`, `bg-[#ffffff]`
- レスポンシブ: PC ファースト + `md:` ブレークポイント

#### Phase 4: VRT フィードバックループ

dev server を起動し、VRT を実行。< 1% になるまでループ。

```bash
# dev server 起動 (バックグラウンド)
pnpm dev &

# Screenshot
node .claude/skills/clone/scripts/screenshot-clone.mjs http://localhost:3000/preview/{component-slug} --selector "{selector}" --viewport pc
node .claude/skills/clone/scripts/screenshot-clone.mjs http://localhost:3000/preview/{component-slug} --selector "{selector}" --viewport sp

# VRT
node .claude/skills/clone/scripts/vrt-compare.mjs --viewport pc --no-open
node .claude/skills/clone/scripts/vrt-compare.mjs --viewport sp --no-open
```

結果確認:
```bash
jq '.comparison.mismatchPercent' snapshots/report-pc.json
jq '.comparison.mismatchPercent' snapshots/report-sp.json
```

##### 診断チェック (ループ開始前)

VRT 初回実行後、修正に入る前に以下の診断を実行:

```bash
# 1. スクリーンショット寸法比較: ref と clone の width/height が一致しているか
jq '{ref: {w: .ref.width, h: .ref.height}, clone: {w: .clone.width, h: .clone.height}, diff: {w: (.clone.width - .ref.width), h: (.clone.height - .ref.height)}}' snapshots/report-pc.json
jq '{ref: {w: .ref.width, h: .ref.height}, clone: {w: .clone.width, h: .clone.height}, diff: {w: (.clone.width - .ref.width), h: (.clone.height - .ref.height)}}' snapshots/report-sp.json

# 2. 画像アセット検証: intrinsic サイズを確認し、ref の表示サイズと比較
for img in public/assets/*.png public/assets/*.jpg; do
  [ -f "$img" ] && sips -g pixelWidth -g pixelHeight "$img"
done

# 3. レスポンシブ画像: ref の DOM に <source> タグがあれば SP 用画像も DL
grep -o '<source[^>]*>' snapshots/dom.html || echo "No <source> tags found"

# 4. Webフォント確認: ref サイトが Google Fonts 等を読み込んでいるか
grep -oE 'fonts\.googleapis\.com/css[^"'"'"']*' snapshots/dom.html || echo "No Google Fonts found"
grep -oE 'font-family:\s*[^;]+' snapshots/dom.html | sort -u | head -10
```

##### ティア制ループ

**ティア 1 (ループ 1-2): 寸法・構造修正 — 最大インパクト**
- スクリーンショット寸法の不一致を修正（コンテナ幅、margin vs padding）
- 画像の max-width/max-height 制約を ref の表示サイズに合わせる
- grid/flex の明示的なテンプレート値（grid-template-rows 等）を設定
- 不足している SP 用画像を DL・picture source で切り替え

**ティア 2 (ループ 3-4): スペーシング・タイポグラフィ修正**
- margin, padding, gap の値を layout.json と照合
- フォントスタック（font-family）を ref と一致させる
- Webフォント読み込みが必要なら `<link>` を追加
- letter-spacing, line-height の微調整

**ティア 3 (ループ 5): 微調整**
- 色の差異
- border-radius, box-shadow
- 残差が anti-aliasing 起因なら無視可能と判断

**各ループの手順:**

1. report-{vp}.json の差分リージョンを確認
2. diff-{vp}.png を目視確認
3. layout-{vp}.json から該当箇所の正確な値を jq で取得:
   ```bash
   # y座標 100 付近の要素を取得
   jq '[.. | select(.rect?) | select(.rect.y >= 80 and .rect.y <= 120) | {tag, text, rect, layout, typography, colors}]' snapshots/layout-pc.json
   ```
4. 現在のティアに合った修正をコンポーネントに適用
5. Screenshot + VRT 再実行

**最大 5 回ループ。** 5 回で < 1% 達成できない場合はユーザーに報告（厳守）。

#### Phase 5: Tailwind リファクタリング

VRT < 1% 達成後、ui-tailwind-refactor-agent の方針に従いリファクタリング:

- inline style → Tailwind class
- 不要な absolute → flex/grid
- margin 全廃 → 親の gap / padding で代替（mt, mb, ml, mr, mx, my すべて禁止）
- 重複整理

リファクタリング後、再度 VRT を実行して < 1% を維持できているか確認。
崩れた場合はリファクタリングを修正。

#### Phase 6: 完了報告

最終結果をユーザーに報告:

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
