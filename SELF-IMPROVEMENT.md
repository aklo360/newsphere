# OpenGFX Self-Improvement Architecture

## The Loop

```
Generate ANY asset → Notice issue/success → Update learnings → ALL future generations improve
```

## Key Insight

OpenGFX is not a static tool. It's a **stateful agent** with:
- **Persistent memory** (MEMORY.md, workspace files)
- **Self-modification** (can edit its own learnings)
- **Runtime-loaded rules** (learnings files read at generation time)
- **Universal design intelligence** (learnings apply across all services)

## Architecture

```
src/learnings/
├── index.ts       ← Re-exports everything (import from here)
├── core.ts        ← UNIVERSAL rules (Gemini, colors, quality, post-processing)
├── logo.ts        ← Logo-specific rules (icons, wordmarks, lockups)
├── social.ts      ← Social asset rules (avatars, banners, platforms)
├── gfx.ts         ← On-brand GFX rules (composition, BYOL)
└── mascot.ts      ← Mascot rules (creatures, expressions, anatomy)

src/services/
├── logo.ts        ← IMPORTS from learnings
├── social.ts      ← IMPORTS from learnings  
├── gfx.ts         ← IMPORTS from learnings
└── mascot-v2.ts   ← IMPORTS from learnings
```

## The Learnings Hierarchy

```
┌─────────────────────────────────────────┐
│           core.ts (UNIVERSAL)           │
│  Gemini rules, colors, quality, post-   │
│  processing - applies to EVERYTHING     │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    ▼             ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│logo.ts │  │social.ts │  │ gfx.ts  │  │mascot.ts │
│        │  │          │  │         │  │          │
│ Icons  │  │ Avatars  │  │ On-brand│  │ Creatures│
│Wordmark│  │ Banners  │  │ Graphics│  │ Poses    │
│Lockups │  │ Platforms│  │ BYOL    │  │ Anatomy  │
└────────┘  └──────────┘  └─────────┘  └──────────┘
```

## How It Works

### 1. Universal Rules (core.ts)
Rules that apply to ALL design generation:
- Gemini behavior (no transparent, single-pass, solid bg)
- Color specifications (always hex + name)
- Quality keywords
- Post-processing rules (never clamp white)

### 2. Service-Specific Rules
Each service has its own learnings file:
- `logo.ts` - Icon complexity, wordmark rules, banner layout
- `social.ts` - Avatar sizes, banner adaptation, platform rules
- `gfx.ts` - Composition, style consistency, BYOL mode
- `mascot.ts` - Creature anatomy, expressions, poses

### 3. Runtime Import
Services import learnings at runtime:
```typescript
import { 
  GEMINI_RULES,           // From core.ts
  LOGO_RULES,             // From logo.ts
  buildMascotPrompt,      // From mascot.ts
} from "../learnings/index.js";
```

## Determinism vs Improvement

| Concern | Solution |
|---------|----------|
| Same inputs = same outputs? | ✅ Yes, within same learnings version |
| Can we improve? | ✅ Yes, by updating learnings files |
| Auditability? | ✅ Git history tracks all changes |
| Rollback? | ✅ Revert to previous commit |

**Key**: Learnings are "frozen" at each generation. They only change when we:
1. Notice an issue
2. Explicitly update the learnings file
3. Commit the change

## Self-Improvement Workflow

```
1. GENERATE    → Create any asset (logo, social, gfx, mascot)
2. REVIEW      → Check output quality
3. IDENTIFY    → What went wrong/right?
4. CATEGORIZE  → Is this universal (core.ts) or service-specific?
5. UPDATE      → Edit the appropriate learnings file
6. TEST        → Regenerate to verify fix
7. COMMIT      → Save with descriptive message
8. DOCUMENT    → Add to MEMORY.md if significant
```

## Which File to Edit?

| Issue | File to Edit |
|-------|--------------|
| Gemini generating wrong format | `core.ts` |
| Colors looking wrong | `core.ts` |
| Post-processing breaking output | `core.ts` |
| Icon too complex | `logo.ts` |
| Banner layout wrong | `logo.ts` / `social.ts` |
| Avatar sizing issues | `social.ts` |
| Platform-specific problems | `social.ts` |
| GFX composition issues | `gfx.ts` |
| BYOL not working | `gfx.ts` |
| Creature anatomy wrong | `mascot.ts` |
| Expression not matching | `mascot.ts` |

## Example: Universal Learning

**Issue noticed**: Gemini draws checkered pattern for transparent.

**File to edit**: `core.ts` (affects ALL services)

```typescript
// In src/learnings/core.ts
export const GEMINI_RULES = {
  neverRequestTransparent: true,  // ← Added this
};

export const GEMINI_ANTI_PATTERNS = [
  "Never request transparent background → Gemini draws checkered pattern",
];
```

**Result**: ALL services now avoid requesting transparent backgrounds.

## Example: Service-Specific Learning

**Issue noticed**: Bird mascots getting mouths instead of beaks.

**File to edit**: `mascot.ts` (only affects mascots)

```typescript
// In src/learnings/mascot.ts
export const CREATURE_RULES = {
  bird: [
    "BEAK only, no mouth line",
    "Expression from beak shape",
  ],
};
```

**Result**: Only mascot generation changes, other services unaffected.

## Files That Define Behavior

| File | Scope | Purpose |
|------|-------|---------|
| `SOUL.md` | Agent | Personality, voice |
| `MEMORY.md` | Agent | Persistent context |
| `src/learnings/core.ts` | All Services | Universal Gemini/design rules |
| `src/learnings/logo.ts` | Logo Service | Logo-specific rules |
| `src/learnings/social.ts` | Social Service | Social asset rules |
| `src/learnings/gfx.ts` | GFX Service | On-brand graphic rules |
| `src/learnings/mascot.ts` | Mascot Service | Mascot/creature rules |

## The Magic

**Edit ANY learnings file → change ALL future generations that use those rules.**

The learnings ARE OpenGFX's design brain. When we edit them, we're literally rewiring how future designs are generated.
