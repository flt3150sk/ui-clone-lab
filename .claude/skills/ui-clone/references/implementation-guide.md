# Implementation Guide

How to translate extracted `layout.json` data into Next.js + Tailwind CSS code.

## Table of Contents

1. [Analysis Phase](#analysis-phase)
2. [Component Planning](#component-planning)
3. [Building the Page](#building-the-page)
4. [CSS-to-Tailwind Mapping](#css-to-tailwind-mapping)
5. [Handling Special Cases](#handling-special-cases)
6. [Common Patterns](#common-patterns)

---

## Analysis Phase

Before writing any code, study the extracted data:

### 1. Identify Page Sections

Look at the top-level children of the `body` node. Typical structure:
```
body
├── header/nav (usually position: fixed or sticky)
├── main content area
│   ├── hero section
│   ├── feature sections
│   └── ...
├── footer
└── overlays/modals (position: fixed, high z-index)
```

### 2. Identify Layout Patterns

Check `layout.display` for each container:
- **flex** → Most common. Check `flexDirection`, `justifyContent`, `alignItems`, `gap`
- **grid** → Check `gridTemplateColumns`, `gridTemplateRows`, `gap`
- **block** → Default flow, relies on margin for spacing

### 3. Extract the Color Palette

Scan all `colors.backgroundColor` and `colors.color` values. Group similar ones:
```
Backgrounds: rgb(255,255,255), rgb(249,250,251), rgb(17,24,39)
Text:         rgb(17,24,39), rgb(107,114,128), rgb(255,255,255)
Borders:      rgb(229,231,235), rgb(209,213,219)
Accents:      rgb(59,130,246), rgb(239,68,68)
```

### 4. Extract Typography Scale

Collect unique `fontSize` + `fontWeight` combinations:
```
Headings: 48px/700, 36px/700, 24px/600, 20px/600
Body:     16px/400, 14px/400, 14px/500
Small:    12px/400, 12px/500
```

---

## Component Planning

Map the source DOM structure to React components:

### Rules of Thumb

1. **Repeated structures → Component**: If you see 3+ elements with the same tag, classes, and similar children, make it a component
2. **Semantic sections → Component**: Header, Footer, Hero, etc. are natural components
3. **Keep it shallow**: Don't create a component for every div. Only extract when it adds clarity or enables reuse
4. **Mirror the source**: Your component tree should roughly match the source DOM hierarchy

### File Structure

```
src/app/
├── page.tsx              (main page — equivalent of the source URL)
├── layout.tsx            (root layout — fonts, global styles)
└── components/
    ├── Header.tsx
    ├── Hero.tsx
    ├── FeatureCard.tsx
    └── Footer.tsx
```

---

## Building the Page

### Step 1: Set Up Fonts

From the extracted `typography.fontFamily`, identify the primary fonts:
```tsx
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Step 2: Build Outside-In

Start with the outermost container and work inward:

```tsx
// Level 1: Page structure
<div className="min-h-screen">
  <Header />
  <main>
    <HeroSection />
    <FeaturesSection />
  </main>
  <Footer />
</div>

// Level 2: Section structure
function HeroSection() {
  return (
    <section className="px-[24px] py-[80px] max-w-[1200px] mx-auto">
      <h1 className="text-[48px] font-bold leading-[56px]">...</h1>
      <p className="text-[18px] text-[rgb(107,114,128)] mt-[16px]">...</p>
    </section>
  )
}
```

### Step 3: Use Exact Values First

During initial implementation, use Tailwind arbitrary values for exact matching:

```tsx
// Use this first:
<div className="w-[1200px] px-[24px] py-[16px] text-[14px] text-[rgb(51,51,51)]">

// NOT this (yet):
<div className="max-w-7xl px-6 py-4 text-sm text-gray-700">
```

Arbitrary values ensure pixel-perfect match. Swap to semantic classes in Phase 5.

### Step 4: Handle Each Section

For each section, read its extracted data:
1. Container: `rect` for dimensions, `layout` for display/flex/grid properties
2. Children: Their relative positions and sizes
3. Text: Content from `text` field, typography from `typography`
4. Colors: From `colors`

---

## CSS-to-Tailwind Mapping

### Layout

| CSS Property | Value | Tailwind |
|---|---|---|
| display: flex | | `flex` |
| display: grid | | `grid` |
| display: inline-flex | | `inline-flex` |
| flex-direction: column | | `flex-col` |
| flex-direction: row | | `flex-row` (default) |
| flex-wrap: wrap | | `flex-wrap` |
| justify-content: center | | `justify-center` |
| justify-content: space-between | | `justify-between` |
| justify-content: flex-start | | `justify-start` |
| justify-content: flex-end | | `justify-end` |
| align-items: center | | `items-center` |
| align-items: flex-start | | `items-start` |
| align-items: stretch | | `items-stretch` (default) |
| gap: 16px | | `gap-4` or `gap-[16px]` |
| position: relative | | `relative` |
| position: absolute | | `absolute` |
| position: fixed | | `fixed` |
| position: sticky | | `sticky` |
| overflow: hidden | | `overflow-hidden` |
| overflow: auto | | `overflow-auto` |
| z-index: 10 | | `z-10` or `z-[10]` |

### Spacing

| Value | Tailwind | Arbitrary |
|---|---|---|
| 0px | `0` | |
| 4px | `1` | `[4px]` |
| 8px | `2` | `[8px]` |
| 12px | `3` | `[12px]` |
| 16px | `4` | `[16px]` |
| 20px | `5` | `[20px]` |
| 24px | `6` | `[24px]` |
| 32px | `8` | `[32px]` |
| 40px | `10` | `[40px]` |
| 48px | `12` | `[48px]` |
| 64px | `16` | `[64px]` |
| 80px | `20` | `[80px]` |
| 96px | `24` | `[96px]` |

Use with prefix: `p-4`, `px-6`, `mt-8`, `mb-4`, `gap-4`, etc.

### Typography

| CSS | Tailwind | Arbitrary |
|---|---|---|
| font-size: 12px | `text-xs` | `text-[12px]` |
| font-size: 14px | `text-sm` | `text-[14px]` |
| font-size: 16px | `text-base` | `text-[16px]` |
| font-size: 18px | `text-lg` | `text-[18px]` |
| font-size: 20px | `text-xl` | `text-[20px]` |
| font-size: 24px | `text-2xl` | `text-[24px]` |
| font-size: 30px | `text-3xl` | `text-[30px]` |
| font-size: 36px | `text-4xl` | `text-[36px]` |
| font-size: 48px | `text-5xl` | `text-[48px]` |
| font-weight: 400 | `font-normal` | |
| font-weight: 500 | `font-medium` | |
| font-weight: 600 | `font-semibold` | |
| font-weight: 700 | `font-bold` | |
| line-height: 20px | `leading-5` | `leading-[20px]` |
| line-height: 24px | `leading-6` | `leading-[24px]` |
| line-height: 28px | `leading-7` | `leading-[28px]` |
| letter-spacing: -0.01em | | `tracking-[-0.01em]` |
| text-align: center | `text-center` | |

### Colors

Tailwind uses utility classes with `rgb()` arbitrary values:

```
text-[rgb(17,24,39)]          → text color
bg-[rgb(249,250,251)]         → background
border-[rgb(229,231,235)]     → border color
```

### Sizing

| CSS | Tailwind |
|---|---|
| width: 100% | `w-full` |
| width: auto | `w-auto` |
| width: 1200px | `w-[1200px]` |
| max-width: 1280px | `max-w-[1280px]` |
| height: 100vh | `h-screen` |
| height: 64px | `h-[64px]` |
| min-height: 100vh | `min-h-screen` |

### Border & Radius

| CSS | Tailwind |
|---|---|
| border-width: 1px | `border` |
| border-bottom-width: 1px | `border-b` |
| border-radius: 4px | `rounded` or `rounded-[4px]` |
| border-radius: 8px | `rounded-lg` or `rounded-[8px]` |
| border-radius: 9999px | `rounded-full` |

### Box Shadow

```
shadow-sm    → 0 1px 2px rgba(0,0,0,0.05)
shadow       → 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
shadow-md    → 0 4px 6px rgba(0,0,0,0.1)
shadow-lg    → 0 10px 15px rgba(0,0,0,0.1)
shadow-xl    → 0 20px 25px rgba(0,0,0,0.1)
```

For non-standard shadows: `shadow-[0_2px_8px_rgba(0,0,0,0.12)]`

---

## Handling Special Cases

### Images

```tsx
// Option 1: Download to public/ (recommended for important images)
<img src="/images/hero.jpg" alt="Hero" className="w-full h-[400px] object-cover" />

// Option 2: next/image with remote URL
import Image from 'next/image'
<Image src="https://source.com/image.jpg" width={800} height={400} alt="" />

// Option 3: Placeholder with matching dimensions
<div className="w-[800px] h-[400px] bg-[rgb(229,231,235)]" />
```

### SVG Icons

Check the extracted `viewBox` attribute. Either:
- Copy the SVG source from `dom.html`
- Use a matching icon from a library (Heroicons, Lucide)
- Create a placeholder with matching dimensions

### Fixed/Sticky Elements

```tsx
// Fixed header
<header className="fixed top-0 left-0 right-0 z-[50] h-[64px] bg-white">

// Sticky sidebar
<aside className="sticky top-[80px] h-[calc(100vh-80px)]">
```

Ensure the main content has appropriate top padding/margin to account for fixed headers.

### Background Gradients

If `backgroundColor` shows `rgba(0,0,0,0)` but the element is clearly visible, check `dom.html` for:
- CSS gradients (background-image)
- Background images
- Pseudo-elements (::before, ::after)

These aren't captured in computed styles and need manual inspection.

---

## Common Patterns

### Centered Content Container

```tsx
<div className="max-w-[1200px] mx-auto px-[24px]">
  {/* Content */}
</div>
```

### Flex Row with Spacing

```tsx
<div className="flex items-center gap-[16px]">
  <span>Item 1</span>
  <span>Item 2</span>
</div>
```

### Grid Layout

```tsx
<div className="grid grid-cols-3 gap-[24px]">
  <Card />
  <Card />
  <Card />
</div>
```

### Responsive (if source is responsive)

Use breakpoints only after achieving desktop match:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
```

### Button

```tsx
<button className="px-[24px] py-[12px] bg-[rgb(59,130,246)] text-white text-[14px] font-medium rounded-[8px]">
  Click me
</button>
```
