# MEMORY.md - OpenGFX

## CRITICAL DELIVERY RULE (NEVER SKIP)
**EVERY job output MUST include CDN links for all deliverables.**
- User cannot download/view files without public URLs
- After ANY job (logo, socials, gfx): upload to S3 and return CDN links
- NO EXCEPTIONS — this is mandatory for every single job

## Product Intent
- OpenGFX is the AKLO Labs brand/design agent.
- It should output machine-readable brand systems and human deliverables.
- It should interoperate directly with OpenVid for style-consistent video generation.

## Services (LOCKED IN 2025-02-16)

### Service 1: Logo Designer
- **ACP:** `logo` | **x402:** `/logo`
- **Input:** Brand name + concept + optional tagline
- **Output:** Icon, wordmark, stacked, horizontal + brand-system.json
- **Docs:** `services/logo-designer/SERVICE.md`
- **CLI:** `npm run brand -- "Name" "concept" --tagline "text"`

### Service 2: Social Asset Generator  
- **ACP:** `social` | **x402:** `/social`
- **Input:** brand-system.json (+ optional custom banner prompt)
- **Output:** Avatar (1K) + Twitter banner (3:1)
- **Docs:** `services/social-assets/SERVICE.md`
- **CLI:** `npm run socials -- ./output/brand/brand-system.json`

### Service 3: On-Brand GFX (LIVE 2025-02-17)
- **ACP:** `gfx` | **x402:** `/gfx`
- **Price:** $2 per graphic
- **Input:** brand-system.json OR BYOL (logo URL + brand name) + prompt + optional aspect ratio
- **Output:** Single marketing graphic (default 1:1, supports 16:9, 9:16, 4:5, etc.)
- **Docs:** `services/gfx/SERVICE.md`
- **CLI:** `npm run gfx -- --brand-system ./path/brand-system.json --prompt "Launch graphic"`
- **Use Cases:** Announcements, launches, features, milestones, events, quotes, promos, hiring

## Architecture
- `brand-system.json` is the master manifest that chains all services
- **BLACK LOGO SYSTEM FIRST** — render style applied ONLY at socials stage
- User prompt is the bible — AI analyzer detects style cues

## Logo System Rules (CRITICAL — NEVER BREAK)
- **BASE LOGOS MUST BE GRAYSCALE ONLY**
  - MAX 3 colors: BLACK, WHITE, GREY
  - NO colors in icon.png, wordmark.png, stacked.png, horizontal.png
  - Color/effects come ONLY at the socials/render stage
  - This is NON-NEGOTIABLE — violating this breaks the entire pipeline

## Render Styles
**flat-solid** (NEW), flat, gradient, glass, gavin (iridescent), chrome, gold, silver, neon, 3d, holographic, cyberpunk

### flat-solid Style (NEW 2025-02-18)
- Programmatic render (NO AI) - instant, deterministic
- Solid single-color background + flat icon silhouette
- Perfect for Discord/Slack/Notion-style clean branding
- Uses sharp + canvas, bypasses Gemini for avatar + master banner
- Set `renderStyle.preset: "flat-solid"` + `colors.background` + `colors.foreground`

### Cyberpunk Style (NEW 2025-02-17)
- Neon cityscape background with skyscrapers
- Holographic billboards, rain-slicked streets
- Purple/blue/cyan neon palette
- Synthwave/Blade Runner aesthetic
- Use sparingly — perfect for gaming/nightlife/tech-dark brands

## Icon Rendering Rules (CRITICAL)
- **EYES/PUPILS:** If icon has an eye with a pupil/highlight, DO NOT use neon style
  - Neon = outlines only, but pupils need SOLID WHITE FILL (catchlight)
  - For eye icons: use `glass`, `gradient`, or `gavin` instead
  - The white highlight must be a FILL, not an outline
- **NEON:** Only for icons without solid fill requirements

## Banner/Avatar Rules (CRITICAL)
- **CONTRAST:** Icon MUST be BRIGHT (white/cyan/neon) on dark backgrounds
- **MATCHING:** Avatar background should match banner background style
- **QUALITY:** Always prompt with "ULTRA PREMIUM", "4K", "SHARP, CRISP"
- **CYBERPUNK:** Only if user requests OR concept strongly calls for it (tech/gaming/night themes) — NOT default

## Brand Mode (NEW)
- **DARK:** Tech, gaming, space, nightlife, edgy → dark bg, light wordmark w/ render style
- **LIGHT:** Wellness, friendly, corporate → light bg, dark wordmark w/ render style
- Tagline always plain (white for dark, black for light)
- Mode detected in style guide analysis, stored in `brand-system.json`

## Bird Mascot Anatomy (CRITICAL — LOCKED 2025-02-19)
- **BIRDS HAVE BEAKS, NOT MOUTHS**
- All expressions must come from the BEAK shape (open/closed, angled)
- NO separate mouth/smile line under or below the beak
- Happy = beak slightly open, angled up
- Sad = beak closed, angled down
- Laugh = beak wide open
- Angry = beak closed tight, angled down
- This applies to: owls, penguins, parrots, eagles, any bird creature

### Bird Anatomy Prompt Block (copy into prompts)
```
BIRD ANATOMY:
- Small triangular BEAK only (no mouth line - birds have beaks not mouths)
- Expression from beak SHAPE only
```

## Highlight Usage (CRITICAL)
- **SPARINGLY** - only add white glossy highlights when necessary
- 1-2 highlights max per character (e.g., one on head/body)
- Do NOT cover the character with highlights everywhere
- Highlights should accent, not dominate
- Clean, minimal aesthetic > over-decorated
- **NEVER REMOVE IN POST-PROCESSING** — highlights are essential for kawaii aesthetic

## Expression Poses (LOCKED 2025-02-19)

### Standard 6-Pose Set
| Pose | Description |
|------|-------------|
| **master** | Neutral, friendly default |
| **wave** | One wing/arm raised waving, friendly face |
| **happy** | Eyes closed (^_^), big smile/open beak, pink blush |
| **sad** | Droopy eyes, downturned mouth/beak, single tear |
| **angry** | V-shaped eyebrows, narrowed eyes, tight frown/beak |
| **laugh** | Eyes squeezed shut, wide open mouth/beak, tears of joy |

### Pose Generation Rules
- **PASS MASTER AS REFERENCE** — all poses derive from master for consistency
- **WAVE = ACTUAL ACTION** — wing must be raised and waving, not just excited face
- Body proportions stay consistent across all poses
- Only face/expression changes (except wave which has arm movement)

## Mascot Generation Rules (CRITICAL — LOCKED 2025-02-19)

### Single-Pass Rendering (NEVER TWO-STEP)
- **REQUEST SQUARE DIRECTLY** — tell Gemini "SQUARE 1:1 aspect ratio (1024x1024)" in the prompt
- **NEVER** generate wide then resize/pad — this creates visible seams from mismatched background colors
- The entire image should be generated in ONE pass with the final dimensions

### Background Rules
- **SOLID COLORED BACKGROUND** — specify exact hex color in prompt (e.g., "#C8B4DC lavender")
- **NEVER REQUEST TRANSPARENT** — Gemini draws a checkered pattern instead of real alpha
- Background color should complement the mascot (soft pastels work well)

### Frame Composition
- **FRAME FILL: 70%** — mascot takes up ~70% of frame (~15% padding each side)
- Mascot centered in frame
- Specify in prompt: "Owl centered in frame, taking up ~70% of the space"

### Highlight Preservation (CRITICAL)
- **NEVER CLAMP WHITE PIXELS** — white removal destroys glossy highlights
- White highlights (eye catchlights, head shine) are essential for kawaii aesthetic
- If post-processing needed, ONLY resize — no color manipulation

### Prompt Template (LOCKED)
```
IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (1024x1024)
- Solid flat #[HEX] [color name] background filling the ENTIRE image
- [Character] centered in frame, taking up ~70% of the space

DESIGN:
- [Color] body
- [Details...]
- WHITE GLOSSY HIGHLIGHTS on eyes and head (1-2 highlights)
- 2D flat illustration, black outlines
```

## Icon Complexity (UPDATED 2025-02-17)
- **TARGET: 40-50% complexity** — SIMPLE, CLEAN, LUXURY
- **FRAME FILL: 60-70%** — substantial but not cramped (~15% padding each side)
- **THE RULE OF ONE:** One interesting visual element, not many
- Must be recognizable at 32x32px
- Think Apple, Stripe, Linear — minimalist tech elegance
- If combining 3+ concepts, simplify
- Can a child draw it from memory? Should be yes
- SIMPLEX > COMPLEX — always

## Banner Layout Rules (CRITICAL — NEVER BREAK)
- **TAGLINE POSITION:** Tagline/slogan MUST sit directly under the WORDMARK, left-aligned to match the first letter
- **NEVER** center tagline under the full lockup (icon + wordmark) — it looks terrible and unprofessional
- **LOCKUP STRUCTURE:** Icon | Wordmark + Tagline (stacked) — treat wordmark+tagline as one text block
- **SPACING:** Tight gap (8-12px) between wordmark and tagline, larger gap (40-60px) between icon and text block
- **ALIGNMENT:** Tagline X position === Wordmark X position (left edges aligned)
- **This is NON-NEGOTIABLE — banners must be beautifully designed every single time**

## Process Rules
- **FULLY AUTONOMOUS:** ACP pipeline runs end-to-end without human approval
- **REASONING ON:** Use `/reasoning on` for complex design work
- **FRESH SESSIONS:** After 10+ compactions, quality degrades — restart
- **IMAGE MODEL:** ALWAYS use `gemini-3-pro-image-preview` for ALL image generation (defined in `src/ai.ts` as `IMAGE_MODEL`)

## Self-Improvement Architecture (LOCKED 2025-02-19)
See `SELF-IMPROVEMENT.md` for full documentation.

### The Loop
```
Generate ANY asset → Notice issue/success → Update learnings → ALL future generations improve
```

### Learnings Hierarchy
```
src/learnings/
├── index.ts       ← Import from here
├── core.ts        ← UNIVERSAL (Gemini, colors, post-processing)
├── logo.ts        ← Logo rules (icons, wordmarks, lockups)
├── social.ts      ← Social rules (avatars, banners, platforms)
├── gfx.ts         ← GFX rules (composition, BYOL)
└── mascot.ts      ← Mascot rules (creatures, expressions)
```

### Which File to Edit?
| Issue | File |
|-------|------|
| Gemini/format issues | `core.ts` |
| Color/quality issues | `core.ts` |
| Icon/wordmark issues | `logo.ts` |
| Banner/avatar issues | `social.ts` |
| On-brand GFX issues | `gfx.ts` |
| Creature/pose issues | `mascot.ts` |

### Principle
**Edit learnings files to change output, NOT service files.**
Learnings are read at runtime → changes automatically affect ALL future generations.

## CRITICAL: Development Process (NEVER FORGET)
**This Telegram thread with @aklo360 is the DEVELOPMENT ENVIRONMENT for OpenGFX.**
- ALL feedback, corrections, and learnings MUST be embedded into SOURCE CODE (`src/*.ts`)
- MEMORY.md is for MY context only — it does NOT affect production/ACP
- When aklo gives notes → UPDATE THE CODE, not just memory
- The pipeline must EVOLVE and GET BETTER with each iteration
- If a rule isn't in the code, ACP agents won't follow it

## ACP Avatar
- `avatar-acp.jpg` — 400x400, JPEG q85, <50KB
- Generated by sharp.resize() from master, not separate AI call

## Disclaw Brand Package (COMPLETE 2025-02-18)
**Product:** Group Chats for AI Agents
**Style:** Discord blurple (#5865F2), flat-solid mode, Plus Jakarta Sans ExtraBold

### Logo Assets
| Asset | CDN URL |
|-------|---------|
| Icon | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/logo/icon.png |
| Wordmark | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/logo/wordmark.png |

### Social Assets
| Asset | Size | CDN URL |
|-------|------|---------|
| Avatar | 1024x1024 | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/socials/avatar-master.png |
| Twitter Banner | 3000x1000 | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/socials/twitter-banner.png |
| Community Banner | 1200x480 | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/socials/community-banner.png |
| OG Card | 1200x628 | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/disclaw/socials/og-card.png |

### Mascot Poses
Located in `output/disclaw/mascot/POSES-v4/`: happy, sad, angry, laugh, wave

## Social Package (LOCKED 2025-02-17)

### Avatars
| Asset | Size | Format |
|-------|------|--------|
| `avatar-master.png` | 1024x1024 | PNG |
| `avatar-acp.jpg` | 400x400 | JPEG (<50KB) |

### Banners
| Asset | Size | Aspect | Use Case |
|-------|------|--------|----------|
| `twitter-banner.png` | 3000x1000 | 3:1 | Twitter profile banner (MASTER) |
| `og-card.png` | 1200x628 | 1.91:1 | Social link previews (OG meta) |
| `community-banner.png` | 1200x480 | 2.5:1 | Twitter communities |

### Banner Adaptation System
- OG card and community banner are generated from the MASTER Twitter banner
- Uses Gemini image-to-image to EXTEND (not crop) for different aspect ratios
- Preserves icon, wordmark, and composition while adding vertical space
- Always uses master as input to avoid generation loss

## x402 Payment Gateway (NEW 2025-02-17)
Located in `gateway/` — cloned from OpenVid architecture.

### Endpoints
| Endpoint | Service | Price |
|----------|---------|-------|
| `POST /v1/logo` | Logo System | $5 |
| `POST /v1/socials` | Social Assets | $5 |

### Supported Chains
- Base USDC (EIP-3009 transferWithAuthorization)
- Solana SOL (native, Pyth price feed for USD conversion)

### Flow
1. POST request → 402 with payment options
2. Client signs payment, retries with X-Payment header
3. Server returns jobId immediately
4. Client polls `/v1/jobs/:id` for completion
5. Response contains CDN URLs for all assets

### Running
```bash
cd gateway
cp .env.example .env  # Configure wallets
npm run dev           # Development (port 4022)
npm start             # Production
```

## Mascot Service (UNIFIED v3.0 — 2025-02-19)

### CRITICAL LEARNINGS FROM DISCLAW SESSION
1. **Expression-only poses**: Body stays IDENTICAL, only face changes
2. **Wave ≠ raised arm**: Wave means friendly welcoming EXPRESSION, not arm movement
3. **Gemini adds legs when body moves**: Any pose change triggers "real crab" mode
4. **Line weight is #1 priority**: Must be repeated 3x in prompts
5. **Anatomy must be explicit**: Count claws AND legs AND arms
6. **Front-facing view is LOCKED**: Never rotate the character

### Service 4: Mascot Generator
- **ACP:** `opengfx_mascot` | **x402:** `/mascot`
- **Price:** $10
- **Docs:** `services/mascot/SERVICE.md`
- **Source:** `src/services/mascot-unified.ts` (replaces mascot.ts + mascot-v2.ts)
- **CLI:** `npm run mascot` (one unified command)

### CLI Usage
```bash
# Mode 1: Generate from prompt (ONE-SHOT)
npm run mascot -- --name "Disclaw" \
  --prompt "Discord-style crab mascot in blurple" \
  --leg-count 4 --creature crab

# Mode 2: Expression sheet from locked master
npm run mascot -- --name "Disclaw" \
  --master-url "https://cdn.example.com/master.png" \
  --leg-count 4
```

### Expression Definitions (FACE ONLY - BODY NEVER CHANGES)
| Pose | Face Change |
|------|-------------|
| master | Default friendly face |
| wave | Friendly welcoming face (body unchanged!) |
| happy | ^_^ closed eyes, big smile, pink blush |
| sad | Droopy eyes, frown, single tear |
| angry | V eyebrows, narrowed eyes, frown |
| laugh | >o< squeezed eyes, open grin, tears of joy |

### Prompt Architecture
1. LINE WEIGHT block (repeated 3x)
2. ANATOMY LOCK block (exact counts)
3. VIEW LOCK block (front-facing only)
4. Expression-specific prompt
5. Color spec
6. Final verification checklist

### Vision QC Pipeline
- Counts legs, claws using Gemini vision
- Rejects if anatomy wrong
- Max 2 retries before accepting with warning

### Architecture (CLEAN)
```
src/services/mascot.ts      # ONLY service file
src/cli/mascot.ts           # CLI wrapper (npm run mascot)
src/mascot/anatomy.ts       # AnatomySchema, POSE_ANATOMY
gateway/src/server.ts       # x402 endpoint
virtuals-protocol-acp/.../opengfx_mascot/  # ACP offering
```

Old v1/v2 files have been DELETED.

## Nox Brand Package (COMPLETE 2025-02-19)
**Product:** Kawaii owl mascot
**Style:** Purple (#8B5CF6) body, cream belly, lavender (#C8B4DC) background

### Mascot Assets
| Pose | CDN URL |
|------|---------|
| Master | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/master.png |
| Wave | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/wave.png |
| Happy | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/happy.png |
| Sad | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/sad.png |
| Angry | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/angry.png |
| Laugh | https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/nox/mascot/FINAL/laugh.png |

### Key Learnings from Nox Session
1. Request SQUARE 1:1 directly from Gemini (never two-step render)
2. Request SOLID colored background (never transparent — Gemini draws checkers)
3. Bird anatomy: BEAKS NOT MOUTHS
4. Never clamp white pixels (destroys highlights)
5. 70% frame fill
6. Pass master as reference for all expression poses

## GitHub
https://github.com/aklo360/openGFX.git

## External Skill (ClawHub)
- **Repo:** https://github.com/aklo360/opengfx-skill
- **ClawHub:** https://clawhub.com/skills/opengfx
- **Current Version:** 1.4.0 (2025-02-17)
- **Install:** `clawhub install opengfx`

### Version History
| Version | Date | Changes |
|---------|------|---------|
| 1.4.0 | 2025-02-17 | Added On-Brand GFX service ($2/graphic) |
| 1.3.0 | 2025-02-17 | Added x402 direct API integration alongside ACP |
| 1.2.1 | 2025-02-17 | BYOL mode, AI brand naming |
| 1.0.0 | 2025-02-16 | Initial release (ACP only)
