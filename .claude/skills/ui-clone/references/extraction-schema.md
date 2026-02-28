# Extraction Schema

Reference for the `layout.json` structure produced by `scripts/extract-styles.mjs`.

## Root Object

```json
{
  "url": "https://example.com/page",
  "title": "Page Title",
  "viewport": { "width": 1280, "height": 720 },
  "scrollHeight": 4500,
  "extractedAt": "2025-01-01T00:00:00.000Z",
  "tree": { /* Element node */ }
}
```

| Field | Type | Description |
|---|---|---|
| url | string | Final URL after redirects |
| title | string | `document.title` |
| viewport | object | Browser viewport dimensions |
| scrollHeight | number | Total scrollable page height in px |
| extractedAt | string | ISO timestamp of extraction |
| tree | ElementNode | Root element tree (starting from `<body>`) |

## Element Node

Each node represents a visible DOM element.

```json
{
  "tag": "div",
  "id": "hero",
  "classes": ["container", "mx-auto"],
  "selector": "body > div#hero",
  "depth": 1,
  "text": "Welcome to our site",
  "rect": { "x": 0, "y": 64, "width": 1280, "height": 600 },
  "layout": { ... },
  "typography": { ... },
  "colors": { ... },
  "children": [ ... ]
}
```

### Core Fields

| Field | Type | Description |
|---|---|---|
| tag | string | HTML tag name (lowercase) |
| selector | string | Unique CSS selector path from `body` |
| depth | number | Nesting depth (0 = body) |
| rect | Rect | Bounding rectangle from `getBoundingClientRect()` |
| layout | object | Computed layout properties |
| typography | object | Computed typography properties |
| colors | object | Computed color properties |

### Optional Fields

| Field | Type | When present |
|---|---|---|
| id | string | Element has an `id` attribute |
| classes | string[] | Element has CSS classes |
| text | string | Element has direct text content (not from children) |
| children | ElementNode[] | Element has visible child elements |
| src | string | `<img>` elements |
| alt | string | `<img>` elements with alt text |
| naturalWidth | number | `<img>` elements — intrinsic width |
| naturalHeight | number | `<img>` elements — intrinsic height |
| href | string | `<a>` elements |
| viewBox | string | `<svg>` elements |
| inputType | string | `<input>`, `<textarea>`, `<select>` elements |
| placeholder | string | Form elements with placeholder text |
| role | string | Elements with `role="button"` or `<button>` tags |

## Rect Object

```json
{
  "x": 100.5,
  "y": 200,
  "width": 300,
  "height": 48
}
```

Values are rounded to 1 decimal place. Origin is the viewport top-left. For elements below the fold, `y` will be larger than the viewport height.

## Layout Properties

| Property | CSS Equivalent | Example Values |
|---|---|---|
| display | display | `"flex"`, `"block"`, `"grid"`, `"inline-flex"`, `"none"` |
| position | position | `"static"`, `"relative"`, `"absolute"`, `"fixed"`, `"sticky"` |
| boxSizing | box-sizing | `"border-box"`, `"content-box"` |
| marginTop | margin-top | `"0px"`, `"16px"`, `"auto"` |
| marginRight | margin-right | `"0px"`, `"auto"` |
| marginBottom | margin-bottom | `"0px"`, `"24px"` |
| marginLeft | margin-left | `"0px"`, `"auto"` |
| paddingTop | padding-top | `"0px"`, `"16px"` |
| paddingRight | padding-right | `"0px"`, `"24px"` |
| paddingBottom | padding-bottom | `"0px"`, `"16px"` |
| paddingLeft | padding-left | `"0px"`, `"24px"` |
| borderTopWidth | border-top-width | `"0px"`, `"1px"` |
| borderRightWidth | border-right-width | `"0px"`, `"1px"` |
| borderBottomWidth | border-bottom-width | `"0px"`, `"1px"` |
| borderLeftWidth | border-left-width | `"0px"`, `"1px"` |
| borderTopLeftRadius | border-top-left-radius | `"0px"`, `"8px"` |
| borderTopRightRadius | border-top-right-radius | `"0px"`, `"8px"` |
| borderBottomRightRadius | border-bottom-right-radius | `"0px"`, `"8px"` |
| borderBottomLeftRadius | border-bottom-left-radius | `"0px"`, `"8px"` |
| overflow | overflow | `"visible"`, `"hidden"`, `"auto"`, `"scroll"` |
| overflowX | overflow-x | Same as overflow |
| overflowY | overflow-y | Same as overflow |
| flexDirection | flex-direction | `"row"`, `"column"`, `"row-reverse"` |
| flexWrap | flex-wrap | `"nowrap"`, `"wrap"` |
| justifyContent | justify-content | `"flex-start"`, `"center"`, `"space-between"` |
| alignItems | align-items | `"stretch"`, `"center"`, `"flex-start"` |
| alignSelf | align-self | `"auto"`, `"center"`, `"stretch"` |
| flexGrow | flex-grow | `"0"`, `"1"` |
| flexShrink | flex-shrink | `"1"`, `"0"` |
| flexBasis | flex-basis | `"auto"`, `"0px"`, `"50%"` |
| gridTemplateColumns | grid-template-columns | `"1fr 1fr"`, `"repeat(3, 1fr)"` |
| gridTemplateRows | grid-template-rows | `"auto"`, `"1fr 2fr"` |
| gap | gap | `"0px"`, `"16px"` |
| rowGap | row-gap | `"0px"`, `"8px"` |
| columnGap | column-gap | `"0px"`, `"16px"` |
| zIndex | z-index | `"auto"`, `"10"`, `"100"` |

## Typography Properties

| Property | CSS Equivalent | Example Values |
|---|---|---|
| fontFamily | font-family | `"\"Inter\", sans-serif"`, `"system-ui"` |
| fontSize | font-size | `"14px"`, `"16px"`, `"24px"` |
| fontWeight | font-weight | `"400"`, `"600"`, `"700"` |
| fontStyle | font-style | `"normal"`, `"italic"` |
| lineHeight | line-height | `"20px"`, `"24px"`, `"normal"` |
| letterSpacing | letter-spacing | `"normal"`, `"0.05em"`, `"-0.01em"` |
| textAlign | text-align | `"left"`, `"center"`, `"right"` |
| whiteSpace | white-space | `"normal"`, `"nowrap"`, `"pre-wrap"` |
| textDecoration | text-decoration | `"none"`, `"underline"` |
| textTransform | text-transform | `"none"`, `"uppercase"`, `"capitalize"` |

## Color Properties

| Property | CSS Equivalent | Example Values |
|---|---|---|
| color | color | `"rgb(0, 0, 0)"`, `"rgb(255, 255, 255)"` |
| backgroundColor | background-color | `"rgb(255, 255, 255)"`, `"rgba(0, 0, 0, 0)"` |
| borderTopColor | border-top-color | `"rgb(229, 231, 235)"` |
| borderRightColor | border-right-color | Same format |
| borderBottomColor | border-bottom-color | Same format |
| borderLeftColor | border-left-color | Same format |
| boxShadow | box-shadow | `"none"`, `"rgba(0, 0, 0, 0.1) 0px 1px 3px 0px"` |
| opacity | opacity | `"1"`, `"0.5"`, `"0"` |

## Notes

- All color values use the `rgb()` or `rgba()` format as returned by `getComputedStyle()`
- All size values include the unit (typically `px`)
- `rect` values are from `getBoundingClientRect()` and represent the element's visual position in the viewport
- Elements with `display: none` or zero dimensions (without children) are excluded
- `<script>`, `<style>`, `<noscript>`, `<meta>`, `<link>`, `<head>` elements are always excluded
- Maximum extraction depth is 20 levels (configurable in the script)
