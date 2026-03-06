# NewSphere Design System

## Core Principles

1. **Glassmorphism** — Frosted glass aesthetic with depth
2. **Subtle refinement** — Small, considered details over bold statements
3. **No emojis** — Clean, professional, minimal
4. **Neutral palette** — Soft grays, no saturated colors in UI chrome

---

## Background

```tsx
// WebGL liquid light field
<LiquidBackground />
<div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
```

- Base: `#f0f0f4` (soft icy gray)
- Dynamic Three.js shader creates iridescent movement
- Mouse interaction creates localized displacement

---

## Glass Cards

```tsx
<div className="
  relative p-8 rounded-2xl
  bg-white/50 backdrop-blur-xl
  border border-white/60
  shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
">
  {/* Top highlight line */}
  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
  
  {/* Content */}
</div>
```

### Key Properties
- `bg-white/50` — 50% white, NOT 80%
- `backdrop-blur-xl` — Heavy blur
- `rounded-2xl` — 16px radius, NOT 3xl
- `border-white/60` — Subtle white border
- Complex shadow: outer soft shadows + inner white highlight
- Top gradient line creates glass edge effect

---

## Typography

### Scale
| Element | Size | Weight | Color | Tracking |
|---------|------|--------|-------|----------|
| Page title | `text-[28px]` | `font-semibold` | `text-neutral-400` | `tracking-[0.02em]` |
| Subtitle | `text-[12px]` | `font-normal` | `text-neutral-400/70` | `tracking-[0.15em]` |
| Card heading | `text-sm` (14px) | `font-medium` | `text-neutral-600` | `tracking-wide` |
| Card body | `text-[11px]` | `font-normal` | `text-neutral-400` | — |
| Input text | `text-[13px]` | — | `text-neutral-600` | — |
| Button text | `text-[12px]` | `font-medium` | `text-white` | `tracking-wide` |
| Footer | `text-[10px]` | — | `text-neutral-400/60` | `tracking-wide` |
| Error text | `text-[10px]` | — | `text-red-400` | — |

### Rules
- Use pixel values for fine control: `text-[11px]`, `text-[13px]`
- Headings: `text-neutral-600`
- Body: `text-neutral-400`
- Muted: `text-neutral-400/70` or `text-neutral-400/60`
- NO black text (`text-neutral-800` is too dark)

---

## Inputs

```tsx
<input className="
  w-full h-11 px-4 rounded-xl
  bg-white/60 border border-white/50
  text-[13px] text-neutral-600 placeholder:text-neutral-400
  shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
  focus:outline-none focus:ring-1 focus:ring-neutral-300/50
  transition-all
" />
```

### Key Properties
- Height: `h-11` (44px)
- `bg-white/60` — Slightly more opaque than card
- `rounded-xl` — 12px radius
- Inset shadow for depth
- Subtle focus ring: `ring-neutral-300/50`

---

## Buttons

### Primary Button
```tsx
<button className="
  w-full h-11 rounded-xl
  bg-neutral-500/90 hover:bg-neutral-500
  text-[12px] font-medium text-white tracking-wide
  shadow-[0_2px_8px_rgba(0,0,0,0.1)]
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-200
" />
```

### Key Properties
- `bg-neutral-500/90` — Muted gray, NOT black
- `h-11` matches input height
- `rounded-xl` matches input radius
- Subtle shadow
- Disabled: `opacity-50`

---

## Icons

```tsx
<div className="
  w-10 h-10 rounded-full 
  bg-white/60 border border-white/50 
  flex items-center justify-center
  shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]
">
  <svg className="w-5 h-5 text-neutral-500" strokeWidth={1.5}>
    {/* ... */}
  </svg>
</div>
```

- Icon containers: glass circle with inset highlight
- Icon color: `text-neutral-500`
- Stroke width: `1.5` (not 2)

---

## Animations

### Transitions
- Default: `transition-all duration-200`
- Slower for emphasis: `duration-300`, `duration-500`
- Easing: `ease-out` for exits, default for interactions

### State Changes
```tsx
// Fade + translate pattern
className={`
  transition-all duration-500 ease-out
  ${active 
    ? "opacity-100 translate-y-0" 
    : "opacity-0 translate-y-4 pointer-events-none"}
`}
```

### Staggered Delays
- Use `delay-150`, `delay-200`, `delay-300` for sequenced animations
- Container animates first, children follow

---

## Logo

```tsx
<Image
  src="/logomark.png"
  alt="NewSphere"
  width={80}
  height={80}
  className="mb-4 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]"
  priority
/>
```

- White glow shadow: `drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]`
- Standard size: 80x80 (large), 64x64 (small)

---

## Spacing

- Card padding: `p-8` (32px)
- Element gaps: `space-y-3` (12px) for forms
- Section margin: `mb-6` (24px) for card sections
- Logo margin: `mb-12` (48px)
- Footer margin: `mt-8` (32px)

---

## Loading States

### Spinner
```tsx
<div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
```

### Button Loading
- Show `"..."` or `"Joining..."` — NOT a spinner in buttons

---

## Links

```tsx
<a 
  href="..."
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-neutral-500 transition-colors"
>
```

- Default: inherit color
- Hover: `text-neutral-500`
- NO underlines
- NO color changes that are too dramatic

---

## Forbidden

- ❌ Emojis anywhere in UI
- ❌ `text-neutral-800` or darker (too harsh)
- ❌ `bg-white/80` (too opaque)
- ❌ `rounded-3xl` (too round)
- ❌ Saturated colors (blue, green, purple)
- ❌ Heavy borders (`border-neutral-200`)
- ❌ Large font sizes in cards
- ❌ Bold hover effects (darkening titles)
