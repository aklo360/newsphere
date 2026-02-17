# MEMORY.md - OpenGFX

## Product Intent
- OpenGFX is the AKLO Labs brand/design agent.
- It should output machine-readable brand systems and human deliverables.
- It should interoperate directly with OpenVid for style-consistent video generation.

## Services (implemented 2025-02-16)
1. **Brand Foundation** — Logo system + style guide → `brand-system.json`
2. **Socials** — Rendered avatars + banners for all platforms
3. **On-Brand GFX** — Per-request marketing graphics
4. Splash page generator (future)

## Architecture
- `brand-system.json` is the master manifest that chains all services
- Black logo system first, render style applied to avatars/banners
- User prompt is the bible — AI analyzer detects style cues

## Render Styles
flat, gradient, glass, gavin (iridescent), chrome, gold, silver, neon, 3d, holographic

## GitHub
https://github.com/aklo360/openGFX.git
