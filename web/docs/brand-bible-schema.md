# Brand Bible Schema

The programmatic brand style guide that powers all NewSphere content generation.

## Schema Overview

```typescript
interface BrandBible {
  // Core Identity
  identity: {
    name: string;
    tagline: string;
    mission: string;
    vision: string;
    values: string[];
    positioning: string;
    targetAudience: string[];
    brandPersonality: string[]; // e.g., "Bold", "Friendly", "Innovative"
  };

  // Logo System
  logo: {
    icon: {
      svg: string;
      png: { light: string; dark: string };
      minSize: number; // px
      clearSpace: number; // multiplier of logo height
    };
    wordmark: {
      svg: string;
      png: { light: string; dark: string };
    };
    lockups: {
      horizontal: { svg: string; png: string };
      vertical: { svg: string; png: string };
      stacked: { svg: string; png: string };
    };
    usage: {
      minSize: number;
      clearSpace: string;
      donts: string[]; // e.g., "Don't stretch", "Don't recolor"
    };
  };

  // Color Palette
  colors: {
    primary: ColorDefinition;
    secondary: ColorDefinition;
    accent: ColorDefinition[];
    neutral: {
      white: string;
      black: string;
      grays: string[]; // 50-900 scale
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    gradients?: {
      name: string;
      css: string;
      stops: { color: string; position: number }[];
    }[];
    usage: {
      backgrounds: string[];
      text: string[];
      accents: string[];
    };
  };

  // Typography
  typography: {
    fontFamilies: {
      display: FontDefinition;
      heading: FontDefinition;
      body: FontDefinition;
      mono?: FontDefinition;
    };
    scale: {
      h1: TypeStyle;
      h2: TypeStyle;
      h3: TypeStyle;
      h4: TypeStyle;
      body: TypeStyle;
      bodySmall: TypeStyle;
      caption: TypeStyle;
      button: TypeStyle;
    };
    usage: {
      headingRules: string[];
      bodyRules: string[];
    };
  };

  // Voice & Tone
  voice: {
    personality: string[]; // e.g., "Confident", "Approachable"
    toneAttributes: {
      attribute: string;
      scale: number; // 1-10
    }[]; // e.g., { "Formal vs Casual": 3 }
    writingPrinciples: string[];
    dos: string[];
    donts: string[];
    examplePhrases: {
      scenario: string;
      good: string;
      bad: string;
    }[];
    vocabulary: {
      preferred: string[];
      avoided: string[];
    };
  };

  // Imagery Style
  imagery: {
    photography: {
      style: string; // e.g., "Candid", "Studio", "Lifestyle"
      lighting: string;
      colorTreatment: string;
      subjects: string[];
      donts: string[];
      examples: string[]; // URLs
    };
    illustration: {
      style: string;
      lineWeight: string;
      colorPalette: string; // reference to colors
      examples: string[];
    };
    iconography: {
      style: string; // e.g., "Outlined", "Filled", "Duotone"
      strokeWidth: number;
      cornerRadius: number;
      grid: number; // px
    };
  };

  // Motion Principles (for OpenVID)
  motion: {
    timing: {
      fast: number; // ms
      medium: number;
      slow: number;
    };
    easing: {
      default: string; // CSS easing
      enter: string;
      exit: string;
    };
    principles: string[]; // e.g., "Purposeful", "Smooth"
    transitions: {
      name: string;
      description: string;
      cssOrCode: string;
    }[];
  };

  // Mascot (optional)
  mascot?: {
    name: string;
    description: string;
    personality: string[];
    baseImage: string;
    poses: {
      name: string;
      image: string;
      useCase: string;
    }[];
    expressions: string[];
    styleGuide: string; // How to depict consistently
  };

  // Social Media
  social: {
    handles: Record<string, string>;
    hashtagStrategy: string[];
    postingGuidelines: string[];
    templates: {
      platform: string;
      dimensions: { width: number; height: number };
      safeZones: string;
    }[];
  };

  // Applications & Examples
  applications: {
    businessCards?: string;
    emailSignature?: string;
    socialProfiles?: Record<string, string>;
    presentationTemplate?: string;
    websiteMockup?: string;
  };

  // Metadata
  meta: {
    version: string;
    createdAt: string;
    updatedAt: string;
    generatedBy: 'wizard' | 'import';
    sourceUrl?: string;
    sourcePdf?: string;
  };
}

// Supporting Types
interface ColorDefinition {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  pantone?: string;
  usage: string;
}

interface FontDefinition {
  family: string;
  weights: number[];
  fallback: string[];
  source: 'google' | 'adobe' | 'custom' | 'system';
  url?: string;
}

interface TypeStyle {
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  textTransform?: string;
}
```

## Schema Sections Explained

### 1. Core Identity
The foundational messaging — who you are, what you stand for, who you serve.

### 2. Logo System
Complete logo assets with usage rules. Generated via OpenGFX engine.

### 3. Color Palette
Full color system with semantic meanings, accessibility considerations, and usage guidelines.

### 4. Typography
Font families, type scale, and usage rules. Ensures consistent text hierarchy.

### 5. Voice & Tone
How the brand speaks. Critical for AI-generated copy to sound authentic.

### 6. Imagery Style
Photography, illustration, and iconography guidelines for consistent visuals.

### 7. Motion Principles
Animation timing, easing, and principles for OpenVID-generated content.

### 8. Mascot (Optional)
Character definition with poses and expressions for consistent depiction.

### 9. Social Media
Platform-specific guidelines and templates.

### 10. Applications
Example implementations showing the brand in context.

---

## Import Detection

When importing an existing brand, NewSphere detects:

| Element | Detection Method |
|---------|------------------|
| Colors | Image analysis, CSS extraction, PDF parsing |
| Fonts | Font identification AI (WhatTheFont-style) |
| Logo | Image isolation, SVG extraction |
| Voice | Content analysis of website copy |
| Imagery | Style classification of existing photos |

## Generation Pipeline

```
User Input → Brand Wizard → Brand Bible JSON → Content Engines
                                    │
                                    ├── OpenGFX (stills)
                                    ├── OpenVID (motion)
                                    └── Copy Engine (text)
```
