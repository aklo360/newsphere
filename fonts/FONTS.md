# OpenGFX Font Library

All fonts are OFL-licensed (free for commercial use).

## Sans-Serif — Body/UI

| Font | Weights | Use Case |
|------|---------|----------|
| **Inter** | 400, 500, 600, 700 | #1 body font, UI text |
| **Geist** | 400, 500, 600, 700 | Tech/dev brands, Vercel-style |
| **DM Sans** | 400, 500, 700 | Clean geometric, friendly |
| **Google Sans Flex** | 100-900 | Product UI, Google-style |

## Sans-Serif — Display/Headers

| Font | Weights | Use Case |
|------|---------|----------|
| **Space Grotesk** | 400, 500, 600, 700 | Tech/crypto/startup headers |
| **Plus Jakarta Sans** | 400, 500, 600, 700, 800 | SaaS/modern brands |
| **Bebas Neue** | 400 | Impact headlines, condensed |

## Serif — Editorial/Luxury

| Font | Weights | Use Case |
|------|---------|----------|
| **Playfair Display** | 400, 500, 600, 700 | Elegant headers, luxury |
| **Instrument Serif** | 400 | Modern editorial |
| **Source Serif Pro** | 400, 600, 700 | Readable body serif |

## Script/Handwritten

| Font | Weights | Use Case |
|------|---------|----------|
| **Caveat** | 400, 500, 600, 700 | Casual accents, friendly |

## Monospace

| Font | Weights | Use Case |
|------|---------|----------|
| **JetBrains Mono** | 400, 500, 600, 700 | Code, technical |

---

## Usage in Pipeline

```bash
# Use Inter SemiBold for wordmark
node logo-pipeline.js "BrandName" "concept" "Inter" 600

# Use Playfair Display for elegant brand
node logo-pipeline.js "LuxuryBrand" "concept" "Playfair Display" 700

# Use Geist for tech brand
node logo-pipeline.js "TechCo" "concept" "Geist" 500
```

## Font Selection Guide

| Brand Vibe | Recommended Font |
|------------|------------------|
| Tech/SaaS | Inter, Geist, Space Grotesk |
| Startup/Modern | Plus Jakarta Sans, DM Sans |
| Luxury/Editorial | Playfair Display, Instrument Serif |
| Friendly/Casual | Caveat, DM Sans |
| Corporate/Pro | Source Serif Pro, Inter |
| Bold Impact | Bebas Neue, Space Grotesk 700 |
