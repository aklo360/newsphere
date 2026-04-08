# Mascot Generation Rules (LOCKED 2025-02-19)

## The Golden Rules

### 1. Single-Pass Square Rendering
```
IMAGE FORMAT:
- SQUARE 1:1 aspect ratio (1024x1024)
- Solid flat #[HEX] background filling the ENTIRE image
- Character centered in frame, taking up ~70% of the space
```
**NEVER** generate wide then resize/pad — creates visible seams.

### 2. Solid Background (Never Transparent)
- Gemini draws a **checkered pattern** when you request transparent
- Always specify exact hex color: `"Solid flat #C8B4DC lavender background"`

### 3. Bird Anatomy
```
BIRD ANATOMY:
- Small triangular BEAK only (no mouth line - birds have beaks not mouths)
- Expression from beak SHAPE only
```
Repeat 2-3x in prompt for reinforcement.

### 4. Highlight Preservation
- Request: `"WHITE GLOSSY HIGHLIGHTS on eyes and head (1-2 highlights)"`
- **NEVER** remove white pixels in post-processing
- Highlights are essential for kawaii aesthetic

### 5. Expression Poses
| Pose | Prompt |
|------|--------|
| master | Neutral, friendly. Beak closed, slightly upturned. |
| wave | Friendly wave. One wing raised waving. Beak slightly open. |
| happy | Very happy. Eyes closed (^_^), beak open in joy, pink blush. |
| sad | Sad. Droopy eyes, beak pointing down, single tear. |
| angry | Angry. V-shaped eyebrows, beak closed pointing down. |
| laugh | Laughing. Eyes squeezed, beak wide open, tears of joy. |

### 6. Generation Flow
1. Generate master first (defines the character)
2. Pass master as base64 reference to all expression poses
3. Use `fit: "cover"` resize to ensure exact 1024x1024

## Template Script
See `mascot-template.ts` for the working implementation.

## Anti-Patterns (NEVER DO)
- ❌ Request transparent background
- ❌ Generate wide then pad to square
- ❌ Remove white pixels (destroys highlights)
- ❌ Draw mouths on birds
- ❌ Generate expressions without master reference
