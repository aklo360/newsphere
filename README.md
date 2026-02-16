# OpenGFX

**Agentic Brand Design System** by AKLO Labs

Generate complete, production-ready brand systems in minutes. OpenGFX thinks like a senior creative director — analyzing brand intent, selecting typography, and generating cohesive logo systems.

## Features

- **Creative Director Mode** — AI analyzes your brand brief and makes typography decisions
- **17 Pre-installed Fonts** — Curated library covering all major design styles
- **Smart Font Selection** — Matches brand vibe to appropriate typography
- **Custom AI Wordmarks** — Generates unique wordmarks when nothing stock fits
- **Complete Logo System** — Icon, wordmark, stacked lockup, horizontal lockup

## Quick Start

```bash
# Install dependencies
npm install

# Set your Gemini API key
export GEMINI_API_KEY="your-key-here"

# Generate a logo system
npm run generate -- "BrandName" "brand concept/brief"

# Or directly with tsx
npx tsx src/logo-pipeline.ts "BrandName" "brand concept/brief"
```

## Usage Examples

```bash
# Let AI analyze brand vibe and pick typography:
npm run generate -- "Lumina" "luxury skincare, elegant, refined"
# → Picks Playfair Display (serif/luxury)

npm run generate -- "ByteForge" "developer tools, technical, modern"
# → Picks Geist (tech/developer)

npm run generate -- "VOIDREALM" "electronic music, dark, experimental"
# → Picks Space Grotesk (bold/futuristic)

# Request custom AI-generated wordmark:
npm run generate -- "Nocturn" "avant-garde, needs unique custom wordmark"
# → AI generates custom typography

# Override with specific font:
npm run generate -- "OpenGFX" "design tools" "Google Sans Flex" 600
```

## Font Library

### Sans-Serif (Body/UI)
- **Inter** — Swiss precision, #1 UI font
- **Geist** — Vercel-style, tech/developer
- **DM Sans** — Friendly geometric
- **Google Sans Flex** — Product UI (100-900)
- **Nunito** — Rounded, friendly

### Sans-Serif (Display)
- **Space Grotesk** — Tech/crypto/futuristic
- **Plus Jakarta Sans** — Premium SaaS
- **Bebas Neue** — Condensed impact
- **Anton** — Ultra bold

### Serif
- **Playfair Display** — Classic luxury
- **Instrument Serif** — Modern editorial
- **Cormorant Garamond** — Refined elegance
- **Source Serif Pro** — Readable body

### Slab Serif
- **Roboto Slab** — Bold statements

### Script/Cursive
- **Dancing Script** — Elegant cursive
- **Caveat** — Casual handwriting

### Monospace
- **JetBrains Mono** — Developer/technical

## Output Structure

```
output/brandname/
├── icon.png          # Square icon
├── wordmark.png      # Text only
├── stacked.png       # Icon above wordmark
├── horizontal.png    # Icon + wordmark side by side
└── logo-system.json  # Metadata
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Brand Brief Input                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Brand Analysis (Creative Director AI)          │
│  • Parse explicit font requests                 │
│  • Identify style preferences                   │
│  • Synthesize brand vibe                        │
│  • Recommend: library font OR custom generation │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Typography Decision                            │
│  • Library font → Programmatic rendering        │
│  • Custom → AI-generated wordmark               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Logo System Generation                         │
│  • Icon (Gemini image gen)                      │
│  • Wordmark (font or AI)                        │
│  • Lockups (Sharp compositing)                  │
└─────────────────────────────────────────────────┘
```

## Scripts

```bash
npm run generate   # Run the logo pipeline
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting
npm run clean      # Remove dist/
```

## Requirements

- Node.js 18+
- Gemini API key (`GEMINI_API_KEY`)

## Tech Stack

- **TypeScript** — Type-safe codebase
- **@google/genai** — Gemini API for AI generation
- **sharp** — High-performance image processing
- **canvas** — Node.js canvas for font rendering
- **tsx** — TypeScript execution without compilation

## License

MIT — AKLO Labs 2025
