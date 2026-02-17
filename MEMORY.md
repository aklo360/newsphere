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

## Gemini API Resolution Learnings (2025-02-16)
- `gemini-2.0-flash-exp-image-generation` max output: ~1024px (no imageConfig support)
- `imageConfig: { imageSize, aspectRatio }` throws 400 error on flash-exp model
- Imagen 4 `generateImages` works on consumer API (1K/2K/4K, aspect ratios)
- Imagen 4 `upscaleImage` is Vertex AI only (not consumer API)
- **Solution**: Use sharp's `lanczos3` kernel + light `sharpen({ sigma: 0.5 })` for high-quality upscaling
- 2-3x upscale looks good; avoid higher factors

## GitHub
https://github.com/aklo360/openGFX.git
