---
name: newsphere-ui
description: NewSphere UI design system. Use when creating, modifying, or reviewing any UI components, pages, or styles in the NewSphere codebase. Enforces glassmorphism aesthetic, typography scale, and forbidden patterns.
---

# NewSphere UI Design System

You are working on NewSphere, a brand creation platform. Follow these design rules strictly.

## Core Principles

1. **Glassmorphism** — Frosted glass aesthetic with depth and blur
2. **Subtle refinement** — Small, considered details over bold statements
3. **No emojis** — Clean, professional, minimal UI (NO EMOJIS EVER)
4. **Neutral palette** — Soft grays only, no saturated colors in UI chrome

---

## Background Layer

```tsx
<LiquidBackground />
<div className="fixed inset-0 -z-20 bg-[#f0f0f4]" />
```

- Base color: `#f0f0f4` (soft icy gray)
- WebGL shader creates iridescent movement
- Always include both elements

---

## Glass Cards

```tsx
<div className="
  relative p-8 rounded-2xl
  bg-white/50 backdrop-blur-xl
  border border-white/60
  shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]
">
  {/* Top highlight line - REQUIRED */}
  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
  
  {/* Content */}
</div>
```

### REQUIRED Properties
- `bg-white/50` — 50% opacity, NOT 80%
- `backdrop-blur-xl` — Heavy blur
- `rounded-2xl` — 16px radius, NOT 3xl
- `border-white/60` — Subtle white border
- Complex shadow with inset highlight
- Top gradient line for glass edge effect

---

## Typography Scale

| Element | Classes |
|---------|---------|
| Page title | `text-[28px] font-semibold tracking-[0.02em] text-neutral-400` |
| Subtitle | `text-[12px] font-normal tracking-[0.15em] text-neutral-400/70` |
| Card heading | `text-sm font-medium tracking-wide text-neutral-600` |
| Card body | `text-[11px] text-neutral-400 leading-relaxed` |
| Input text | `text-[13px] text-neutral-600` |
| Button text | `text-[12px] font-medium tracking-wide text-white` |
| Footer | `text-[10px] tracking-wide text-neutral-400/60` |
| Error text | `text-[10px] text-red-400` |

### Typography Rules
- Use pixel values: `text-[11px]`, `text-[13px]`
- Headings: `text-neutral-600`
- Body: `text-neutral-400`
- Muted: `text-neutral-400/70` or `/60`
- NEVER use `text-neutral-800` (too dark)

---

## Form Inputs

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

- Height: `h-11` (44px)
- `bg-white/60` — Slightly more opaque than card
- `rounded-xl` — 12px radius
- Inset shadow for depth
- Subtle focus ring

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

- `bg-neutral-500/90` — Muted gray, NOT black
- `h-11` matches input height
- `rounded-xl` matches input radius
- Disabled: `opacity-50`

---

## Icon Containers

```tsx
<div className="
  w-10 h-10 rounded-full 
  bg-white/60 border border-white/50 
  flex items-center justify-center
  shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]
">
  <svg className="w-5 h-5 text-neutral-500" strokeWidth={1.5} />
</div>
```

- Glass circle with inset highlight
- Icon color: `text-neutral-500`
- Stroke width: `1.5`

---

## Animations

### State Transitions
```tsx
className={`
  transition-all duration-500 ease-out
  ${active 
    ? "opacity-100 translate-y-0" 
    : "opacity-0 translate-y-4 pointer-events-none"}
`}
```

### Timing
- Default: `duration-200`
- Emphasis: `duration-300`, `duration-500`
- Stagger with: `delay-150`, `delay-200`, `delay-300`

---

## Logo Treatment

```tsx
<Image
  src="/logomark.png"
  alt="NewSphere"
  width={80}
  height={80}
  className="drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]"
  priority
/>
```

- White glow shadow
- Standard: 80x80, Small: 64x64

---

## Spacing

- Card padding: `p-8`
- Form gaps: `space-y-3`
- Section margin: `mb-6`
- Logo margin: `mb-12`
- Footer margin: `mt-8`

---

## Loading Spinner

```tsx
<div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin" />
```

For buttons, use text like `"..."` or `"Joining..."` — NOT spinners.

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

- NO underlines
- Subtle hover only

---

## FORBIDDEN — Never Use These

- ❌ Emojis anywhere in UI
- ❌ `text-neutral-800` or darker
- ❌ `bg-white/80` (too opaque)
- ❌ `rounded-3xl` (too round)
- ❌ Saturated colors (blue, green, purple) in chrome
- ❌ Heavy borders like `border-neutral-200`
- ❌ Large font sizes in cards
- ❌ Bold hover effects that darken text
- ❌ `font-bold` in body text

---

## File References

- Components: `src/components/`
- Pages: `src/app/`
- Background: `src/components/LiquidBackground.tsx`
- Design doc: `DESIGN.md`
