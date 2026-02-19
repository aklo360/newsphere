# OpenGFX Mascot Service — Unified

## Overview
Generate complete brand mascots with expression sheets using ONE input.

**Key Principle:** Body stays IDENTICAL across all poses, only facial expressions change.

## Endpoints
- **ACP:** `opengfx_mascot`
- **x402:** `POST /v1/mascot`
- **Price:** $10

## Two Modes (Same CLI/API)

### Mode 1: Generate from Prompt
Natural language input generates master + expressions.

```bash
npm run mascot -- --name "Disclaw" \
  --prompt "Discord-style crab mascot in blurple, 4 tiny legs" \
  --leg-count 4 --creature crab
```

### Mode 2: Expression Sheet from Locked Master
Generate expressions from user-approved master image.

```bash
npm run mascot -- --name "Disclaw" \
  --master-url "https://cdn.example.com/master.png" \
  --leg-count 4
```

## Output Package

| Pose | Expression |
|------|------------|
| `master.png` | Default friendly face |
| `wave.png` | Friendly welcoming face (body unchanged!) |
| `happy.png` | ^_^ closed eyes, big smile, pink blush |
| `sad.png` | Droopy eyes, frown, single tear |
| `angry.png` | V-shaped eyebrows, narrowed eyes, frown |
| `laugh.png` | >o< squeezed eyes, open grin, tears of joy |

All outputs: 512x512 PNG, white background, CDN URLs

## Critical Rules (Embedded in Prompts)

### 1. Line Weight Consistency (#1 Priority)
- All outlines IDENTICAL thickness
- Repeated 3x in every prompt
- Vision QC verifies

### 2. Anatomy Lock
- Exact counts enforced: claws, legs
- Vision QC counts limbs, rejects if wrong
- Up to 2 retries on QC failure

### 3. Expression-Only Changes
- Body position is LOCKED
- Only facial features change
- Wave = happy face, NOT raised arm

### 4. Prompt Parsing
Mode 1 uses AI to parse natural language:
- Extracts creature type
- Extracts colors from names/hex
- Determines leg count by creature
- Allows explicit overrides via CLI flags

## API Input Schema

```typescript
interface MascotInput {
  // Mode 1: Natural language prompt
  prompt?: string;
  
  // Mode 2: Locked master
  masterUrl?: string;
  masterPath?: string;
  
  // Required
  brandName: string;
  
  // Optional overrides
  creature?: string;       // "crab", "owl", "robot"
  primaryColor?: string;   // "#5865F2"
  outlineColor?: string;   // "black"
  legCount?: number;       // REQUIRED for mode 2
  clawCount?: number;      // Default: 2
  hasAntenna?: boolean;    // Default: false
  
  // Output
  outputDir?: string;
  uploadToCdn?: boolean;   // Default: true
}
```

## x402 Request Body

```json
{
  "brand_name": "Disclaw",
  "concept": "Discord-style crab mascot with 4 tiny legs",
  "character_type": "crab",
  "primary_color": "#5865F2",
  "poses": 4
}
```

Note: `poses` field is repurposed as `leg_count` for mascot endpoint.

## CLI Reference

```bash
# Mode 1: Generate from prompt
npm run mascot -- --name <brand> --prompt "<description>" [options]

# Mode 2: Expression sheet from master
npm run mascot -- --name <brand> --master-url <url> --leg-count <n> [options]

# Options
--creature <type>     Creature type (crab, owl, robot)
--color <hex>         Primary color
--outline <color>     Outline color (default: black)
--claw-count <n>      Number of claws (default: 2)
--leg-count <n>       Number of legs (REQUIRED for mode 2)
--has-antenna         Character has antenna
--output <dir>        Output directory
--no-upload           Skip CDN upload
```

## Architecture

```
src/
  services/
    mascot-unified.ts   # MAIN service (replaces mascot.ts and mascot-v2.ts)
  cli/
    mascot-unified.ts   # CLI interface
  mascot/
    anatomy.ts          # Anatomy schema + pose configs

gateway/
  src/server.ts         # x402 endpoint

virtuals-protocol-acp/
  src/seller/offerings/
    opengfx_mascot/     # ACP offering
```

## Vision QC Pipeline

```
1. Parse input (prompt or master URL)
2. Determine anatomy (from prompt or explicit)
3. Generate/load master
4. For each expression pose:
   a. Generate with expression prompt
   b. Vision QC: count legs, claws, check line weight
   c. If FAIL: regenerate (max 2 retries)
   d. If still FAIL: accept with warning
5. Upload all poses to CDN
6. Return URLs + QC report
```

## Version History
- 3.0.0 (2025-02-19): Unified service replaces v1/v2
- 2.0.0 (2025-02-18): Expression-only pipeline (v2)
- 1.0.0 (2025-02-16): Initial release (body-movement poses)
