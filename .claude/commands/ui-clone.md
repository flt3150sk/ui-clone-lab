## UI Clone Command

URL の指定セクションを React + Tailwind CSS コンポーネントとして再現する。

### トークン節約方針

画像の Read はトークンコストが高い (1画像 1,000〜3,000 tokens)。以下のルールで最小限に抑える:

| 画像種別 | Read 回数上限 | 代替手段 |
|---|---|---|
| ref スクリーンショット | PC/SP 各1回 | - |
| アセット画像 (public/assets/) | **0回** | `sips -g pixelWidth -g pixelHeight` で寸法確認 |
| clone スクリーンショット | **0回** | diff 画像で差異を確認 |
| diff 画像 | 初回 + 最終確認のみ (計2〜4回) | `report.json` の diff regions 座標で判断 |

**その他:**
- jq クエリは `&&` で1回の Bash にまとめる
- 修正前に根拠を言語化する（試行錯誤による無駄ループ防止）

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

**トークン節約ルール:**
- **ref スクリーンショット**: PC/SP 各1回のみ Read で目視確認する（計2回が上限）
- **アセット画像は読まない**: `public/assets/` の画像を Read で開かない。寸法確認は `sips -g pixelWidth -g pixelHeight` で行う
- **jq クエリはまとめて実行**: 同じ JSON に対する複数クエリは `&&` で1回の Bash 呼び出しにまとめる

```bash
# PC: 構造概要 + タイポグラフィ + 色を1回で取得
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect, layout: {display: .layout.display, flexDirection: .layout.flexDirection, gap: .layout.gap, justifyContent: .layout.justifyContent, alignItems: .layout.alignItems}}]}' snapshots/layout-pc.json && \
jq '[.. | objects | select(.typography?.fontSize?) | {tag, text, fontSize: .typography.fontSize, fontWeight: .typography.fontWeight, lineHeight: .typography.lineHeight, letterSpacing: .typography.letterSpacing}] | unique_by({f: .fontSize, w: .fontWeight})' snapshots/layout-pc.json && \
jq '[.. | objects | select(.colors?) | {bg: .colors.backgroundColor, fg: .colors.color}] | unique' snapshots/layout-pc.json

# SP: 構造概要 + タイポグラフィ (色は PC と共通なので省略)
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect, layout: {display: .layout.display, flexDirection: .layout.flexDirection, gap: .layout.gap, justifyContent: .layout.justifyContent, alignItems: .layout.alignItems}}]}' snapshots/layout-sp.json && \
jq '[.. | objects | select(.typography?.fontSize?) | {tag, text, fontSize: .typography.fontSize, fontWeight: .typography.fontWeight, lineHeight: .typography.lineHeight, letterSpacing: .typography.letterSpacing}] | unique_by({f: .fontSize, w: .fontWeight})' snapshots/layout-sp.json

# アセット画像の寸法確認 (Read で開かない)
for img in public/assets/*.png public/assets/*.jpg; do
  [ -f "$img" ] && sips -g pixelWidth -g pixelHeight "$img"
done
```

スクリーンショット `snapshots/ref-pc.png` と `snapshots/ref-sp.png` を Read で目視確認し、レイアウト構造を把握する。

ui-layout-analyzer エージェントに委譲して構造を言語化する。

#### Phase 3: コンポーネント生成

ui-component-generator エージェントの方針に従い、以下を生成:

1. `src/{componentPath}.tsx` — React + Tailwind CSS コンポーネント
2. `src/app/preview/{component-slug}/page.tsx` — Preview ページ

**Tailwind ルール:**
- デザイントークンなし
- arbitrary values 使用: `gap-[24px]`, `px-[16px]`, `bg-[#ffffff]`
- レスポンシブ: PC ファースト + `md:` ブレークポイント

#### Phase 4: VRT 初回フィードバックループ（目標: < 10%）

dev server を起動し、VRT を実行。**両方 < 10% になるまでループ。**

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

##### ループ手順（寸法・構造を優先）

修正の優先順位:
1. スクリーンショット寸法の不一致（コンテナ幅、padding）
2. 画像の max-width/max-height 制約を ref の表示サイズに合わせる
3. grid/flex の明示的なテンプレート値（grid-template-rows 等）
4. 不足している SP 用画像を DL・picture source で切り替え

**トークン節約ルール（画像読み込み）:**
- **clone スクリーンショットは読まない**: diff 画像で差異が分かるため `snapshots/clone-{vp}.png` を Read で開かない
- **diff 画像は初回のみ読む**: 初回ループでのみ `snapshots/diff-{vp}.png` を Read で目視確認する
- **2回目以降は report.json ベース**: `report-{vp}.json` の diff regions 座標 + `jq` で layout.json の該当箇所を取得して修正方針を立てる
- **最終確認で diff を読む**: 最終ループ後、結果を確認するために diff 画像を読んでよい

**各ループの手順:**

1. report-{vp}.json の差分リージョンを確認（座標とサイズ）
2. **初回のみ** diff-{vp}.png を Read で目視確認。2回目以降は report の座標から推測
3. layout-{vp}.json から該当箇所の正確な値を jq で取得:
   ```bash
   # diff region の座標 (x, y) から該当要素を特定 (2x DPR で割る)
   # 例: region (200, 100) → CSS座標 (100, 50) 付近
   jq '[.. | objects | select(.rect?) | select(.rect.y >= 40 and .rect.y <= 60) | {tag, text, rect, layout, typography, colors}]' snapshots/layout-pc.json
   ```
4. **修正前に方針を言語化**: 「何が原因で」「何を変えれば」改善するか明確にしてから修正する。根拠なく値を変える試行錯誤は禁止
5. コンポーネントを修正
6. Screenshot + VRT 再実行

**最大 3 回ループ。** 3 回で < 10% 未達 → ユーザーに報告。

#### Phase 5: Tailwind リファクタリング

**< 10% 達成後、すぐにリファクタリングを実行。** ui-tailwind-refactor-agent の方針に従う:

- inline style → Tailwind class
- 不要な absolute → flex/grid
- margin 全廃 → 親の gap / padding / flex で代替（mt, mb, ml, mr, mx, my すべて禁止）
- Webフォントは `next/font` で読み込み、コンポーネント内の `<link>` は禁止
- 重複整理

リファクタリング後、VRT を再実行して mismatch が大幅に悪化していないか確認。
崩れた場合はリファクタリングを修正。**画像読み込みルール**: VRT 結果の確認は report.json の数値のみ。diff 画像は悪化時のみ読む。

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
