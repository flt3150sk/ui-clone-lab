---
name: ui-clone
description: "WebのUIをURLからPlaywrightで自動抽出し、Next.js + Tailwind CSSでピクセルパーフェクトに再現するスキル。以下の場合に必ずこのスキルを使用すること：(1) ユーザーがWebのURLを提示し、そのUIをNext.js + Tailwind CSSで再現・クローンしたい場合、(2) UIクローン、Webサイト再現、ピクセルパーフェクト、VRT（Visual Regression Testing）に言及した場合、(3) 実装をリファレンスURLと比較したい場合、(4)「このURLをクローンして」「これをNext.jsで作って」「このサイトを再現して」のような指示の場合。「このサイトいい感じだね、作れる？」のような間接的なトリガーでも発動すること。"
---

# UI Clone

WebのURLから、自動抽出・構造比較・反復修正を通じて、ピクセルパーフェクトなNext.js + Tailwind CSSコードを生成する。

## 基本思想

順序は：**まず再現、次に安定化、最後に抽象化。**

最初から「きれいなCSS」を書こうとしない。まずピクセルを合わせ、データで検証し、それからリファクタリングする。再現中はTailwindの任意値（`[16px]`、`[rgb(34,34,34)]`）で全く問題ない。視覚的一致が確認できてからセマンティックトークンに置き換える。

## 優先順位

差分修正は必ずこの順序で行う：
1. **レイアウト**（display, position, サイズ, 余白, flex/grid）— 影響が最も大きく、子要素にも波及する
2. **タイポグラフィ**（font-family, size, weight, line-height）— 視覚的に目立つ
3. **色**（テキスト色, 背景色, ボーダー色）— 目立つが構造的ではない
4. **細部**（影, 透明度, border-radiusの微調整）— 最終仕上げ

## 前提条件

開始前に以下を確認：
- Playwrightがグローバルインストール済み：`npm ls -g playwright`
- Node.js 18以上
- Next.js + Tailwind CSSのプロジェクト

VRT（Phase 4）には以下のdev dependenciesが必要：
```bash
pnpm add -D pixelmatch pngjs
```

## ワークフロー概要

```
URL → PC+SP抽出 → レスポンシブ実装 → PC+SPクローン抽出 → JSON差分 → 修正 → 再抽出 → ... → PC+SPピクセル比較 → 完了
```

全6フェーズ。Phase 0-1で「真実」をPC・SP両方で取得。Phase 2でレスポンシブ対応の1つのpage.tsxを実装。Phase 3が反復修正ループ（コア）。Phase 4がPC・SP両方の最終ピクセル検証。Phase 5は任意のクリーンアップ。

---

## Phase 0：VRT安定化

**目的：** 実行間で一貫した再現可能なキャプチャを保証する。

抽出スクリプト（`scripts/extract-styles.mjs`）が自動的に安定化を行う：
- ビューポート：PC 1280x720 / SP 390x844（`--viewport WxH`で指定）
- deviceScaleFactor固定：2
- ブラウザロケール：`ja-JP`、タイムゾーン：`Asia/Tokyo`（日本語コンテンツの正確な表示のため）
- CSSアニメーション・トランジション全無効化
- `networkidle`待機 + 2秒の安定時間
- `reducedMotion: 'reduce'`コンテキスト設定
- カーソル点滅アーティファクト防止のためキャレット非表示
- **ローディング検出** — 一般的なローディング表示（`.loading`、`.skeleton`、`.spinner`、`[aria-busy="true"]`）の消滅を自動待機
- **遅延コンテンツトリガー** — ページを段階的にスクロールして遅延読み込みの画像・コンテンツを発火させ、全画像の読み込み完了を待機
- **Webフォント待機** — 抽出前に`document.fonts.ready`を待機

### カスタム安定化

対象ページに特別な処理が必要な場合：

**ログイン/認証：** 抽出前にCookieインジェクションやログインステップを追加：
```javascript
// extract-styles.mjsのpage.goto()前に追加
await context.addCookies([{ name: 'session', value: '...', domain: '...' }]);
```

**ロケール変更：** デフォルトは`ja-JP`。変更する場合は`extract-styles.mjs`のブラウザコンテキストオプションで`locale`と`timezoneId`を編集する。

---

## Phase 1：ソースオブトゥルースの抽出

対象URLに対して、PC幅とSP幅の両方で抽出スクリプトを実行：

```bash
# PC版（1280x720）
node .claude/skills/ui-clone/scripts/extract-styles.mjs <url> ./snapshots/source-pc

# SP版（390x844）
node .claude/skills/ui-clone/scripts/extract-styles.mjs <url> ./snapshots/source-sp --viewport 390x844
```

各出力ディレクトリに以下が生成される：
| ファイル | 用途 |
|---|---|
| `screenshot.png` | フルページスクリーンショット（視覚リファレンス + Phase 4の入力） |
| `dom.html` | 生のDOM HTML（構造リファレンス） |
| `layout.json` | 算出スタイルツリー（Phase 3のソースオブトゥルース） |
| `assets/` | ページからダウンロードした画像、ファビコン、SVG |
| `assets-map.json` | 元のURL → ローカルファイルパスのマッピング |

### アセットダウンロード

抽出スクリプトはページのビジュアルアセットを自動ダウンロードする：
- `<img>`要素（srcとsrcset）
- ファビコン・タッチアイコン
- CSS `background-image` URL
- インラインSVG（小アイコン ≤ 200px）

全アセットは`<output-dir>/assets/`にURLパスベースのファイル名で保存される。`assets-map.json`は各元URLとローカルパスのマッピングを提供し、実装時のアセット参照を容易にする。

### 抽出データの分析

抽出後、PC版（`source-pc/layout.json`）とSP版（`source-sp/layout.json`）の両方を読んで以下を特定する：

1. **ページ領域** — ヘッダー、ヒーロー、コンテンツセクション、サイドバー、フッター
2. **レイアウトパターン** — flex/grid/absolute positioningの使い分け
3. **コンポーネント境界** — Reactコンポーネントにすべき繰り返し構造
4. **タイポグラフィ体系** — 使用されているfont-size/weight/familyの組み合わせ
5. **カラーパレット** — 全ユニーク色（類似色をグループ化）

JSONスキーマの詳細は`references/extraction-schema.md`を参照。

---

## Phase 2：Next.js実装

抽出データに基づいてページを構築する。詳細は`references/implementation-guide.md`を参照。

### 基本原則

1. **DOM階層を合わせる** — ソースの構造に近いコンポーネントツリーを維持する。ソースが`header > nav > ul > li`なら、同様に構築する。

2. **センタリングを復元する** — 抽出データの `hints` フィールドを確認し、中央配置を復元する。`getComputedStyle` は `margin: 0 auto` を固定ピクセル値に変換してしまうため、これを行わないとコンテンツが左端に寄る：
   ```jsx
   // NG: 固定幅のみ → 左端に寄る
   <div className="w-[1152px]">

   // OK: hints.centered=true の場合 → max-width + 中央配置
   <div className="max-w-[1152px] w-full mx-auto">
   ```
   詳細は `references/implementation-guide.md` の「センタリングとレスポンシブの復元」セクションを参照。

3. **まず正確な値を使う** — ピクセル単位の一致にはTailwindの任意値を使用：
   ```jsx
   // Good: まず正確な値で一致させる
   <div className="w-[1200px] px-[24px] py-[16px] text-[14px] text-[rgb(51,51,51)]">
   ```

4. **セクション単位で作業する** — ページ全体を一度に構築しない。ヘッダーを作り、確認し、次のセクションへ進む。

5. **画像の処理** — Phase 1でダウンロードしたアセットを使用する：
   - `snapshots/source/assets/`から`public/assets/`に画像をコピー
   - `assets-map.json`で元URLとローカルパスを対応付け
   - `next/image`または`<img>`タグで`/assets/<filename>`を参照
   - ダウンロードに失敗した画像は、同じサイズのプレースホルダーを使用

6. **フォントの処理** — ソースが使用するフォント（layout.jsonの`typography.fontFamily`）を確認し、`next/font`またはCDNで読み込む。

### レスポンシブ実装

コードは1つの`page.tsx`でPC・SP両方に対応する。PC版とSP版の`layout.json`を両方参照し、Tailwindのレスポンシブプレフィックスで切り替える：

```jsx
// PC版の値をデフォルトに、SP版の値をベースに記述
<div className="flex-col md:flex-row gap-[16px] md:gap-[24px] px-[16px] md:px-[32px]">
```

**ブレークポイント戦略：**
- SP版の値をモバイルファースト（デフォルト）で記述
- PC版の値を`md:`（768px以上）プレフィックスで記述
- PC/SPで構造が大きく変わる場合（例：ハンバーガーメニュー vs ナビゲーションバー）は`hidden md:block`/`block md:hidden`で切り替える

### 実装後

開発サーバーを起動してPC版・SP版の両方でクローンを抽出：

```bash
# ターミナル1：開発サーバー起動
pnpm dev

# ターミナル2：クローン抽出（PC + SP）
node .claude/skills/ui-clone/scripts/extract-styles.mjs http://localhost:3000/<path> ./snapshots/clone-pc
node .claude/skills/ui-clone/scripts/extract-styles.mjs http://localhost:3000/<path> ./snapshots/clone-sp --viewport 390x844
```

---

## Phase 3：AI修復ループ

これがプロセスの核心。画像ではなく、構造化されたJSON比較を使って反復修正する。

### 比較の実行

PC版とSP版の両方で比較を実行する：

```bash
# PC版の比較
node .claude/skills/ui-clone/scripts/compare-layouts.mjs ./snapshots/source-pc ./snapshots/clone-pc --output ./snapshots/diff-pc.json

# SP版の比較
node .claude/skills/ui-clone/scripts/compare-layouts.mjs ./snapshots/source-sp ./snapshots/clone-sp --output ./snapshots/diff-sp.json
```

スクリプトの出力（各ビューポートごと）：
- **コンソールサマリー** — カテゴリ別の一致/不一致数の概要
- **diff.json** — 要素ごとのプロパティ比較を含む構造化差分

### 差分の読み方

差分にはマッチした要素のプロパティ差分が重要度順にソートされて含まれる：

```json
{
  "selector": "body > header > nav",
  "tag": "nav",
  "sourceRect": { "width": 1280, "height": 64 },
  "cloneRect": { "width": 1280, "height": 60 },
  "diffs": {
    "rect": { "height": { "source": 64, "clone": 60, "diff": 4 } },
    "layout": { "paddingTop": { "source": "16px", "clone": "12px" } },
    "colors": { "backgroundColor": { "source": "rgb(255,255,255)", "clone": "rgb(250,250,250)" } }
  }
}
```

### 修正戦略

1. **レイアウト/rect差分を最初に修正** — 子要素の位置ずれが連鎖するため
2. **セクション単位で修正** — 親のpadding変更は全子要素の位置に影響する
3. **修正バッチごとに再抽出** — 修正を盲目的に積み重ねない
4. **閾値以下の差分は無視** — スクリプトは許容閾値を使用（位置2px、RGBチャンネル5）

### ループの流れ

```
PC差分 + SP差分読み込み → 最優先の差分を修正 → PC/SP両方で再抽出 → 再比較 → 改善確認 → 繰り返し
```

**注意：** 修正は1つの`page.tsx`に対して行い、TailwindのレスポンシブプレフィックスでPC/SPを切り替える。PC側の修正が`md:`プレフィックス付き、SP側がデフォルト値になることが多い。

通常3〜5回の反復で最小差分に到達する。以下の場合に停止：
- PC/SP両方でレイアウト差分が全て許容範囲内
- タイポグラフィが一致
- 色が近い（レンダリング差異によりRGB完全一致は常に可能とは限らない）

---

## Phase 4：VRT最終検証

Phase 3でJSON差分が最小になった後、PC版・SP版の両方でピクセルレベルの比較を実行。**VRT結果はページと同じディレクトリに出力する：**

```bash
# PC版 VRT
node .claude/skills/ui-clone/scripts/vrt-compare.mjs \
  ./snapshots/source-pc/screenshot.png ./snapshots/clone-pc/screenshot.png \
  src/app/<path> --suffix pc

# SP版 VRT
node .claude/skills/ui-clone/scripts/vrt-compare.mjs \
  ./snapshots/source-sp/screenshot.png ./snapshots/clone-sp/screenshot.png \
  src/app/<path> --suffix sp
```

出力（`src/app/<path>/` に保存される）：
- `vrt-diff-pc.png` — PC版の視覚的差分（赤いピクセル = 差異箇所）
- `vrt-report-pc.json` — PC版の不一致統計とバウンディングボックス
- `vrt-diff-sp.png` — SP版の視覚的差分
- `vrt-report-sp.json` — SP版の不一致統計とバウンディングボックス

スクリプトはソースのスクリーンショット、クローンのスクリーンショット、差分画像を自動的に開いて横並び比較できる（macOS `open`、Linux `xdg-open`）。`--no-open`で無効化可能。

> **注意：** `snapshots/` 内の中間ファイル（抽出データ、DOM、スクリーンショット等）は `.gitignore` で除外される。gitにコミットされるのはページ実装（`page.tsx`）とVRT結果のみ。

### 結果の解釈

| 不一致率 | ステータス | アクション |
|---|---|---|
| < 1% | 優秀 | ほぼピクセルパーフェクト — フォントレンダリング差異程度 |
| 1-5% | 良好 | diff.pngで残りの問題を確認 |
| > 5% | 要改善 | diff領域をガイドにPhase 3へ戻る |

特定の領域で不一致がある場合、`report.json`からバウンディングボックスを抽出し、その箇所に集中して修正する。

---

## Phase 5：デザイン整理（任意）

視覚的一致を達成した後、任意でコード品質を改善：

1. **デザイントークン抽出** — 類似の色/spacing値をCSS変数やTailwindテーマ拡張にクラスタリング
2. **Tailwind正規化** — 任意値を標準Tailwindクラスに置換（例：`p-[16px]` → `p-4`）
3. **コンポーネント抽出** — 繰り返しパターンを再利用可能なReactコンポーネントに分離
4. **レスポンシブ対応** — ソースがレスポンシブならブレークポイントを追加

**リファクタリング後は必ずPhase 4を再実行**して、視覚的リグレッションがないことを確認する。

---

## 最終出力構造

スキルの最終成果物として、以下がgitにコミットされる：

```
src/app/<path>/
├── page.tsx            # 実装したページ（PC+SPレスポンシブ対応）
├── layout.tsx          # (必要な場合) フォント等のレイアウト設定
├── vrt-diff-pc.png     # PC版ピクセル差分画像（赤=差異箇所）
├── vrt-report-pc.json  # PC版不一致率・差分領域レポート
├── vrt-diff-sp.png     # SP版ピクセル差分画像
└── vrt-report-sp.json  # SP版不一致率・差分領域レポート
public/assets/<path>/
└── ...                 # ダウンロードした画像・アイコン
```

中間ファイル（`snapshots/`内の抽出データ、DOM、スクリーンショット等）は`.gitignore`で除外される。

---

## スクリプトリファレンス

| スクリプト | 用途 | 使い方 |
|---|---|---|
| `scripts/extract-styles.mjs` | URLからスクリーンショット+DOM+スタイル+アセットを抽出 | `node <script> <url> <output-dir> [--viewport WxH]` |
| `scripts/compare-layouts.mjs` | 2つのlayout.jsonを比較 | `node <script> <source-dir> <clone-dir> [--output diff.json]` |
| `scripts/vrt-compare.mjs` | ピクセルレベルのスクリーンショット比較（結果自動表示） | `node <script> <source.png> <clone.png> [output-dir] [--suffix name] [--no-open]` |

## リファレンスファイル

| ファイル | 読むタイミング |
|---|---|
| `references/extraction-schema.md` | layout.jsonの構造と全抽出プロパティを理解する時 |
| `references/implementation-guide.md` | 抽出データをNext.js + Tailwindに変換する詳細ガイダンスが必要な時 |

## トラブルシューティング

### 抽出が失敗またはハングする
- URLがアクセス可能か確認：`curl -I <url>`
- タイムアウトを延長：`extract-styles.mjs`のtimeoutパラメータを編集
- `headless: false`で実行して状況を確認

### 比較で差分が多すぎる
- 親要素を先に修正 — 子要素の差分は自動解消されることが多い
- クローンに余分なラッパーdivがないか確認（深さが変わる）
- 両方のページが同じビューポートを使用していることを確認

### フォントレンダリングの差異
- ソースと同じWebフォントを使用（システムフォントではなく）
- `next/font`でフォントを読み込み、最適なレンダリングを確保
- サブピクセルの差異は避けられない場合がある — 1%未満の不一致は許容

### 動的コンテンツの差異
- キャプチャ前に動的コンテンツ（日付、カウンターなど）をモックまたは固定
- 両方のキャプチャで同じデータ/状態を使用
