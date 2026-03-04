---
name: ui-refactor
description: "UIクローンで生成されたコードを、見た目を保ったまま保守性とレスポンシブ対応を改善するリファクタリングスキル。VRT（Visual Regression Testing）でピクセル単位の一致を保証しながらコード品質を向上させる。以下の場合に必ずこのスキルを使用すること：(1) UIクローンコードのリファクタリング・保守性改善、(2) マジックナンバー・absolute配置・margin依存を修正したい場合、(3) PC/SPの重複コードを共通化したい場合、(4) inline style を Tailwind に統一したい場合、(5)「コードをきれいにして」「リファクタして」「保守性を上げて」「レスポンシブを改善して」のような指示。「このクローン使いにくい」「改修しやすくして」等の間接的な表現でも発動すること。"
---

# UI Refactor

UIクローン（ui-clone / section-component-clone）で生成されたコードを、
**見た目を一切変えずに**保守性・レスポンシブ対応を改善するスキル。

## 基本思想

> 「まず再現、次に安定化、最後に抽象化」— ui-clone の最終フェーズに相当する作業。

リファクタリングの成功基準は **VRT mismatch < 1%**。
見た目が変わったリファクタリングは失敗。コード品質と視覚的一致を両立させる。

---

## 前提条件

1. 対象コンポーネント / ページの `.tsx` ファイルが存在する
2. VRT 用のリファレンススクリーンショットが存在する（通常 `snapshots/` 配下）
3. プレビューページ（`src/app/preview/[component]/page.tsx`）が存在する、または作成可能
4. dev server が起動可能（`pnpm dev`）
5. 依存パッケージ: `playwright`, `pixelmatch`, `pngjs`（既にプロジェクトに含まれている想定）

---

## ワークフロー

```
コード読解 → 分析 → ユーザー確認 → リファクタリング → VRT検証 → 修正ループ → 完了
```

| Phase | 目的 | 成果物 |
|-------|------|--------|
| 1. 分析 | 問題の洗い出し・改善方針策定 | チェックリスト結果 |
| 2. リファクタリング | ルールに沿ったコード改善 | 修正済み `.tsx` |
| 3. VRT 検証 | 見た目の一致確認 | VRT レポート |
| 4. フィードバックループ | 差分修正→再検証 | mismatch < 1% |

---

## Phase 1: 分析

対象コードを読み、以下のチェックリストで問題を洗い出す。

### チェックリスト

#### 1. margin の使用（最重要 — 全て排除する）
- `m-`, `mt-`, `mb-`, `ml-`, `mr-`, `mx-`, `my-` が使われている箇所を全てリストアップする
- 各 margin に対して gap / padding / 構造変更のどれで代替するか決定する
- 負の margin（`-mr-[40px]` 等）は構造の見直しで除去する
- `mx-auto`（センタリング用）のみ例外として許容

#### 2. ポジショニング
- `absolute` + 固定ピクセル値でレイアウトしている
  → `flex` / `grid` で置換可能か
- `absolute` が本当に必要なケースを識別
  （バッジ、オーバーレイ、装飾要素、SP のロゴ中央配置など）

#### 3. マジックナンバー
- `w-[24px]` → `w-6` 等、標準 Tailwind クラスに置換可能か
- `style={{ left: 266 }}` 等のハードコード座標
  → レイアウトシステムで解決可能か
- 繰り返し出現する値 → 定数や Tailwind テーマに抽出

#### 4. PC/SP の重複
- 同じ UI パーツ（ロゴ、アイコン、メニュー）が PC/SP で2回記述されている
- 共通コンポーネントに抽出し、props + レスポンシブクラスで分岐可能か

#### 5. スタイリング手法の混在
- `style={{}}` と Tailwind クラスが混在 → Tailwind に統一可能か
- arbitrary values (`px-[80px]`) → 標準値があれば置換（`px-20`）

#### 6. Next.js ベストプラクティス
- `<a>` → `<Link>`（ページ内遷移）
- `<img>` → `<Image>`（画像最適化）
  - 外部 CDN 画像は `next.config.ts` の `images.remotePatterns` に追加
- フォント → `next/font` での読み込み

### 分析結果の出力

問題の一覧と改善方針をユーザーに提示し、確認を取ってから Phase 2 に進む。
全てを一度に適用するか、優先度の高いものから段階的に適用するか相談する。

---

## Phase 2: リファクタリング

以下のルールを適用する。各ルールは独立しており、1つずつ適用→VRT検証しても、
まとめて適用→VRT検証してもよい。レイアウト崩れのリスクを考え、段階的適用を推奨する。

### Rule 1: margin 完全禁止 → gap / padding で代替（最優先）

**原則: margin（`m-`, `mt-`, `mb-`, `ml-`, `mr-`, `mx-`, `my-`、負の margin 含む）は一切使用しない。**

margin は余白の責務を子要素に分散させ、要素の追加・削除・並び替え時に全体の再計算が必要になる。
代わりに以下を使う:

| やりたいこと | margin の代わりに |
|------------|-----------------|
| 兄弟要素間の余白 | 親の `gap` |
| コンテナの内側余白 | `padding`（`p-`, `pt-`, `px-` 等） |
| 要素間の不均一な余白 | flex グループ化 + `gap` |
| 要素の位置微調整 | 親の `padding` で吸収、または flex alignment |
| 負の margin で端まで拡張 | 親の padding を除去、または `inset` 系で対応 |
| 垂直方向の間隔 | `flex-col` + `gap`、または `space-y-*` は使わず親に `gap` |

```tsx
// Before: 各子要素に margin を個別指定
<div className="flex items-center">
  <div className="ml-[10px] mr-[15px]">A</div>
  <div className="mx-[10px]">B</div>
  <div className="ml-[20px]">C</div>
</div>

// After: 親の gap で一元管理（margin ゼロ）
<div className="flex items-center gap-5">
  <div>A</div>
  <div>B</div>
  <div>C</div>
</div>
```

```tsx
// Before: mb で垂直間隔
<h1 className="mb-[60px]">Title</h1>
<nav>...</nav>

// After: 親を flex-col + gap に
<div className="flex flex-col gap-15">
  <h1>Title</h1>
  <nav>...</nav>
</div>
```

```tsx
// Before: mt で子要素の位置微調整
<div className="pt-3">
  <img className="mt-0.5 w-6 h-6" />
</div>

// After: 親の padding で吸収（mt-0.5 = 2px → pt-3 を pt-[14px] に）
<div className="pt-[14px]">
  <img className="w-6 h-6" />
</div>
```

```tsx
// Before: 負の margin で端まで拡張
<div className="px-5">
  <div className="-mx-5">Full width</div>
</div>

// After: 親の padding を除去するか、構造を見直す
<div>
  <div>Full width</div>
</div>
```

**間隔が不均一な場合**: グループ化（ネストした flex コンテナ）で解決する。

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div>Menu</div>
    <div>Search</div>
  </div>
  <div className="flex items-center gap-3">
    <div>Mypage</div>
    <div>Cart</div>
  </div>
</div>
```

**検証**: リファクタ後のコードに `m-`, `mt-`, `mb-`, `ml-`, `mr-`, `mx-`, `my-`, `-m` が残っていないことを確認する。`mx-auto`（センタリング用）のみ例外として許容する。

gap の値は元の margin 合計と一致させる。ズレると VRT で検出される。

### Rule 2: absolute → flexbox / grid

**なぜ**: absolute 配置は要素同士の関係が断絶され、コンテンツの変化に追従しない。
flex/grid なら要素が自動で配置され、レスポンシブ対応が容易になる。

```tsx
// Before: SP アイコン群を absolute + 固定座標で配置
<div className="relative h-[60px]">
  <div className="absolute" style={{ left: 0 }}>Menu</div>
  <div className="absolute" style={{ left: 52 }}>Search</div>
  <div className="absolute" style={{ left: 266 }}>Mypage</div>
  <div className="absolute" style={{ left: 318 }}>Cart</div>
</div>

// After: flex + spacer で自然な配置
<div className="flex items-center h-15 px-4">
  <div className="flex items-center gap-2">
    <div>Menu</div>
    <div>Search</div>
  </div>
  <div className="flex-1" />
  <div className="flex items-center gap-2">
    <div>Mypage</div>
    <div>Cart</div>
  </div>
</div>
```

**absolute を残すべきケース**:
- バッジ（カート数量の赤丸など） — 親要素に `relative`、バッジに `absolute`
- オーバーレイ要素
- SP のロゴ中央配置（アイコン群と独立して中央に置くため）
- 装飾的な線やアイコン（ハンバーガーメニューの3本線など）

### Rule 3: マジックナンバーの排除

Tailwind に対応する標準クラスがある場合は置換する。ない場合はそのまま。

```tsx
// Before
<div className="w-[24px] h-[24px]">
<div className="px-[80px]" style={{ maxWidth: 1440 }}>

// After
<div className="w-6 h-6">
<div className="px-20 max-w-[1440px]">
```

よく使う変換:
| arbitrary | canonical | 計算 |
|-----------|-----------|------|
| `w-[24px]` | `w-6` | 24/4=6 |
| `h-[48px]` | `h-12` | 48/4=12 |
| `px-[80px]` | `px-20` | 80/4=20 |
| `gap-[16px]` | `gap-4` | 16/4=4 |
| `top-[20px]` | `top-5` | 20/4=5 |
| `text-[13px]` | `text-[13px]` | 非標準、そのまま |
| `leading-[23.4px]` | `leading-[23.4px]` | 非標準、そのまま |

標準値がない場合は arbitrary value のまま残す。無理に近似しない（`13px` を `text-sm` にすると VRT で差分が出る）。

### Rule 4: PC/SP 共通コンポーネント化

PC と SP で同じ構造が重複している場合、共通コンポーネントに抽出する。

```tsx
// Before: ハンバーガーメニューが PC/SP で2回記述
// (略)

// After: 共通コンポーネント
function HamburgerIcon({ className }: { className?: string }) {
  return (
    <button className={`relative block w-5 h-[15px] ${className ?? ""}`}>
      <span className="absolute top-0 w-5 h-px rounded bg-[rgb(35,24,21)]" />
      <span className="absolute top-[7px] w-5 h-px rounded bg-[rgb(35,24,21)]" />
      <span className="absolute top-[14px] w-5 h-px rounded bg-[rgb(35,24,21)]" />
    </button>
  );
}
```

共通化の候補:
- ロゴ（PC/SP でサイズ違い → `width`/`height` props）
- ハンバーガーメニュー
- カートアイコン + バッジ
- マイページアイコン
- 検索アイコン / 検索バー

`className` を props で受け取り、PC/SP の違いは呼び出し側で制御する。
`clsx` や `cn` がプロジェクトにない場合、テンプレートリテラルで結合するか、
`clsx` を追加する（`pnpm add clsx`）。

### Rule 5: inline style → Tailwind 統一

```tsx
// Before
<div style={{ maxWidth: 1440, minWidth: 896 }}>
<div style={{ left: -20 }}>
<div style={{ fontFamily: FONT_FAMILY }}>

// After
<div className="max-w-[1440px] min-w-[896px]">
<div className="-left-5">
// fontFamily は layout.tsx または globals.css で一括設定
```

**inline style を残すべきケース**:
- 動的に計算される値（state / props による変更）
- CSS 変数バインディング

fontFamily のような全体共通のスタイルは `layout.tsx` の `next/font` か
`globals.css` で設定し、コンポーネントからは除去する。

### Rule 6: Next.js ベストプラクティス

```tsx
import Link from "next/link";
import Image from "next/image";

// <a href="/"> → <Link href="/">
// <img src="..." width={188} height={48} /> → <Image src="..." width={188} height={48} />
```

外部画像を `next/image` で使う場合、`next.config.ts` に追加:
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "www.orbis.co.jp" },
  ],
},
```

`next/image` は自動リサイズ・遅延読み込みが入るため、VRT で差分が出やすい。
差分が出た場合:
- `priority` prop で即時読み込み
- `unoptimized` prop で最適化を無効化
- `width`/`height` を明示的に指定

---

## Phase 3: VRT 検証

リファクタリング後、見た目が変わっていないことを VRT で確認する。

### 3.1 dev server の起動

```bash
pnpm dev &
# サーバーが起動するまで待機
sleep 3
```

### 3.2 スクリーンショット撮影

`screenshot.mjs` スクリプトを使用:

```bash
# PC
node .claude/skills/ui-refactor/scripts/screenshot.mjs \
  http://localhost:3000/preview/orbis-header \
  "header" \
  snapshots/vrt-refactor/clone-pc.png \
  --viewport 1280x800

# SP
node .claude/skills/ui-refactor/scripts/screenshot.mjs \
  http://localhost:3000/preview/orbis-header \
  "header" \
  snapshots/vrt-refactor/clone-sp.png \
  --viewport 390x844
```

### 3.3 VRT 比較

既存の `vrt-compare.mjs` を使用:

```bash
# PC
node .claude/skills/ui-clone/scripts/vrt-compare.mjs \
  snapshots/vrt-pc/clone-header.png \
  snapshots/vrt-refactor/clone-pc.png \
  snapshots/vrt-refactor/ \
  --suffix pc-refactor \
  --no-open

# SP
node .claude/skills/ui-clone/scripts/vrt-compare.mjs \
  snapshots/vrt-sp/clone-header.png \
  snapshots/vrt-refactor/clone-sp.png \
  snapshots/vrt-refactor/ \
  --suffix sp-refactor \
  --no-open
```

### 3.4 判定基準

| mismatch % | 判定 | アクション |
|-----------|------|----------|
| < 1% | ✅ 合格 | リファクタリング完了 |
| 1–3% | 🟡 要調整 | diff 画像を確認し、差分箇所を修正 |
| > 3% | 🔴 失敗 | レイアウト崩れ。変更を戻して段階的にやり直す |

---

## Phase 4: フィードバックループ

VRT が 1% 未満になるまで以下を繰り返す:

1. `vrt-report-*.json` の `regions` で差分箇所の座標を確認
2. diff 画像（`vrt-diff-*.png`）を Read ツールで確認し、差分箇所を特定
3. 該当箇所のスタイルを修正
4. 再度スクリーンショット → VRT 比較
5. mismatch < 1% になるまで繰り返す

### よくある差分の原因と対策

| 差分の原因 | 対策 |
|-----------|------|
| flex の gap が元の margin と微妙にズレ | gap の値を元の margin 合計値と一致させる |
| `next/image` の自動リサイズ | `width`/`height` を明示、`unoptimized` prop を検討 |
| フォントレンダリングの差 | VRT の threshold (0.1) で通常許容される |
| border/padding の計算ズレ | box-sizing を確認（Tailwind は border-box がデフォルト） |
| `next/image` の lazy loading | `priority` prop を追加して即時読み込み |
| flex 折り返しによるズレ | `flex-shrink-0` や `whitespace-nowrap` を追加 |

### ループの上限

最大 **5 回** のイテレーションで 1% 未満に到達できない場合、ユーザーに相談する。
その場合は変更のうち影響の大きいものを特定し、部分的に元に戻すことを提案する。

---

## レスポンシブ対応の指針

リファクタリング時、レスポンシブ対応も同時に改善する。

### 原則

- SP（モバイル）をデフォルト、PC を `md:` プレフィクスで拡張（Mobile First）
- `hidden md:block` / `md:hidden` による PC/SP 出し分けは維持してよい
  ただし、構造が同一なら共通コンポーネント + レスポンシブクラスで統合
- 固定幅（`w-[375px]` 等）は避け、`w-full` + `max-w-*` で柔軟に

### 具体例

```tsx
// Before: PC/SP 完全分離
<div className="hidden md:block">
  {/* PC版ヘッダー（200行） */}
</div>
<div className="md:hidden">
  {/* SP版ヘッダー（200行） */}
</div>

// After: 共通構造 + レスポンシブクラス
<div className="flex items-center h-15 md:h-auto px-5 md:px-20">
  <Logo className="w-[94px] h-6 md:w-[188px] md:h-12" />
  {/* ... */}
</div>
```

ただし、PC と SP でレイアウト構造が根本的に異なる場合（PC: 2段構成、SP: 1段構成など）、
無理に統合せず `hidden md:block` / `md:hidden` で分けるほうが保守しやすい場合もある。
見極めて判断する。

---

## 作業フロー まとめ

1. 対象ファイルを読み、Phase 1 のチェックリストで分析
2. ユーザーに分析結果と改善方針を共有、合意を得る
3. Phase 2 のルールを適用（段階的推奨）
4. Phase 3 で VRT 検証（PC + SP）
5. Phase 4 で差分修正 → 再検証ループ
6. PC/SP 両方で mismatch < 1% を達成したら完了
7. 最終的なコードをユーザーに提示し、レビューを依頼
