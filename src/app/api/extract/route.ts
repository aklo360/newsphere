import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Opus 4.5 when available, fallback to Gemini
const USE_OPUS = !!process.env.ANTHROPIC_API_KEY;
const anthropic = USE_OPUS ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }) : null;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTOR_URL = process.env.EXTRACTOR_URL || "https://mac-mini.tailb4dd25.ts.net";
const EXTRACTOR_API_KEY = process.env.EXTRACTOR_API_KEY || "";

// ═══════════════════════════════════════════════════════════════════
// MAC MINI PUPPETEER EXTRACTION (real CSS data)
// ═══════════════════════════════════════════════════════════════════

async function extractViaPuppeteer(url: string): Promise<any> {
  const res = await fetch(`${EXTRACTOR_URL}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${EXTRACTOR_API_KEY}`,
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Extraction failed" }));
    throw new Error(err.error || "Extraction failed");
  }

  const { data } = await res.json();
  return data;
}

// ═══════════════════════════════════════════════════════════════════
// AI CREATIVE DIRECTOR (synthesizes raw data into brand identity)
// ═══════════════════════════════════════════════════════════════════

const CREATIVE_DIRECTOR_PROMPT = `You are an expert AI Creative Director analyzing a website's brand identity.

You have THREE sources of information:
1. A SCREENSHOT of the website (attached image) — TRUST THIS MOST
2. DOMINANT COLORS from pixel analysis (colors.dominantColors) — sorted by visual coverage
3. RAW CSS DATA extracted via Puppeteer (colors.allColors, fonts)

Your job is to determine the TRUE BRAND COLORS by analyzing VISUAL DOMINANCE in the screenshot:
- What colors APPEAR MOST on the page? (by visual area coverage)
- What is the PRIMARY brand color? (the distinctive, memorable color — NOT just the background)
- What are SECONDARY colors? (supporting palette)
- What are ACCENT colors? (highlights, CTAs, badges)

RAW CSS EXTRACTION DATA:
{EXTRACTION_DATA}

ANALYZE THE SCREENSHOT and CSS DATA, then return JSON (no markdown):
{
  "name": "Brand name",
  "tagline": "Tagline if found, or null",
  "concept": "1-2 sentence description of what they do",
  
  "colors": {
    "primary": "#hex - THE distinctive brand color (the memorable one, often NOT the background)",
    "secondary": "#hex - major supporting color",
    "accent": "#hex - highlight/CTA color",
    "background": "#hex - page background",
    "foreground": "#hex - main text color",
    "palette": ["#hex", "#hex", "#hex", "#hex", "#hex", "#hex"] - ALL brand colors in order of visual importance,
    "mode": "light or dark",
    "reasoning": "Explain the color hierarchy based on what you SEE in the screenshot"
  },
  
  "typography": {
    "heading": "Font name (from extraction or closest Google Font)",
    "headingWeight": 600,
    "body": "Font name",
    "bodyWeight": 400,
    "reasoning": "How the typography reflects brand personality"
  },
  
  "style": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic",
    "reasoning": "Why this style matches based on visual design"
  },
  
  "personality": ["trait1", "trait2", "trait3"],
  
  "confidence": {
    "colors": 0.0-1.0,
    "typography": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

CRITICAL RULES:
- LOOK AT THE SCREENSHOT to determine visual importance AND actual hex values
- Primary color = the DISTINCTIVE brand color (e.g., Coca-Cola red, Spotify green, Stripe purple)
- Background colors (black/white) are important but often NOT the "primary brand color"
- Order the palette by VISUAL DOMINANCE — what you actually see
- DERIVE HEX VALUES from what you SEE in the screenshot, not just the CSS data
- CSS data may be incomplete or wrong — trust your eyes for the actual rendered colors
- Common brand colors: amber/gold (#F59E0B), purple (#A855F7), blue (#3B82F6), green (#22C55E)
- If fonts aren't Google Fonts, find closest matches`;

async function synthesizeWithCreativeDirector(extractionData: any, screenshot: string): Promise<any> {
  const prompt = CREATIVE_DIRECTOR_PROMPT.replace(
    "{EXTRACTION_DATA}",
    JSON.stringify({
      title: extractionData.title,
      metaDescription: extractionData.metaDescription,
      hero: extractionData.hero,
      fonts: extractionData.fonts,
      colors: extractionData.colors,
      logo: extractionData.logo,
    }, null, 2)
  );

  // Extract base64 data from data URL
  const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, "");

  let responseText: string;

  if (USE_OPUS && anthropic) {
    // Use Claude Opus 4.5 with vision (best quality)
    console.log(`[extract] Using Claude Opus 4.5...`);
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20250220",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });
    
    const textContent = response.content.find(c => c.type === "text");
    responseText = textContent?.type === "text" ? textContent.text : "";
  } else {
    // Fallback to Gemini Flash with vision
    console.log(`[extract] Using Gemini Flash (Opus not configured)...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      },
    ]);
    responseText = result.response.text();
  }
  
  // Parse JSON
  let jsonStr = responseText;
  if (responseText.includes("```json")) {
    jsonStr = responseText.split("```json")[1].split("```")[0].trim();
  } else if (responseText.includes("```")) {
    jsonStr = responseText.split("```")[1].split("```")[0].trim();
  }

  return JSON.parse(jsonStr);
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ENDPOINT
// ═══════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    console.log(`[extract] Starting extraction for ${url}`);

    // Stage 1: Puppeteer extraction (real CSS data from Mac Mini)
    console.log(`[extract] Calling Mac Mini extractor...`);
    const rawData = await extractViaPuppeteer(url);
    
    console.log(`[extract] Got raw data. Fonts: ${rawData.fonts?.allFonts?.join(", ")}`);
    console.log(`[extract] Logo: ${rawData.logo ? "found" : "none"}`);

    // Stage 2: AI Creative Director analyzes screenshot + CSS data
    console.log(`[extract] Running AI Creative Director with vision...`);
    const brandIdentity = await synthesizeWithCreativeDirector(rawData, rawData.screenshot);
    
    console.log(`[extract] Brand: ${brandIdentity.name}, Style: ${brandIdentity.style?.preset}`);

    // Combine AI analysis with raw extraction
    return NextResponse.json({
      // From AI Creative Director
      name: brandIdentity.name,
      tagline: brandIdentity.tagline,
      concept: brandIdentity.concept,
      colors: brandIdentity.colors,
      typography: brandIdentity.typography,
      style: brandIdentity.style,
      personality: brandIdentity.personality,
      confidence: brandIdentity.confidence,
      
      // From Puppeteer extraction
      logo: rawData.logo || null,
      hero: rawData.hero || null,
      
      // Raw data for debugging/advanced use
      _raw: {
        fonts: rawData.fonts,
        colors: {
          ...rawData.colors,
          // Add the AI-determined palette as the primary color source
          allColors: brandIdentity.colors?.palette || rawData.colors?.allColors || [],
        },
        title: rawData.title,
        metaDescription: rawData.metaDescription,
      },
      
      // Source info
      sourceUrl: url,
      sourceType: "url",
      screenshotUrl: rawData.screenshot,
    });

  } catch (error) {
    console.error("[extract] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
