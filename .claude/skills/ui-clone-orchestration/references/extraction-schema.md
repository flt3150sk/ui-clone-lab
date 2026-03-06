# Extraction Schema

`layout-{vp}.json` の構造定義。

## Root

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "selector": "header",
  "viewport": { "width": 1200, "height": 800 },
  "sectionRect": { "x": 0, "y": 0, "width": 1200, "height": 72 },
  "tree": { /* ElementNode */ }
}
```

## ElementNode

```json
{
  "tag": "div",
  "depth": 0,
  "rect": { "x": 0, "y": 0, "width": 1200, "height": 72 },
  "layout": { "display": "flex", "gap": "24px", ... },
  "typography": { "fontSize": "16px", "fontWeight": "400", ... },
  "colors": { "color": "rgb(0,0,0)", "backgroundColor": "rgb(255,255,255)", ... },
  "text": "テキスト内容",
  "children": [ ... ]
}
```

### layout properties

display, position, margin*, padding*, border*Width, border*Radius,
overflow, flex*, grid*, gap, zIndex, width, height, min/max Width/Height

### typography properties

fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing,
textAlign, whiteSpace, textDecoration, textTransform

### colors properties

color, backgroundColor, border*Color, boxShadow, opacity

### optional fields

| Field | When |
|---|---|
| id | 要素に id がある |
| classes | CSS クラスがある |
| text | 直接テキストを持つ |
| hints | centering / fullWidth / maxWidth 検出 |
| src, alt | `<img>` |
| href | `<a>` |
| viewBox | `<svg>` |
| role | `<button>` |

## jq チートシート

```bash
# 構造概要 (トークン節約)
jq '{tag: .tree.tag, rect: .tree.rect, layout: .tree.layout, children: [.tree.children[]? | {tag, text, rect}]}' layout-pc.json

# 全テキスト
jq '[.. | select(.text?) | {tag, text, depth}]' layout-pc.json

# ユニーク font sizes
jq '[.. | .typography?.fontSize? // empty] | unique' layout-pc.json
```
