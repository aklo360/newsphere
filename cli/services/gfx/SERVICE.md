# Service 3: On-Brand GFX

Generate on-brand marketing graphics from a single prompt. Perfect for daily content, announcements, launches, and campaigns.

## Overview

| Field | Value |
|-------|-------|
| **ACP Offering** | `gfx` |
| **x402 Endpoint** | `POST /v1/gfx` |
| **Price** | $2 per graphic |
| **Default Output** | 1024x1024 (1:1) |
| **Turnaround** | ~30-60 seconds |

## Use Cases

- **Announcements** — "We just launched X"
- **Feature highlights** — "Did you know you can do Y?"
- **Milestones** — "10,000 users!", "1 year anniversary"
- **Events** — "Join us for Z"
- **Quotes** — Founder quotes, testimonials
- **Tips/Education** — "Pro tip: ..."
- **Promotions** — Sales, discounts, limited offers
- **Hiring** — "We're hiring!" posts

## Input Modes

### Mode 1: From Logo Service (Recommended)

Use `brand-system.json` from a previous logo job. Ensures perfect brand consistency.

```json
{
  "brandSystemUrl": "https://pub-xxx.r2.dev/acme/brand-system.json",
  "prompt": "Announcement graphic: We just hit 10,000 users! Celebratory, energetic vibe with confetti.",
  "aspectRatio": "1:1"
}
```

### Mode 2: BYOL (Bring Your Own Logo)

Provide your own logo + brand colors. AI extracts additional colors if needed.

```json
{
  "logoUrl": "https://example.com/my-logo.png",
  "brandName": "Acme",
  "primaryColor": "#FF5500",
  "secondaryColor": "#1A1A1A",
  "prompt": "Launch graphic: Introducing our new mobile app. Modern, clean, tech-forward.",
  "aspectRatio": "1:1"
}
```

## Input Parameters

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `prompt` | ✅ | — | What to generate (be specific about purpose, mood, key text) |
| `brandSystemUrl` | Mode 1 | — | URL to brand-system.json from logo service |
| `logoUrl` | Mode 2 | — | URL to your logo image |
| `brandName` | Mode 2 | — | Brand name (for text placement) |
| `primaryColor` | ❌ | Auto | Primary brand color (hex) |
| `secondaryColor` | ❌ | Auto | Secondary color (hex) |
| `backgroundColor` | ❌ | Auto | Background color (hex) |
| `aspectRatio` | ❌ | `1:1` | Output aspect ratio |
| `includeWordmark` | ❌ | `true` | Include brand wordmark in graphic |
| `includeLogo` | ❌ | `true` | Include logo icon in graphic |

## Supported Aspect Ratios

| Ratio | Pixels | Use Case |
|-------|--------|----------|
| `1:1` | 1024×1024 | Instagram, Twitter, LinkedIn posts |
| `4:5` | 1024×1280 | Instagram feed (portrait) |
| `9:16` | 1024×1820 | Stories, Reels, TikTok |
| `16:9` | 1820×1024 | YouTube thumbnails, Twitter cards |
| `3:2` | 1536×1024 | Blog headers |
| `2:3` | 1024×1536 | Pinterest |

Custom ratios accepted (e.g., `5:4`, `21:9`). Max dimension: 2048px.

## Output

Single PNG file uploaded to CDN.

```json
{
  "jobId": "gfx-abc123",
  "status": "completed",
  "brandName": "Acme",
  "gfx": {
    "url": "https://pub-xxx.r2.dev/acme/gfx/gfx-abc123.png",
    "width": 1024,
    "height": 1024,
    "aspectRatio": "1:1"
  },
  "prompt": "Announcement graphic: We just hit 10,000 users!",
  "generationTimeSeconds": 45
}
```

## Prompt Guidelines

### Be Specific About:

1. **Purpose** — What is this graphic for? (announcement, launch, promo)
2. **Key Text** — What text should appear? (headlines, CTAs)
3. **Mood** — How should it feel? (celebratory, professional, urgent, playful)
4. **Style Hints** — Any visual direction (minimal, bold, illustrated, photo-based)

### Good Prompts:

```
"Announcement: We're launching on Product Hunt tomorrow! 
Headline: 'We're Live on Product Hunt'
CTA: 'Support us →'
Mood: Exciting, startup energy
Style: Clean, tech-forward, orange accents"
```

```
"Feature highlight graphic for our new AI chat feature.
Headline: 'Meet Your AI Assistant'
Subtext: 'Ask anything, get instant answers'
Mood: Friendly, futuristic
Style: Gradient background, floating UI elements"
```

### Avoid:

- Vague prompts: "make something cool"
- No text guidance: AI will guess what to write
- Conflicting directions: "minimal but also very detailed"

## Pipeline

1. **Parse Input** — Validate brand-system.json or BYOL params
2. **Extract Brand** — Load colors, typography, logo assets
3. **Compose Prompt** — Merge user prompt with brand context
4. **Generate** — Gemini Imagen 3 with brand-aligned prompt
5. **Post-Process** — Resize to exact aspect ratio, optimize
6. **Upload** — Push to CDN, return URL

## CLI (Internal)

```bash
npm run gfx -- \
  --brand-system ./output/acme/brand-system.json \
  --prompt "Launch graphic: Our mobile app is live!" \
  --aspect-ratio 1:1
```

## Pricing Rationale

| Service | Price | Rationale |
|---------|-------|-----------|
| Logo System | $5 | Complex, multi-asset, foundational |
| Social Assets | $5 | Multi-format banners + avatars |
| **GFX** | **$2** | Single graphic, fast turnaround, high volume |

$2 is optimized for:
- Daily content creators posting 5-10x/week
- Agencies generating batches for clients
- Repeat purchases building recurring revenue

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `INVALID_BRAND_SYSTEM` | Malformed or unreachable brand-system.json | Check URL, re-run logo service |
| `INVALID_LOGO_URL` | Can't fetch provided logo | Use publicly accessible URL |
| `INVALID_ASPECT_RATIO` | Unrecognized ratio format | Use `W:H` format (e.g., `16:9`) |
| `PROMPT_TOO_VAGUE` | Prompt lacks detail | Add purpose, text, mood |
| `GENERATION_FAILED` | AI generation error | Retry or simplify prompt |
