# Social Asset Generator Service

**ACP Offering:** `social`  
**x402 Endpoint:** `/social` (coming soon)

## Overview
Generates rendered social media assets (avatar + banners) in two modes:
1. **From Logo Service** — Uses brand-system.json output
2. **BYOL (Bring Your Own Logo)** — Uses your existing logo

## Input Modes

### Mode 1: From Logo Service
```json
{
  "brandSystemUrl": "https://.../brand-system.json"
}
```

### Mode 2: BYOL (Bring Your Own Logo)
```json
{
  "logoUrl": "https://example.com/logo.png",
  "brandName": "Acme",
  "tagline": "optional tagline",
  "primaryColor": "#FF5500 (optional - auto-extracted)",
  "secondaryColor": "#333333 (optional)",
  "backgroundColor": "#FFFFFF (optional)",
  "renderStyle": "flat|gradient|glass|chrome|gold|neon|3d (optional)"
}
```

## Output
```
output/{brand}/socials/
├── avatars/
│   ├── avatar-master.png    # 1024x1024 rendered icon
│   └── avatar-acp.jpg       # 400x400 JPEG (<50KB) for ACP/Virtuals
└── banners/
    ├── twitter-banner.png   # 3000x1000 (3:1) - Master banner
    ├── og-card.png          # 1200x628 (1.91:1) - Social link previews
    └── community-banner.png # 1200x480 (2.5:1) - Twitter communities
```

## Banner Variants
All banner variants are generated from the master Twitter banner using AI-powered aspect ratio adaptation. This preserves the exact composition (icon, wordmark, colors) while extending the background to fit each format.

## BYOL Mode Details
When using BYOL mode:
1. Logo is downloaded from URL
2. Colors are auto-extracted using AI vision (if not provided)
3. Temporary brand-system.json is created
4. Standard pipeline runs with extracted/provided colors
5. Assets uploaded to R2

## Standard Pipeline
1. **Avatar Generation**
   - Takes icon (from brand-system or BYOL)
   - Applies render style
   - Outputs 1K resolution (1024x1024)
   - Saves style block for banner consistency

2. **Banner Generation**
   - Uses shared style block from avatar
   - Preserves rendered icon exactly
   - Adds wordmark + optional tagline
   - 3:1 ultrawide format (Twitter)

3. **Banner Adaptation**
   - OG card: Extends to 1.91:1 ratio
   - Community: Extends to 2.5:1 ratio

## CLI Usage

### Mode 1: From Brand System
```bash
npm run socials -- ./output/brand/brand-system.json
```

### Mode 2: BYOL
```bash
# AI extracts colors
npm run socials -- --logo https://example.com/logo.png --name "Acme"

# With colors
npm run socials -- --logo https://example.com/logo.png --name "Acme" \
  --primary "#FF5500" --secondary "#333" --style gradient
```

## R2 Delivery
Assets auto-upload to Cloudflare R2:
- Bucket: `opengfx-assets`
- Public URL: `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/{brand}/`
