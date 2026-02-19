# OpenGFX Design Learnings

This file is loaded at runtime and injected into ALL design generation prompts.
Edit this file → change ALL future outputs.

---

## GEMINI IMAGE GENERATION (CRITICAL)

### Single-Pass Rendering
- Request SQUARE 1:1 directly from Gemini (e.g., "1024x1024")
- NEVER generate wide then resize/pad — creates visible color seams
- Specify exact dimensions in every prompt

### Background Rules  
- NEVER request transparent background — Gemini draws checkered pattern
- ALWAYS request solid colored background with exact hex code
- Format: "Solid flat #C8B4DC lavender background filling the ENTIRE image"

### Prompt Format Template
```
IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (1024x1024)
- Solid flat #[HEX] [colorname] background filling the ENTIRE image
- [Subject] centered in frame, taking up ~70% of the space
```

---

## POST-PROCESSING RULES

### Safe Operations
- Resize (use fit: "cover" for exact dimensions)
- Format conversion (PNG, JPG)
- Quality adjustment

### FORBIDDEN Operations
- White pixel removal/clamping — destroys glossy highlights
- Background replacement — creates seams
- Transparency conversion — Gemini doesn't output real alpha

---

## HIGHLIGHTS & GLOSSY EFFECTS

- Request "WHITE GLOSSY HIGHLIGHTS on eyes and head (1-2 highlights)"
- Highlights are ESSENTIAL for kawaii aesthetic
- NEVER remove white pixels in post-processing
- 1-2 highlights max per character — accent, not dominate

---

## ICON & LOGO RULES

### Complexity
- Target 40-50% complexity — SIMPLE, CLEAN, LUXURY
- Frame fill 60-70% (~15% padding each side)
- THE RULE OF ONE: One interesting visual element, not many
- Must be recognizable at 32x32px
- Think Apple, Stripe, Linear — minimalist tech elegance

### Base Logos
- Grayscale only (BLACK, WHITE, GREY)
- Color/effects applied at render stage only
- Max 3 colors in base logo

---

## BANNER LAYOUT

- Tagline sits DIRECTLY under the WORDMARK
- Tagline left-aligned with wordmark first letter
- NEVER center tagline under full lockup
- Icon-to-text gap: 40-60px
- Wordmark-to-tagline gap: 8-12px

---

## MASCOT RULES

### Creature Anatomy
- BIRDS HAVE BEAKS, NOT MOUTHS
- All bird expressions from beak SHAPE only (open/closed, angled)
- NO separate mouth/smile line under beak

### Eye Consistency (CRITICAL)
- Eye COLOR must be IDENTICAL across ALL poses
- Eye SHAPE can change for expressions (closed for happy, droopy for sad)
- Sparkly/starry eyes ONLY for happy pose
- Standard highlight dots for all other poses
- NEVER change eye color between master and expressions

### Linework Consistency (CRITICAL)
- ALL linework must be the SAME color (typically black)
- Mouth outline = SAME color as body outline
- NEVER use dark blue/purple for mouth when outline is black
- Eyebrows, mouth, details all match the main outline color

### Frame Composition
- 70% frame fill (~15% padding each side)
- Character centered
- SQUARE output (1024x1024)

### Expression Poses (Standard 6)
| Pose | Description |
|------|-------------|
| master | Neutral, friendly default |
| wave | One wing/arm raised waving |
| happy | Eyes closed (^_^), big smile, pink blush |
| sad | Droopy eyes, downturned mouth/beak, single tear |
| angry | V-shaped eyebrows, narrowed eyes, tight frown |
| laugh | Eyes squeezed shut, wide open mouth/beak, tears of joy |

### Generation Flow
1. Generate master first (defines character)
2. Pass master as base64 reference for all expressions
3. Body stays IDENTICAL across poses — only face changes

---

## RENDER STYLES

Available presets:
- flat-solid (programmatic, instant, deterministic)
- flat, gradient, glass, gavin (iridescent)
- chrome, gold, silver, neon, 3d, holographic, cyberpunk

### Style-Specific Rules
- NEON: Only for icons WITHOUT solid fill requirements (no eyes with pupils)
- CYBERPUNK: Use sparingly — only for tech/gaming/night themes
- FLAT-SOLID: Programmatic render, no AI — instant and deterministic

---

## COLOR SPECIFICATION

- Always use hex codes: #C8B4DC
- Always include color name: "lavender"
- Format: "#C8B4DC lavender"

---

## QUALITY KEYWORDS

Add to prompts for better output:
- ULTRA PREMIUM
- 4K quality
- SHARP, CRISP
- professional design

---

## ANTI-PATTERNS (NEVER DO)

- ❌ Request transparent background (Gemini draws checkers)
- ❌ Generate wide then pad to square (creates seams)
- ❌ Remove white pixels (destroys highlights)
- ❌ Draw mouths on birds (birds have beaks)
- ❌ Generate expressions without master reference
- ❌ Center tagline under full lockup
- ❌ Make icons too complex (must work at 32x32)
- ❌ Use neon style on icons with eye pupils
