# NewSphere

**The Lovable of brand building.** AI-powered brand creation and content generation platform.

## Vision

NewSphere unifies brand creation, identity design, and content generation into one seamless agentic experience. Either bring your own brand or start from scratch — we handle everything from naming to motion graphics.

## Core Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                           │
│                                                             │
│     ┌─────────────────┐       ┌─────────────────┐          │
│     │  "I need a      │       │  "I have a      │          │
│     │   brand"        │       │   brand"        │          │
│     └────────┬────────┘       └────────┬────────┘          │
└──────────────┼─────────────────────────┼────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   BRAND CREATION WIZARD  │  │     BRAND IMPORT WIZARD      │
│                          │  │                              │
│  1. Enter concept        │  │  • Upload URL                │
│  2. Generate name ideas  │  │  • Upload PDF                │
│  3. Pick catchphrase     │  │  • Upload images             │
│  4. Lock in brand name   │  │                              │
│  5. Generate logo        │  │  → Parse & detect:           │
│     (icon + wordmark)    │  │    - Colors (exact hex)      │
│  6. Voice/tone quiz      │  │    - Fonts (identify family) │
│  7. Mission/values       │  │    - Logo assets             │
│                          │  │    - Voice/tone patterns     │
└────────────┬─────────────┘  └──────────────┬───────────────┘
             │                               │
             └───────────────┬───────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     BRAND BIBLE                             │
│  (Programmatic Brand Style Guide)                           │
│                                                             │
│  • Logo (icon, wordmark, lockups, usage rules)              │
│  • Colors (primary, secondary, accent, semantic)            │
│  • Typography (headings, body, display)                     │
│  • Voice & Tone (personality, do's & don'ts)                │
│  • Mission, Vision, Values                                  │
│  • Imagery style (photography, illustration, iconography)   │
│  • Motion principles (for video)                            │
│  • Application examples                                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT STUDIO                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   IMAGES    │  │  MASCOTS    │  │   VIDEO     │         │
│  │  (OpenGFX)  │  │  + Poses    │  │  (OpenVID)  │         │
│  │             │  │  + Memes    │  │             │         │
│  │ • Social    │  │  + GIFs     │  │ • Explainer │         │
│  │ • Marketing │  │             │  │ • Social    │         │
│  │ • Announce  │  │             │  │ • Ads       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Backend:** Cloudflare Workers / Pages
- **Database:** D1 (SQLite) or Turso
- **Auth:** Clerk or Auth.js
- **AI:** Claude for reasoning, Gemini for code gen, FLUX/Recraft for images
- **Storage:** R2 for assets
- **Payments:** Stripe

## Brand Bible Schema

See [docs/brand-bible-schema.md](docs/brand-bible-schema.md)

## Engines

- **OpenGFX Engine:** On-brand image generation (stills, mascots, social graphics)
- **OpenVID Engine:** On-brand motion graphics (Remotion-based video generation)

## Deployment

- Domain: newsphere.xyz
- Hosting: Cloudflare Pages
- Edge Functions: Cloudflare Workers

## Status

🚧 In Development

---

*NewSphere — Where brands come to life.*
