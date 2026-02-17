# Logo Designer Service

**ACP Offering:** `logo`  
**x402 Endpoint:** `/logo` (coming soon)

## Overview
Generates complete logo systems from brand concept prompts. **Brand name is optional** — AI can generate the perfect name from your concept!

## Input
```json
{
  "concept": "string (required) — brand description, vibe, industry",
  "brandName": "string (optional — AI generates if not provided)",
  "tagline": "string (optional)"
}
```

## AI Brand Naming
When `brandName` is not provided:
1. AI analyzes the concept
2. Generates a memorable, distinctive brand name
3. Provides rationale and alternatives
4. Continues with logo generation using the generated name

### Naming Principles
- Short (1-2 words, ideally 6-10 characters)
- Memorable and easy to spell/pronounce
- Distinctive and scalable
- Avoids obvious trademark conflicts

## Output
```
output/{brand}/
├── logo/
│   ├── icon.png          # Black silhouette (1024x1024)
│   ├── wordmark.png      # Font-rendered brand name
│   ├── stacked.png       # Icon + wordmark vertical (1024x1024 square)
│   └── horizontal.png    # Icon + wordmark side-by-side
├── brand-system.json     # Master manifest (colors, typography, render style)
└── style-guide/          # Brand guidelines
```

## brand-system.json Schema
```json
{
  "brand": {
    "name": "string",
    "tagline": "string",
    "concept": "string"
  },
  "logo": {
    "icon": "path",
    "wordmark": "path",
    "stacked": "path",
    "horizontal": "path"
  },
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "foreground": "#hex"
  },
  "typography": {
    "headerFont": "string",
    "headerWeight": number,
    "bodyFont": "string",
    "bodyWeight": number
  },
  "renderStyle": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic",
    "customPrompt": "string (optional)",
    "parameters": {}
  },
  "mode": "dark|light"
}
```

## Key Constraints
- Icon MUST work in solid black before any render style
- Icon in 1:1 square container with negative space
- Icon complexity: 75% max, recognizable at 32x32px
- Stacked lockup MUST be perfectly square (1024x1024)
- User prompt is source of truth — AI detects style cues

## CLI Usage

### With brand name
```bash
npm run brand -- "BrandName" "concept description" --tagline "optional tagline"
```

### AI generates the name
```bash
npm run brand -- "AI fitness coaching app for busy professionals"
```

## R2 Delivery
Assets auto-upload to Cloudflare R2:
- Bucket: `opengfx-assets`
- Public URL: `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/{brand}/`
