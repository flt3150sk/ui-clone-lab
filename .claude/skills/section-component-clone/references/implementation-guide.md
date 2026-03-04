# Section Component Implementation Guide

`extract-section.mjs` の出力からNext.js + Tailwind CSSコンポーネントを実装するためのガイド。

---

## ⚠️ layout.json は大きい — 安全な調査方法

`layout.json` はセクション内の全要素（数百ノード）の computed styles を含む。**1〜5MB になることがある。**

**絶対にやってはいけないこと：**

```js
// ❌ オブジェクト全体を JSON.stringify → 数千行の出力がコンテキストに流入する
console.log(JSON.stringify(node, null, 2));
console.log(JSON.stringify(findByClass(tree, 'hero'), null, 2));
```

**安全な調査パターン：**

```js
// ✅ スカラー値だけを出力する
node -e "
const l = require('./snapshots/section-pc/layout.json');
const t = l.tree;
// ルートの基本情報のみ
console.log(t.tag, t.id, (t.classes||[]).join('.'));
console.log('rect:', t.rect.width + 'x' + t.rect.height);
console.log('bg:', t.colors.backgroundColor);
console.log('padding:', t.layout.paddingTop, t.layout.paddingBottom);
"

// ✅ ツリー構造の確認も1行で収める
node -e "
const l = require('./snapshots/section-pc/layout.json');
function print(n, d) {
  if (d > 3) return;
  const indent = '  '.repeat(d);
  const r = n.rect;
  console.log(indent + n.tag + (n.id?'#'+n.id:'') + ' [' + Math.round(r.width) + 'x' + Math.round(r.height) + '] ' + (n.text||'').slice(0,20));
  (n.children||[]).forEach(c => print(c, d+1));
}
print(l.tree, 0);
"
```

**Read ツールで必要な行だけ読む：**

```
Read layout.json  offset=1 limit=30   ← ルートのメタ情報
Read layout.json  offset=30 limit=50  ← tree の最初の数要素
```

layout.json は「辞書」として使う。必要なときに特定の値を取りに行くのであって、全体を読み込む必要はない。

---

## layout.json の構造

`extract-section.mjs` が生成する `layout.json` は、指定セクションを起点としたツリー構造。

```json
{
  "url": "https://example.com",
  "selector": "#hero",
  "sectionRect": { "x": 0, "y": 80, "width": 1280, "height": 600 },
  "tree": {
    "tag": "section",
    "id": "hero",
    "classes": ["hero-section", "relative"],
    "rect": { "x": 0, "y": 80, "width": 1280, "height": 600 },
    "layout": {
      "display": "flex",
      "flexDirection": "column",
      "alignItems": "center",
      "paddingTop": "80px",
      "paddingBottom": "80px"
    },
    "typography": {},
    "colors": { "backgroundColor": "rgb(15, 23, 42)" },
    "hints": { "fullWidth": true },
    "children": [...]
  }
}
```

### 重要フィールド

| フィールド | 意味 | 使い方 |
|---|---|---|
| `rect` | 要素の実際のレイアウト矩形 | `w-[Xpx] h-[Ypx]` の基準値 |
| `layout.paddingTop/Bottom/Left/Right` | パディング（px値） | `pt-[Xpx]` など |
| `layout.display` | displayプロパティ | `flex`, `grid`, `block` |
| `layout.flexDirection` | flex方向 | `flex-col`, `flex-row` |
| `layout.justifyContent` | 主軸の配置 | `justify-center` など |
| `layout.alignItems` | 交差軸の配置 | `items-center` など |
| `layout.gap` | flex/gridのgap | `gap-[Xpx]` |
| `typography.fontSize` | フォントサイズ | `text-[Xpx]` |
| `typography.fontWeight` | フォントウェイト | `font-[N]` |
| `typography.lineHeight` | 行高 | `leading-[Xpx]` |
| `colors.color` | テキスト色 | `text-[rgb(...)]` |
| `colors.backgroundColor` | 背景色 | `bg-[rgb(...)]` |
| `hints.centered` | 水平センタリング | `mx-auto` を使う |
| `hints.fullWidth` | ビューポート幅いっぱい | `w-full` |
| `hints.maxWidth` | max-width値 | `max-w-[Xpx]` |

---

## コンポーネント実装パターン

### 基本構造

```tsx
// src/components/HeroSection.tsx
export function HeroSection() {
  return (
    // ルート要素は必ずソースのid/classを保持する（VRTのセレクタ一致のため）
    <section id="hero" className="hero-section ...">
      ...
    </section>
  );
}
```

**ルート要素のid/classをソースと合わせる理由：**
VRTは同一セレクタを使ってソースとクローンを比較する。コンポーネントのルート要素がソースと同じセレクタで見つかる必要がある。

### Tailwind任意値の使い方

まず正確な値で一致させ、後からリファクタリングする：

```tsx
// Phase 3 実装時：正確な値を使う
<section
  className="
    w-full
    pt-[80px] pb-[80px] px-[40px]
    bg-[rgb(15,23,42)]
    flex flex-col items-center
    gap-[32px]
  "
>

// Phase後のリファクタリング（任意）：Tailwindデフォルト値に近ければ置換
// pt-[80px] → pt-20  （80px = 20rem × 4）
// bg-[rgb(15,23,42)] → bg-slate-900  （デザイントークンに近い場合）
```

### センタリングの復元

`hints.centered = true` のとき、`getComputedStyle` はmarginをピクセル値に変換してしまうため、
`margin: auto` が失われている。`mx-auto` で明示的に復元する：

```tsx
// hints.centered: true の要素
<div className="max-w-[1200px] w-full mx-auto px-[24px]">
```

### レスポンシブ（SP対応）

SP版も抽出した場合、モバイルファーストで実装する：

```tsx
// デフォルト = SP値、md: = PC値
<section
  className="
    px-[16px] pt-[48px] pb-[48px]     // SP
    md:px-[40px] md:pt-[80px] md:pb-[80px]  // PC
    ...
  "
>
```

### よくある要素パターン

**画像：**
```tsx
// layout.json で src, naturalWidth, naturalHeight を確認
<Image
  src="/assets/component-name/hero-image.jpg"
  alt="説明"
  width={800}
  height={500}
  className="w-full h-auto"
/>
```

**アイコン（SVG）：**
```tsx
// assets/icon-0.svg の内容を確認して置き換える
// または inline SVG をそのまま使う
<svg width="24" height="24" viewBox="0 0 24 24">
  ...
</svg>
```

**リンク・ボタン：**
```tsx
// layout.json の dom.html でテキスト内容を確認する
// テキストラベルは想像しない — dom.html に書いてある内容のみ使用
<a href="#" className="...">テキスト内容</a>
```

---

## よくあるミス

### ミス1: テキスト内容を想像する

```tsx
// ❌ 想像で書く
<h1>Welcome to Our Platform</h1>

// ✅ dom.html で確認した内容を使う
<h1>次世代のクラウドインフラ</h1>
```

### ミス2: `layout.json` の値を確認せずに実装する

```tsx
// ❌ 「だいたい48px」で実装
<section className="py-12">

// ✅ layout.json の paddingTop/Bottom を確認してから実装
// layout.paddingTop: "64px", layout.paddingBottom: "64px"
<section className="pt-[64px] pb-[64px]">
```

### ミス3: NDJSON にない position を勝手に追加する

```tsx
// ❌ 「センタリングしたい」という理由で勝手に absolute を追加する
<h1 className="header__logo absolute inset-x-0 top-0 flex justify-center pt-[50px]">

// ✅ NDJSON に position の記載がなければ static のまま実装する
// Tailwind preflight は img { display: block } を設定するため
// text-center は画像に効かない → flex justify-center を使う
<h1 className="header__logo pt-[50px] mb-[60px] flex justify-center">
```

**なぜ危険か：**
`position: absolute` にするとその要素はフローから外れ、**margin が完全に無効化される**。
元サイトで `margin-bottom: 60px` が隣接要素との間隔を生み出していた場合、
absolute にするとその間隔が消えてヘッダー高さなどがずれる。

具体的な障害：
- `h1` に `marginBottom: 60px` → 親コンテナが `height: auto` なら**マージン貫通**で兄弟要素との間隔になる
- これを absolute にすると margin が無効 → 60px のギャップが消える → ヘッダー全体の高さが 60px 縮む

**確認手順：**
```bash
# position が設定されているか確認
Grep '"position"' snapshots/ref-pc/nodes-{hash}.ndjson

# margin-bottom が設定されているか確認
Grep '"marginBottom"' snapshots/ref-pc/nodes-{hash}.ndjson
```

NDJSON の CSS に `"position":"absolute"` がない要素には、position を追加してはいけない。

---

### ミス4: ルート要素のid/classを変える

```tsx
// ❌ 独自のクラス名に変える（VRTのセレクタが一致しなくなる）
<section className="my-hero-wrapper">

// ✅ ソースのid/classを保持する
<section id="hero" className="hero-section ...">
```

### ミス4: アイコンにテキストラベルを追加する

```tsx
// ❌ ソースにないラベルを追加
<button><Icon />送信</button>

// ✅ dom.html でラベルの有無を確認してから実装
<button><Icon /></button>  // ラベルなしの場合
```

---

### ミス5: 絶対配置アイコン内の画像縦位置を a.top で決め打ちする

```tsx
// ❌ a.top = NDJSON の a.rect.y と仮定してそのまま使う
<a style={{ top: 12, left: 13 }}>
  <img className="w-[24px] h-[24px]" />  {/* 実際は y:14 にレンダリングされる */}
</a>

// ✅ img.rect.y と a.rect.y の差分を mt-[Npx] で補正する
// NDJSON: a.rect.y=12, img.rect.y=14 → 差=2px
<a style={{ top: 12, left: 13 }}>
  <img className="mt-[2px] w-[24px] h-[24px]" />
</a>
```

**確認手順：**
```bash
# a と img の rect.y を比較
node -e "
const fs = require('fs');
const lines = fs.readFileSync('snapshots/ref-sp/nodes-{hash}.ndjson','utf8').trim().split('\n');
lines.filter(l=>l.includes('mypagebtn')||l.includes('cartbtn')).forEach(l=>{
  const d=JSON.parse(l);
  console.log(d.tag, d.sel.split(' > ').pop(), 'y:', d.rect.y);
});
"
```

a.rect.y と img.rect.y が一致しない場合は `mt-[差分px]` で img を下にずらす。

---

### ミス6: バッジ・浮き要素の位置を right/bottom で決め打ちする

```tsx
// ❌ right:0 で配置（a の右端にバッジが来ると思い込む）
<span style={{ top: -9, right: 0 }}>0</span>
// 実際は a.rect.x + a.rect.w ≠ badge.rect.x + badge.rect.w（溢れている場合がある）

// ✅ NDJSON の rect 差分から left/top を計算する
// NDJSON: a.rect={x:338,y:12}, badge.rect={x:355,y:7}
// → left = 355-338=17, top = 7-12=-5
<span style={{ top: -5, left: 17 }}>0</span>
```

**計算式：**
```bash
node -e "
const fs = require('fs');
const lines = fs.readFileSync('snapshots/ref-sp/nodes-{hash}.ndjson','utf8').trim().split('\n');
const a = JSON.parse(lines.find(l=>l.includes('cartBtn')));
const badge = JSON.parse(lines.find(l=>l.includes('header__badge')));
console.log('left:', badge.rect.x - a.rect.x);
console.log('top:', badge.rect.y - a.rect.y);
"
```

---

### ミス7: border を内側の div に置く

```tsx
// ❌ PC ナビ div に border-b を付ける
<div className="hidden md:block border-b border-[rgb(224,224,224)]">

// ✅ NDJSON でどの要素に borderBottomWidth があるか確認してそこに付ける
// NDJSON: header.is-fixed に borderBottomWidth: "1px" → ルート要素に付ける
<header className="is-fixed ... border-b border-[rgb(224,224,224)]">
```

**注意：SP と PC で border の有無が異なる場合がある。**
PC NDJSON と SP NDJSON を両方確認し、PC のみに必要なら `md:border-b` を使う。

```bash
# PC と SP で header の borderBottom を比較
node -e "
['ref-pc','ref-sp'].forEach(dir => {
  const lines = require('fs').readFileSync('snapshots/'+dir+'/nodes-{hash}.ndjson','utf8').trim().split('\n');
  const h = JSON.parse(lines.find(l=>JSON.parse(l).tag==='header'));
  console.log(dir, 'border:', h.css.borderBottomWidth || 'none');
});
"
```

---

### ミス8: 右基準のレイアウトで left を使う

```tsx
// ❌ アイコン群が right-[80px] で配置されているのに、
//    同じ行の要素を left:[絶対値px] で配置する
<div className="header__search absolute top-[80px] left-[905px] w-[335px]">

// ✅ 右基準で統一する — right = container_width - (element_x + element_w)
// NDJSON: search.rect={x:905,w:335}, container_width=1280
// right = 1280 - (905+335) = 40px
<div className="header__search absolute top-[80px] right-[40px] w-[335px]">
```

right 基準にすることで、ビューポート幅が変化したときも右端から一定距離を保てる。

---

## プレビューページのセットアップ

VRT実行のために、コンポーネントだけをレンダリングするページを用意する。

```tsx
// src/app/__preview__/hero-section/page.tsx
import { HeroSection } from "@/components/HeroSection";

export default function PreviewPage() {
  return <HeroSection />;
}
```

このページがあれば、VRTで以下のように比較できる：
- Source URL: `https://example.com` + selector `#hero`
- Clone URL: `http://localhost:3000/__preview__/hero-section` + selector `#hero`

---

## アセットの配置

```bash
# extract-section.mjs が出力したアセットを public/ にコピー
cp -r ./snapshots/section-pc/assets/ ./public/assets/hero-section/
```

コンポーネントからは `/assets/hero-section/filename.jpg` で参照する。

---

## VRT成功後のリファクタリング（任意）

VRTで1%未満を達成したら、任意でリファクタリングできる：

1. **Tailwind正規化** — `pt-[80px]` → `pt-20`（80px = 5rem = spacing-20）
2. **コンポーネント分割** — 大きなセクションを小さなコンポーネントに分割
3. **デザイントークン整理** — 色・フォントをCSS変数やTailwindテーマに移動

リファクタリング後は必ずVRTを再実行して、視覚的リグレッションがないことを確認すること。
