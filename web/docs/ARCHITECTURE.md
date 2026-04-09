# NewSphere Architecture

## Core Concept

**Brand Bible is the master schema. Everything flows from it.**

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   /create                              /import                   │
│   "I need a brand"                     "I have a brand"          │
│                                                                  │
│   Input: Concept prompt                Input: URL / PDF / Images │
│          + optional name                                         │
│                                                                  │
└──────────────────┬────────────────────────────┬─────────────────┘
                   │                            │
                   ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI CREATIVE DIRECTOR                          │
│                                                                  │
│   Makes ALL creative decisions in ONE holistic brief:            │
│   - Brand name (if not provided)                                 │
│   - Tagline                                                      │
│   - Icon concept                                                 │
│   - Color palette                                                │
│   - Typography                                                   │
│   - Voice & tone                                                 │
│   - Render style                                                 │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BRAND BIBLE                                 │
│                   (Master Manifest)                              │
│                                                                  │
│   {                                                              │
│     identity: { name, tagline, mission, personality },           │
│     colors: { primary, secondary, accent, neutral[], semantic }, │
│     typography: { display, heading, body, mono },                │
│     voice: { personality[], tone, vocabulary },                  │
│     logo: { icon, wordmark, stacked, horizontal },               │
│     renderStyle: { preset, parameters },                         │
│   }                                                              │
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT GENERATION                            │
│                  (All consume Brand Bible)                       │
│                                                                  │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│   │ Graphics │   │  Video   │   │   Copy   │   │  Social  │    │
│   │ (OpenGFX)│   │(OpenVID) │   │  (LLM)   │   │  Assets  │    │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### Create Flow
```
1. BASICS        → Name (optional), concept, industry
2. PERSONALITY   → Select traits, vibe
3. GENERATE      → AI Creative Director creates full brief
4. PREVIEW       → Live preview of brand system
5. REFINE        → Adjust colors, fonts, regenerate elements
6. SAVE          → Brand Bible stored, ready for content gen
```

### Import Flow
```
1. INPUT         → URL, PDF upload, or image upload
2. EXTRACT       → 
   - URL: Puppeteer CSS introspection + Gemini analysis
   - PDF: Page rendering + vision analysis
   - Image: Color extraction + logo detection
3. VERIFY        → User reviews extracted brand
4. ENHANCE       → AI fills gaps (missing voice, etc.)
5. SAVE          → Brand Bible stored
```

## Tech Stack

- **Frontend**: Next.js 15 + React + Tailwind + shadcn/ui
- **Backend**: Convex (database + real-time + auth)
- **AI**: 
  - Gemini 2.0 Flash (brand extraction, code gen)
  - Claude (creative direction, copy)
- **Hosting**: Vercel
- **Storage**: Convex file storage + R2 for assets

## Key Files

```
src/
├── app/
│   ├── page.tsx              # Dashboard (brand cards)
│   ├── create/
│   │   └── page.tsx          # Brand creation wizard
│   ├── import/
│   │   └── page.tsx          # Brand import flow
│   ├── brand/[id]/
│   │   └── page.tsx          # Brand detail + content gen
│   └── signin/
│       └── page.tsx          # Auth
├── components/
│   ├── brand/
│   │   ├── BrandPreview.tsx  # Live brand preview
│   │   ├── ColorPalette.tsx  # Color display/picker
│   │   ├── Typography.tsx    # Font preview
│   │   └── LogoPreview.tsx   # Logo variants
│   └── ui/                   # shadcn components
├── lib/
│   ├── types.ts              # Brand Bible schema
│   └── constants.ts          # Fonts, render styles, etc.
convex/
├── schema.ts                 # Database schema
├── brands.ts                 # Brand CRUD
├── auth.ts                   # Auth config
└── ai/
    ├── creative-director.ts  # AI brand generation
    └── brand-extract.ts      # URL/PDF extraction
```

## Brand Bible Schema

See `src/lib/types.ts` for full TypeScript types.

Key principles:
1. **Flat structure** - No deep nesting
2. **Optional everything** - Graceful degradation
3. **Source tracking** - Know where each value came from
4. **Version controlled** - Track changes over time
