# Logo Designer Service

## Overview
Generates complete logo systems from brand concept prompts.

## Input
```json
{
  "brandName": "string (required)",
  "concept": "string (required) — brand description, vibe, industry",
  "tagline": "string (optional)"
}
```

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
  }
}
```

## Key Constraints
- Icon MUST work in solid black before any render style
- Icon in 1:1 square container with negative space
- Stacked lockup MUST be perfectly square (1024x1024)
- User prompt is source of truth — AI detects style cues
- Wordmark font: Google Sans Flex SemiBold (600) default

## CLI
```bash
npm run brand -- "BrandName" "concept description" --tagline "optional tagline"
```
