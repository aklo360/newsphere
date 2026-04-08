# OpenGFX Self-Improvement Architecture

## The Loop

```
Generate ANY asset → Notice issue/success → Update LEARNINGS.md → ALL future generations improve
```

## How It Works

```
src/learnings/LEARNINGS.md    ← THE BRAIN (edit this file)
         ↓
    loadLearnings()           ← Read at runtime
         ↓
    Injected into prompts     ← Affects ALL generation
```

## The Magic

**Edit `src/learnings/LEARNINGS.md` → change ALL future design outputs.**

That's it. One markdown file. Services load it at runtime and inject into prompts.

## Usage in Services

```typescript
import { loadLearnings, injectLearnings, getLearningsSection } from "../learnings/index.js";

// Option 1: Inject full learnings
const prompt = injectLearnings("Create a logo for...");

// Option 2: Inject specific sections
const prompt = injectLearnings("Create a mascot...", ["MASCOT RULES", "HIGHLIGHTS"]);

// Option 3: Get section for manual use
const mascotRules = getLearningsSection("MASCOT RULES");
```

## File Structure

```
src/learnings/
├── LEARNINGS.md     ← THE BRAIN (edit to improve ALL design)
├── index.ts         ← Loader functions
├── core.ts          ← TypeScript constants (optional, for type safety)
├── logo.ts          ← Logo-specific (optional)
├── social.ts        ← Social-specific (optional)
├── gfx.ts           ← GFX-specific (optional)
└── mascot.ts        ← Mascot-specific (optional)
```

**Primary**: `LEARNINGS.md` — edit this to improve outputs
**Secondary**: `*.ts` files — for structured data when needed

## Self-Improvement Workflow

```
1. GENERATE    → Create any asset
2. REVIEW      → Check output quality  
3. IDENTIFY    → What went wrong/right?
4. EDIT        → Update LEARNINGS.md
5. TEST        → Regenerate to verify
6. COMMIT      → Save with descriptive message
```

## LEARNINGS.md Sections

| Section | Affects |
|---------|---------|
| GEMINI IMAGE GENERATION | All image generation |
| POST-PROCESSING RULES | All post-processing |
| HIGHLIGHTS & GLOSSY | Kawaii/glossy assets |
| ICON & LOGO RULES | Logo service |
| BANNER LAYOUT | Social banners |
| MASCOT RULES | Mascot service |
| RENDER STYLES | Style selection |
| ANTI-PATTERNS | Everything (what NOT to do) |

## Determinism

- Same LEARNINGS.md + same inputs = same outputs
- Changes only happen when you edit the file
- Git tracks all changes for rollback

## Key Insight

OpenGFX is not a static tool. It's a **stateful agent** with:
- **Persistent memory** (LEARNINGS.md, MEMORY.md)
- **Self-modification** (can edit its own learnings)
- **Runtime-loaded rules** (LEARNINGS.md read at generation time)

The learnings ARE OpenGFX's design brain. Edit them → rewire future outputs.
