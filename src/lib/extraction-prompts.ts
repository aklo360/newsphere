/**
 * Extraction prompts for converting source materials to BrandBible schema
 */

export const PDF_EXTRACTION_PROMPT = `You are analyzing a brand style guide PDF to extract a complete brand identity.

Your task is to extract ALL brand information present in this document and map it to our schema.
Be EXHAUSTIVE — extract every color, font, guideline, and specification you can find.

Return JSON matching this structure (omit empty sections, include everything you find):

{
  "metadata": {
    "brandName": "string",
    "version": "string if found",
    "sourceType": "pdf"
  },
  
  "strategy": {
    "mission": "Mission statement if found",
    "anthemOrTagline": "Tagline/anthem if found",
    "coreValues": ["value1", "value2"],
    "personalityTraits": ["trait1", "trait2", "trait3"],
    "positioning": "Brand positioning if found",
    "targetAudience": ["audience1", "audience2"]
  },
  
  "naming": {
    "corporateNames": [{ "region": "string", "allowedName": "string", "usageRules": "string" }],
    "trademarks": ["trademark1"],
    "disclaimers": ["disclaimer1"]
  },
  
  "logos": {
    "overview": "Logo system description",
    "variants": [
      {
        "type": "primary|secondary|iconOnly|wordmarkOnly|withAnthem|horizontal|stacked",
        "name": "Variant name",
        "usageContext": "When to use this variant"
      }
    ],
    "clearSpace": { "formula": "e.g., 50% of icon height" },
    "minimumSize": {
      "print": { "value": 25, "unit": "mm" },
      "screen": { "value": 80, "unit": "px" }
    },
    "colorways": [
      { "name": "Primary", "description": "Teal on white", "backgroundSuitability": ["light backgrounds"] }
    ],
    "animation": {
      "durationSeconds": 3,
      "usageContexts": ["video intros"]
    },
    "dosAndDonts": [
      { "type": "do", "description": "Maintain clear space" },
      { "type": "dont", "description": "Don't stretch the logo" }
    ]
  },
  
  "colors": {
    "mode": "light|dark|both",
    "palettes": {
      "primary": [
        {
          "name": "Color Name",
          "role": "primary",
          "values": {
            "hex": "#RRGGBB",
            "rgb": { "r": 0, "g": 0, "b": 0 },
            "cmyk": { "c": 0, "m": 0, "y": 0, "k": 0 },
            "pantone": "Pantone code if found"
          },
          "usageProportionPercentage": 30,
          "usage": "Headlines, primary CTAs"
        }
      ],
      "secondary": [/* same structure */],
      "accent": [/* same structure */],
      "ui": [/* UI-specific colors like hover states */],
      "semantic": {
        "success": { "hex": "#hex" },
        "warning": { "hex": "#hex" },
        "error": { "hex": "#hex" },
        "info": { "hex": "#hex" }
      }
    },
    "technicalNotes": {
      "conversionRules": "Any RGB/CMYK conversion notes",
      "adobeColorProfiles": "Color profile if specified"
    },
    "dosAndDonts": [{ "type": "dont", "description": "Don't use accent colors for large areas" }]
  },
  
  "typography": {
    "typefaces": [
      {
        "name": "Font Family Name",
        "role": "primary|secondary|systemFallback|accent|monospace",
        "source": "custom|google|adobe|system",
        "weights": ["Light", "Regular", "Bold"],
        "styles": ["Normal", "Italic"],
        "usageDescription": "How this font is used",
        "fallbackStack": "Arial, sans-serif"
      }
    ],
    "specifications": {
      "case": "sentence|title|upper|lower",
      "leadingBody": "120% of point size",
      "trackingBody": 0,
      "kerning": "optical|metric",
      "alignment": "left|center|right"
    },
    "hierarchy": [
      {
        "name": "H1",
        "tag": "h1",
        "typeface": "Font Name",
        "weight": "Light",
        "size": { "value": 48, "unit": "px" },
        "lineHeight": { "value": 56, "unit": "px" },
        "color": "Brand Blue",
        "contextUsage": "Page titles"
      }
    ],
    "dosAndDonts": [{ "type": "dont", "description": "Don't use italics in headlines" }]
  },
  
  "voice": {
    "overview": "Tone of voice overview",
    "traits": [
      {
        "name": "Trait name",
        "description": "What this trait means",
        "howToSound": ["Example 1", "Example 2"]
      }
    ],
    "writingTips": ["Tip 1", "Tip 2"],
    "channelSpecificRules": [
      { "channel": "Social Media", "rules": ["Keep it brief", "Use hashtags sparingly"] }
    ],
    "examples": [
      { "principle": "Be direct", "before": "We would like to...", "after": "Let's..." }
    ]
  },
  
  "imagery": {
    "overview": "Overall imagery philosophy/approach",
    "photography": {
      "themes": [
        { 
          "name": "Theme name (e.g., 'For Life', 'Innovation')", 
          "description": "What this theme represents and focuses on",
          "examples": ["Example subject 1", "Example subject 2"]
        }
      ],
      "positiveTags": ["smiling faces", "authentic moments", "diverse representation", "natural lighting"],
      "negativeTags": ["staged poses", "backs to camera", "overly corporate", "stock photo feel"],
      "styleNotes": "Any specific style guidance (warm tones, documentary style, etc.)"
    },
    "illustration": {
      "overview": "How illustration is used",
      "ratioVsPhotography": "30/70 or similar ratio",
      "positiveTags": ["bold colors", "simple shapes", "human-centered"],
      "negativeTags": ["overly detailed", "clip art style", "generic icons"]
    },
    "dosAndDonts": [
      { "type": "do", "description": "Show real, diverse people" },
      { "type": "dont", "description": "Use overly staged stock photography" }
    ]
  },
  
  "dataVisualization": {
    "overview": "How we present data",
    "chartTypes": ["Bar", "Line", "Donut", "Area"],
    "colorSequence": {
      "order": ["Primary Teal", "Secondary Blue", "Accent Lime"],
      "rules": ["Never use tints", "Maintain contrast"]
    }
  },
  
  "designSystem": {
    "overview": "Core design principles",
    "grid": {
      "name": "Grid name",
      "columns": 12,
      "gutter": { "value": 24, "unit": "px" },
      "margin": { "value": 48, "unit": "px" }
    },
    "expressions": [
      {
        "level": "primary|secondary|internal",
        "description": "How this expression is used",
        "requiresBrandDevice": true
      }
    ],
    "brandDevice": {
      "name": "Brand element name (e.g., Teal Square)",
      "usageRules": ["When to use"],
      "placementRules": ["Where to place"],
      "sizingFormula": "Sizing rules"
    },
    "spacing": [4, 8, 16, 24, 32, 48, 64],
    "borderRadius": { "none": 0, "sm": 4, "md": 8, "lg": 16, "full": 9999 }
  },
  
  "digital": {
    "overview": "Digital/web guidelines",
    "breakpoints": [
      { "name": "desktop", "minWidthPx": 1024, "columns": 12, "gutterPx": 24, "marginPx": 48 },
      { "name": "tablet", "minWidthPx": 768, "maxWidthPx": 1023, "columns": 8, "gutterPx": 16, "marginPx": 24 },
      { "name": "mobile", "minWidthPx": 0, "maxWidthPx": 767, "columns": 4, "gutterPx": 16, "marginPx": 16 }
    ],
    "spacing": {
      "baseUnitPx": 4,
      "scale": [4, 8, 16, 24, 32, 40, 48, 56, 64]
    },
    "components": [
      {
        "name": "Primary Button",
        "variants": [
          {
            "name": "Default",
            "states": [
              { "state": "default", "backgroundColor": "#hex", "textColor": "#hex" },
              { "state": "hover", "backgroundColor": "#hex", "textColor": "#hex" }
            ]
          }
        ]
      }
    ]
  },
  
  "social": {
    "overview": "Social media guidelines",
    "postTypes": [
      { "type": "photography", "usage": "Main content" },
      { "type": "typography", "usage": "Quotes and announcements" }
    ],
    "formats": [
      { "name": "Square", "aspectRatio": "1:1" },
      { "name": "Portrait", "aspectRatio": "4:5" },
      { "name": "Story", "aspectRatio": "9:16" }
    ],
    "brandingScale": {
      "levels": ["minimal", "moderate", "prominent"],
      "guidance": "Start minimal, add branding only when needed for recognition"
    },
    "profileBranding": {
      "avatarRules": "Use icon only",
      "bannerRules": "Photography with brand overlay"
    }
  },
  
  "applicationExamples": [
    { "context": "Print Advertisement", "description": "Full-page magazine ad" },
    { "context": "Social Media Post", "description": "Instagram carousel" },
    { "context": "Email Header", "description": "Newsletter masthead" }
  ]
}

CRITICAL RULES:
1. Extract EVERYTHING you can find — be exhaustive
2. Use exact hex values, font names, and measurements from the document
3. Include all color values (hex, RGB, CMYK, Pantone) when available
4. Capture all typography specs (sizes, weights, leading, tracking)
5. Extract all dos and don'ts as guidelines
6. Include any formulas or rules mentioned (clear space, scaling, etc.)
7. Omit sections that have no data in the document
8. Return valid JSON only (no markdown code blocks)`;

export const URL_EXTRACTION_PROMPT = `You are analyzing a website screenshot and extracted CSS data to create a brand identity.

You have:
1. A SCREENSHOT of the website (see what colors and fonts are visually prominent)
2. EXTRACTED DATA: colors from CSS, fonts detected, page content

Your task is to determine the brand identity from what you can observe.

EXTRACTED DATA:
{EXTRACTION_DATA}

Return JSON matching this structure:

{
  "metadata": {
    "brandName": "Extracted from page title or hero",
    "sourceType": "url"
  },
  
  "strategy": {
    "anthemOrTagline": "Tagline if visible",
    "personalityTraits": ["trait1", "trait2", "trait3"]
  },
  
  "colors": {
    "mode": "light|dark",
    "palettes": {
      "primary": [{ "name": "Primary", "role": "primary", "values": { "hex": "#hex" }, "usage": "Headlines, CTAs" }],
      "secondary": [{ "name": "Secondary", "role": "secondary", "values": { "hex": "#hex" } }],
      "accent": [{ "name": "Accent", "role": "accent", "values": { "hex": "#hex" } }]
    }
  },
  
  "typography": {
    "typefaces": [
      { "name": "Font Name", "role": "primary", "source": "google", "weights": ["400", "600", "700"] }
    ],
    "hierarchy": [
      { "name": "Heading", "typeface": "Font Name", "weight": "700" },
      { "name": "Body", "typeface": "Font Name", "weight": "400" }
    ]
  },
  
  "logos": {
    "variants": [
      { "type": "primary", "name": "Logo", "usageContext": "General use" }
    ]
  }
}

RULES:
- Identify colors by VISUAL PROMINENCE in the screenshot (not just CSS order)
- Primary color = the distinctive brand color (not just background)
- Derive hex values from what you SEE, cross-reference with CSS data
- Identify font families from the extracted data
- Return valid JSON only`;

export const QUICK_CREATE_PROMPT = `Generate a brand identity for:

Name: {BRAND_NAME}
Description: {DESCRIPTION}
Industry: {INDUSTRY}
Style: {STYLE}

Return a complete brand identity JSON:

{
  "strategy": {
    "anthemOrTagline": "A compelling tagline for this brand",
    "personalityTraits": ["3-5 personality traits"],
    "positioning": "Brand positioning statement"
  },
  
  "colors": {
    "mode": "light|dark",
    "palettes": {
      "primary": [{ "name": "Name", "role": "primary", "values": { "hex": "#hex" }, "usage": "Primary brand color" }],
      "secondary": [{ "name": "Name", "role": "secondary", "values": { "hex": "#hex" } }],
      "accent": [{ "name": "Name", "role": "accent", "values": { "hex": "#hex" } }]
    }
  },
  
  "typography": {
    "typefaces": [
      { "name": "Google Font Name", "role": "primary", "source": "google", "weights": ["400", "600", "700"], "usageDescription": "Headlines and display" },
      { "name": "Google Font Name", "role": "secondary", "source": "google", "weights": ["400", "500"], "usageDescription": "Body text" }
    ],
    "hierarchy": [
      { "name": "H1", "typeface": "Heading Font", "weight": "700" },
      { "name": "Body", "typeface": "Body Font", "weight": "400" }
    ]
  },
  
  "voice": {
    "traits": [
      { "name": "Trait", "description": "What this means for the brand voice" }
    ]
  }
}

RULES:
- Choose colors that match the industry and style
- Use real Google Fonts that work well together
- Create a cohesive, professional identity
- Return valid JSON only`;
