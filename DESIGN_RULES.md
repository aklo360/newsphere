# OpenGFX Design Rules

## 🔴 GOLDEN RULE #1: LEGIBILITY & CONTRAST

**Legibility is the #1 priority in all design decisions.**

- Text MUST be clearly readable against its background
- When in doubt, increase contrast
- A beautiful but unreadable design is a FAILURE

### Brand Mode (Dark vs Light)

Every brand must declare a MODE early in the pipeline:

| Mode | Background | Wordmark | Body Text | Best For |
|------|------------|----------|-----------|----------|
| **DARK** | Dark/black | White/light | White/light grey | Tech, gaming, nightlife, space, luxury, edgy |
| **LIGHT** | White/light | Dark/charcoal | Black/dark grey | Health, wellness, corporate, friendly, approachable |

The mode is detected during style guide analysis and propagated to all assets.

### Contrast Guidelines

| Background | Wordmark/Text |
|------------|---------------|
| Light (white, cream, pastels) | DARK (charcoal, deep teal, near-black) |
| Dark (black, navy, deep purple) | LIGHT (white, cream, light colors) |

### The Squint Test
If you squint and can't read the text, contrast is too low. Fix it.

### Priority Order
1. **Legibility** — Can you read it instantly?
2. **Contrast** — Does text stand out from background?
3. **Hierarchy** — Is the important stuff prominent?
4. **Style** — Does it look good? (only matters if 1-3 pass)

---

## 🟡 RULE #2: ICON COMPLEXITY

**Icons must be the right level of complexity — not too simple, not too complex.**

### Complexity Scale
- **0-25%**: Too simple — basic shapes, single lines (AVOID)
- **25-75%**: Sweet spot — recognizable, detailed but clean (TARGET)
- **75-100%**: Too complex — intricate details that disappear at small sizes (AVOID)

### Target: 75% Max Complexity
- Think Apple SF Symbols — detailed but not cluttered
- Must be recognizable at 32x32 pixels
- Must look beautiful at 1024x1024 pixels
- Should have CHARACTER but remain CLEAN

### Forbidden
- Intricate line work that disappears at small sizes
- Overly detailed textures or patterns
- Too many elements competing for attention

---

## Rule #2: Icon Integrity

- Icons must work in solid BLACK before any render style
- Shape must be recognizable at small sizes (32x32)
- Negative space is essential — don't fill the entire container

---

## Rule #3: Consistency Across Assets

- Avatar and banner must share the same render style
- Wordmark typography must be IDENTICAL across all assets
- Color palette must be consistent

---

## Rule #4: Safe Zones & Margins

- Always leave 15-20% padding on all sides
- Content must never touch edges
- Center compositions when possible

---

## Applied to Banner Generation

The banner prompt includes:
1. GOLDEN RULE reminder at the top
2. Wordmark contrast requirements
3. Squint test instruction
4. Final contrast check before output
