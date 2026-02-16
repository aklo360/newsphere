# OpenGFX Plan (Mirrors OpenVid Architecture)

## Profile
- OpenClaw profile: `opengfx`
- State: `~/.openclaw-opengfx`
- Workspace: `~/.openclaw-opengfx/workspace`

## ACP Service Set (v1)
1. `opengfx_logo_system`
2. `opengfx_brand_style_guide`
3. `opengfx_design_materials`

## Canonical Output Contract
- `brand-system.tokens.json` (DTCG-aligned canonical spec)

## Interop Adapters
- `figma.variables.json`
- `tokens-studio.json`
- `web.theme.json`
- `openvid-style-pack.json`

## Next Wiring Work
- Implement OpenGFX generation pipeline
- Hook handlers to real pipeline (replace scaffold executeJob)
- Register offerings on ACP
- Add OpenVid handoff integration
