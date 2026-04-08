# OpenGFX

**Agentic Brand Design System** by AKLO Labs

Generate complete, production-ready brand systems in minutes. OpenGFX thinks like a senior creative director — analyzing brand intent, selecting typography, and generating cohesive visual identity systems.

## Services

### 🎨 Service 1: Brand Foundation
Complete brand system with logo + style guide.

```bash
npm run brand -- "Lumina" "luxury skincare, elegant, iridescent glass feel" --tagline "Illuminate Your Skin"
```

**Output:**
- Logo system (icon, wordmark, stacked, horizontal) — black vectors
- Style guide (colors, typography, render style)
- `brand-system.json` — master manifest

### 📱 Service 2: Socials
Platform-specific avatars & banners for all social media.

```bash
npm run socials -- ./output/lumina/brand-system.json
```

**Output:**
- Rendered avatar (with brand render style applied)
- Platform-specific avatars (Twitter, Instagram, YouTube, TikTok, LinkedIn, Discord, Twitch, GitHub, Telegram)
- Platform-specific banners with tagline

### 🖼️ Service 3: On-Brand GFX
Custom marketing graphics using brand system.

```bash
npm run gfx -- ./output/lumina/brand-system.json \
  "announcement graphic for launch" \
  "NOW LIVE\n\nDiscover the new collection"
```

**Output:**
- Custom graphic matching brand colors, fonts, and render style
- Sized for specified platform or custom dimensions

## Quick Start

```bash
# Install dependencies
npm install

# Set your Gemini API key
export GEMINI_API_KEY="your-key-here"

# Generate complete brand system
npm run brand -- "BrandName" "concept description" --tagline "Optional tagline"

# Generate social media assets
npm run socials -- ./output/brandname/brand-system.json

# Generate custom graphics
npm run gfx -- ./output/brandname/brand-system.json "prompt" "copy text"
```

## Render Styles

| Style | Description |
|-------|-------------|
| `flat` | Solid colors, minimal, clean |
| `gradient` | Smooth color transitions |
| `glass` | Frosted glass, glassmorphism |
| `gavin` | Iridescent glass (Gavin Nelson style) |
| `chrome` | Metallic chrome reflections |
| `gold` | Luxurious gold metallic |
| `silver` | Elegant silver metallic |
| `neon` | Glowing edges, cyberpunk |
| `3d` | Full 3D depth and shadows |
| `holographic` | Rainbow holographic foil |

## Font Library (17 families)

### Sans-Serif
- **Inter** — Swiss precision, #1 UI font
- **Geist** — Vercel-style, tech/developer
- **DM Sans** — Friendly geometric
- **Google Sans Flex** — Product UI (100-900)
- **Space Grotesk** — Tech/crypto headers
- **Plus Jakarta Sans** — Premium SaaS
- **Bebas Neue** — Condensed impact
- **Anton** — Ultra bold
- **Nunito** — Rounded, friendly

### Serif
- **Playfair Display** — Classic luxury
- **Instrument Serif** — Modern editorial
- **Cormorant Garamond** — Refined elegance
- **Source Serif Pro** — Readable body

### Other
- **Roboto Slab** — Bold slab serif
- **Dancing Script** — Elegant cursive
- **Caveat** — Casual handwriting
- **JetBrains Mono** — Developer/code

## Social Platform Dimensions

| Platform | Avatar | Banner |
|----------|--------|--------|
| Twitter/X | 400×400 | 1500×500 |
| Facebook | 320×320 | 851×315 |
| Instagram | 320×320 | — |
| YouTube | 800×800 | 2560×1440 |
| TikTok | 200×200 | — |
| LinkedIn | 400×400 | 1584×396 |
| Discord | 512×512 | 960×540 |
| Twitch | 512×512 | 1200×480 |
| GitHub | 500×500 | — |
| Telegram | 512×512 | — |

## Output Structure

```
output/brandname/
├── brand-system.json       # Master manifest
├── logo/
│   ├── icon.png
│   ├── wordmark.png
│   ├── stacked.png
│   └── horizontal.png
├── style-guide/
│   ├── colors.json
│   ├── typography.json
│   └── render-style.json
├── socials/
│   ├── avatars/
│   │   ├── avatar-master.png
│   │   ├── twitter-profile.png
│   │   └── ...
│   ├── banners/
│   │   ├── twitter-banner.png
│   │   └── ...
│   └── socials-manifest.json
└── gfx/
    └── gfx-*.png
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Service 1: BRAND FOUNDATION                                │
│  Input: Brand name + concept + tagline                      │
│  Output: brand-system.json + logo files + style guide       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Service 2: SOCIALS                                         │
│  Input: brand-system.json                                   │
│  Output: Rendered avatars + banners for all platforms       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Service 3: ON-BRAND GFX (repeatable)                       │
│  Input: brand-system.json + prompt + copy                   │
│  Output: Custom marketing graphic                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **TypeScript** — Type-safe codebase
- **@google/genai** — Gemini API for AI generation
- **sharp** — High-performance image processing
- **canvas** — Node.js canvas for font rendering
- **tsx** — TypeScript execution

## License

MIT — AKLO Labs 2025
