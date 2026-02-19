# OpenGFX Mascot Service

## Overview
Generate complete mascot character packages from a brand description.

## Endpoints
- **ACP:** `mascot`
- **x402:** `POST /v1/mascot`
- **Price:** $10

## Input
```json
{
  "brandName": "Disclaw",
  "description": "Group chats for AI agents",
  "color": "#5865F2",
  "style": "2d-flat",
  "creature": "crab",
  "personality": "friendly, techy, playful"
}
```

## Output Package
Standard mascot package includes 6 poses:

| Pose | Description |
|------|-------------|
| `master.png` | Default/hero pose - flat, front-facing |
| `wave.png` | Friendly waving gesture |
| `happy.png` | Eyes closed, big smile (^_^) |
| `sad.png` | Droopy eyes, frown, tear drop |
| `unhappy.png` | Annoyed/frustrated expression |
| `laugh.png` | Open mouth laughing |

All outputs: 512x512 PNG, white background

## Style Requirements
- 2D flat illustration with glossy highlights
- Clean vector edges
- Dark outlines
- No legs visible (flat laying pose)
- Kawaii-style face (round eyes with white highlight, small smile)

## Generation Flow
1. Generate master pose from description
2. User approves master
3. Generate remaining 5 poses using master as reference
4. Upload all to CDN
5. Return URLs

## CLI
```bash
npm run mascot -- --name "Brand" --color "#hex" --creature "type" --style "2d-flat"
```
