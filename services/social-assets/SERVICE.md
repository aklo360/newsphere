# Social Asset Generator Service

## Overview
Generates rendered social media assets (avatar + banner) from brand-system.json.

## Input
```json
{
  "brandSystemPath": "path to brand-system.json (required)",
  "customBannerPrompt": "string (optional) — for custom banner layouts"
}
```

## Output
```
output/{brand}/socials/
├── avatars/
│   └── avatar-master.png    # 1024x1024 rendered icon
└── banners/
    └── twitter-banner.png   # 3000x1000 (3:1 aspect ratio)
```

## Standard Pipeline
1. **Avatar Generation**
   - Takes black icon from brand-system.json
   - Applies render style (gavin/glass/etc)
   - Outputs 1K resolution (1024x1024)
   - Saves style block for banner consistency

2. **Banner Generation**
   - Uses shared style block from avatar
   - Preserves rendered icon exactly
   - Adds wordmark + optional tagline
   - 3:1 ultrawide format (Twitter)

## Style Guidelines
- **Background:** White/light with subtle gradient (NOT plain, NOT dark)
- **Icons:** Cyan-teal-blue-green iridescent holographic glass (gavin style)
- **NO purple** — focus on cyan, teal, aqua tones
- **Wordmark:** Glass treatment, but SMALLER than icons (subtle label, not headline)
- **Tagline:** Simple dark grey/black text, NO 3D effects
- **Contrast:** Icon must POP against background at small sizes

## Custom Banner Support
For non-standard banners (like OpenVid pipeline concept):
- Pass custom prompt describing desired layout
- Reference existing banner as style guide
- Only modify specified elements (text style, background)
- Preserve exact icon shapes and positions

## Learnings
- Gemini tends to make wordmarks TOO LARGE — use explicit "much smaller" prompts
- Image-to-image editing works for incremental refinements
- Reference images help maintain cross-brand consistency
- Always verify 3:1 aspect ratio output (Gemini sometimes drifts)

## CLI
```bash
npm run socials -- ./output/brand/brand-system.json
```

## R2 Delivery
Assets auto-upload to Cloudflare R2:
- Bucket: `opengfx-assets`
- Public URL: `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/{brand}/`
