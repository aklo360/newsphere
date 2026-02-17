# MEMORY.md - OpenGFX

## Product Intent
- OpenGFX is the AKLO Labs brand/design agent.
- It should output machine-readable brand systems and human deliverables.
- It should interoperate directly with OpenVid for style-consistent video generation.

## Services (LOCKED IN 2025-02-16)

### Service 1: Logo Designer
- **ACP:** `logo` | **x402:** `/logo`
- **Input:** Brand name + concept + optional tagline
- **Output:** Icon, wordmark, stacked, horizontal + brand-system.json
- **Docs:** `services/logo-designer/SERVICE.md`
- **CLI:** `npm run brand -- "Name" "concept" --tagline "text"`

### Service 2: Social Asset Generator  
- **ACP:** `social` | **x402:** `/social`
- **Input:** brand-system.json (+ optional custom banner prompt)
- **Output:** Avatar (1K) + Twitter banner (3:1)
- **Docs:** `services/social-assets/SERVICE.md`
- **CLI:** `npm run socials -- ./output/brand/brand-system.json`

### Service 3: On-Brand GFX (TODO)
- Per-request marketing graphics
- Uses brand-system.json for consistency

## Architecture
- `brand-system.json` is the master manifest that chains all services
- Black logo system first, render style applied to avatars/banners
- User prompt is the bible — AI analyzer detects style cues

## Render Styles
flat, gradient, glass, gavin (iridescent), chrome, gold, silver, neon, 3d, holographic

## GitHub
https://github.com/aklo360/openGFX.git
