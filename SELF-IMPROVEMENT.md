# OpenGFX Self-Improvement Architecture

## The Loop

```
Generate asset → Notice issue/success → Update learnings → Next generation improves
```

## Key Insight

OpenGFX is not a static tool. It's a **stateful agent** with:
- **Persistent memory** (MEMORY.md, workspace files)
- **Self-modification** (can edit its own config/learnings)
- **Runtime-loaded rules** (learnings files are read at generation time)

## Architecture

```
src/learnings/
├── mascot.ts      ← Mascot generation rules (edit to improve mascots)
├── logo.ts        ← Logo generation rules (future)
├── social.ts      ← Social asset rules (future)
└── gfx.ts         ← On-brand GFX rules (future)

src/services/
├── mascot-v2.ts   ← IMPORTS from learnings/mascot.ts
├── logo.ts        ← Will import from learnings/logo.ts
└── ...
```

## How It Works

1. **Learnings files** contain:
   - Prompt blocks (injectable text)
   - Rules (numeric/boolean configs)
   - Anti-patterns (what NOT to do)
   - Creature-specific rules

2. **Service files** import learnings at runtime:
   ```typescript
   import { buildMascotPrompt, GENERATION_RULES } from "../learnings/mascot.js";
   ```

3. **To improve output**: Edit the learnings file, NOT the service file.

## Determinism vs Improvement

The balance:
- **Deterministic**: Same learnings + same inputs → same outputs
- **Improving**: Updated learnings → better outputs

Learnings are "frozen" at each generation. They only change when we:
1. Notice an issue
2. Explicitly update the learnings file
3. Commit the change

This gives us:
- **Auditability**: Git history shows what changed
- **Rollback**: Can revert to previous learnings
- **Consistency**: Same commit = same outputs

## Example: Mascot Learning

**Before** (issue noticed):
Gemini was drawing checkered backgrounds when we asked for transparent.

**Learning added**:
```typescript
// In src/learnings/mascot.ts
solidBackground: true,  // Never request transparent

ANTI_PATTERNS = [
  "Never request transparent background (Gemini draws checkers)",
];
```

**After**: All future mascots use solid backgrounds.

## The Self-Improvement Workflow

1. **Generate** asset
2. **Review** output
3. **Identify** what went wrong/right
4. **Update** `src/learnings/*.ts`
5. **Test** regeneration
6. **Commit** with descriptive message
7. **Document** in MEMORY.md if significant

## Editing Rules

When updating learnings:
- Add new rules, don't delete working ones
- Be specific (hex codes, exact prompts)
- Include anti-patterns (what breaks things)
- Test before committing

## Files That Define Behavior

| File | Purpose |
|------|---------|
| `SOUL.md` | Personality, voice |
| `MEMORY.md` | Persistent context, decisions |
| `src/learnings/*.ts` | Runtime generation rules |
| `SELF-IMPROVEMENT.md` | This architecture doc |
