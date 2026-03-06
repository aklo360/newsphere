# NewSphere Brand Schema

Derived from enterprise brand guidelines (Merck) to create a unified schema that scales from startup to enterprise.

## Schema Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         BRAND BIBLE                                │
├────────────────────────────────────────────────────────────────────┤
│ 1. Identity       │ Name, tagline, mission, legal names           │
│ 2. Logo System    │ Primary, secondary, icon, clear space, sizes  │
│ 3. Color System   │ Primary, secondary, accent palettes + usage   │
│ 4. Typography     │ Heading, body, hierarchy, weights, sizes      │
│ 5. Voice & Tone   │ Personality traits, writing guidelines        │
│ 6. Photography    │ Style tiers, cropping, diversity guidelines   │
│ 7. Illustration   │ Hero vs spot, style guidelines                │
│ 8. Design System  │ Grid, spacing, expressions, components        │
│ 9. Applications   │ Web, social, print, digital guidelines        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 1. Identity

```typescript
interface BrandIdentity {
  // Core
  name: string;                    // "Merck"
  tagline?: string;                // "Inventing for Life"
  mission?: string;                // Company mission statement
  
  // Legal/Corporate (enterprise)
  legalNames?: {
    primary: string;               // "Merck & Co., Inc."
    variants: string[];            // ["MSD", "Merck Sharp & Dohme"]
    byRegion?: Record<string, string>;  // { "US": "Merck", "EU": "MSD" }
  };
  
  // Industry/Context
  industry?: string;               // "Pharmaceutical"
  personality: PersonalityTrait[]; // ["inventive", "empathetic", "relentless"]
}
```

---

## 2. Logo System

```typescript
interface LogoSystem {
  // Primary assets
  primary: LogoAsset;              // Horizontal logo
  secondary?: LogoAsset;           // Stacked logo (restricted use)
  icon?: LogoAsset;                // Icon only
  wordmark?: LogoAsset;            // Text only
  
  // Variants
  withTagline?: LogoAsset;         // Logo + anthem
  
  // Specifications
  clearSpace: {
    unit: "x-height" | "pixels" | "percentage";
    value: number;                 // e.g., 1.5 (1.5x the icon height)
  };
  
  minimumSize: {
    print: { width: number; unit: "mm" | "in" };
    digital: { width: number; unit: "px" };
  };
  
  // Color variations
  colorVariants: {
    onLight: string;               // "teal-gray"
    onDark: string;                // "teal-white"  
    onBrand: string;               // "white"
    mono?: string;                 // "black" | "white"
  };
  
  // Placement rules
  placement: {
    preferred: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    alternatives: string[];
  };
  
  // Animation (for digital)
  animation?: {
    allowed: boolean;
    guidelines?: string;
  };
  
  // Don'ts
  restrictions: string[];          // ["Don't stretch", "Don't add effects", etc.]
}

interface LogoAsset {
  url: string;
  formats: ("svg" | "png" | "eps" | "pdf")[];
  variants?: {
    light: string;    // For dark backgrounds
    dark: string;     // For light backgrounds
    color: string;    // Full color
  };
}
```

---

## 3. Color System

```typescript
interface ColorSystem {
  // Mode
  mode: "light" | "dark" | "both";
  
  // Primary Palette (dominant colors)
  primary: {
    colors: BrandColor[];
    proportions?: Record<string, number>;  // { "teal": 30, "white": 30 }
  };
  
  // Secondary Palette (supporting colors)
  secondary: {
    colors: BrandColor[];
    usage: string;                 // "Highlight and complement primary"
  };
  
  // Accent Palette (highlights, CTAs)
  accent: {
    colors: BrandColor[];
    usage: string;                 // "Special emphasis, data viz"
  };
  
  // Functional colors
  semantic?: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // UI-specific
  ui?: {
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  
  // Restrictions
  restrictions: string[];
}

interface BrandColor {
  name: string;                    // "Merck Teal"
  hex: string;                     // "#00857C"
  rgb?: { r: number; g: number; b: number };
  cmyk?: { c: number; m: number; y: number; k: number };
  pantone?: string;                // "3282 C"
  role?: "primary" | "secondary" | "accent" | "background" | "foreground";
  usage?: string;                  // "Headlines, key brand moments"
}
```

---

## 4. Typography System

```typescript
interface TypographySystem {
  // Primary typeface
  primary: {
    family: string;                // "Invention"
    source: "custom" | "google" | "adobe" | "system";
    weights: FontWeight[];
    fallback: string;              // "Arial, sans-serif"
  };
  
  // System/fallback typeface
  system?: {
    family: string;                // "Arial"
    weights: FontWeight[];
  };
  
  // Hierarchy
  hierarchy: {
    h1: TypographyStyle;
    h2: TypographyStyle;
    h3: TypographyStyle;
    h4?: TypographyStyle;
    h5?: TypographyStyle;
    h6?: TypographyStyle;
    body: TypographyStyle;
    bodyLarge?: TypographyStyle;
    bodySmall?: TypographyStyle;
    caption?: TypographyStyle;
    label?: TypographyStyle;
  };
  
  // Special uses
  special?: {
    quote?: TypographyStyle;
    code?: TypographyStyle;
    data?: TypographyStyle;        // For numbers/stats
  };
  
  // Color usage
  colorUsage: {
    onLight: string;               // "Merck Blue"
    onDark: string;                // "White"
    accent?: string;               // "Merck Teal"
  };
  
  // Restrictions
  restrictions: string[];
}

interface FontWeight {
  name: string;                    // "Light"
  weight: number;                  // 300
  usage: string;                   // "Large headlines"
  italic?: boolean;
}

interface TypographyStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: { value: number; unit: "pt" | "px" | "rem" };
  lineHeight: { value: number; unit: "pt" | "px" | "%" };
  letterSpacing?: number;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  color?: string;
}
```

---

## 5. Voice & Tone

```typescript
interface VoiceAndTone {
  // Brand personality
  personality: {
    traits: PersonalityTrait[];    // ["inventive", "empathetic", "relentless"]
    descriptions: Record<string, string>;  // What each trait means
  };
  
  // Tone spectrum
  tone: {
    formal: number;                // 0-100 (0 = casual, 100 = formal)
    playful: number;               // 0-100
    technical: number;             // 0-100
  };
  
  // Writing guidelines
  guidelines: {
    dos: string[];
    donts: string[];
  };
  
  // Platform-specific
  platforms?: {
    social?: string[];
    formal?: string[];
    internal?: string[];
  };
  
  // Examples
  examples?: {
    headlines: string[];
    body: string[];
    social: string[];
  };
}
```

---

## 6. Photography (Enterprise)

```typescript
interface PhotographyGuidelines {
  // Style tiers
  tiers: {
    name: string;                  // "For Life - Global Impact"
    description: string;
    examples?: string[];           // Image URLs
  }[];
  
  // Subjects
  subjects: {
    allowed: string[];             // ["scientists", "patients", "labs"]
    restricted?: string[];
  };
  
  // Treatment
  treatment: {
    colorGrading?: string;
    filters?: string[];
    cropping: CroppingGuidelines;
  };
  
  // Diversity & inclusion
  diversity: {
    required: boolean;
    guidelines: string[];
  };
  
  restrictions: string[];
}
```

---

## 7. Design System (Enterprise)

```typescript
interface DesignSystem {
  // Grid
  grid: {
    columns: number;
    gutter: { value: number; unit: string };
    margin: { value: number; unit: string };
  };
  
  // Spacing scale
  spacing: number[];               // [4, 8, 16, 24, 32, 48, 64]
  
  // Border radius
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  
  // Expressions (layout patterns)
  expressions: {
    primary: DesignExpression;
    secondary: DesignExpression;
  };
  
  // Components
  components?: {
    buttons: ComponentSpec;
    inputs: ComponentSpec;
    cards: ComponentSpec;
    // etc.
  };
  
  // Brand elements
  brandElements?: {
    name: string;                  // "Merck Teal Square"
    usage: string;
    placement: string[];
  }[];
}
```

---

## Simplified Schema (Startups)

For users without a full style guide, we extract/generate a minimal schema:

```typescript
interface SimplifiedBrandBible {
  // Required
  name: string;
  
  // Colors (minimum 2)
  colors: {
    primary: string;               // Hex
    secondary?: string;
    accent?: string;
    background: string;
    foreground: string;
  };
  
  // Typography (minimum 1)
  typography: {
    heading: string;               // Font family
    body: string;
  };
  
  // Logo (optional but recommended)
  logo?: {
    url: string;
    format: string;
  };
  
  // Personality (auto-generated if not provided)
  personality: string[];
  
  // Mode
  mode: "light" | "dark";
}
```

---

## Extraction Sources → Schema Mapping

| Source | Can Extract | Confidence |
|--------|-------------|------------|
| **Full PDF Style Guide** | Everything | 95-100% |
| **Website URL** | Colors, fonts, logo, personality | 60-80% |
| **Logo + Description** | Colors from logo, personality from description | 40-60% |
| **Just a Name** | Generate everything with AI | 20-40% |

---

## PDF Extraction Strategy

For PDF style guides like Merck's:

1. **Text extraction** (pdftotext)
   - Section headers → schema structure
   - Color values (HEX, RGB, CMYK, Pantone)
   - Font names and weights
   - Typography specifications
   
2. **Image extraction** (pdf-image, pdfimages)
   - Logo assets
   - Color swatches
   - Example layouts

3. **Table extraction**
   - Color palettes with proportions
   - Typography hierarchy
   - Spacing scales

4. **AI synthesis**
   - Interpret guidelines text
   - Extract implicit rules
   - Generate missing pieces
