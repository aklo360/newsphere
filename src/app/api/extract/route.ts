import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const CREATIVE_DIRECTOR_PROMPT = `You are an expert AI Creative Director. You've been given ACTUAL CSS DATA extracted from a website via Puppeteer — real hex colors, real font names, real content.

Your job is to SYNTHESIZE this raw data into a cohesive brand identity, making intelligent creative decisions:
- Which extracted color is THE primary brand color?
- How do the fonts reflect the brand personality?
- What render style matches their aesthetic?

RAW EXTRACTION DATA:
{EXTRACTION_DATA}

ANALYZE AND RETURN JSON (no markdown):
{
  "name": "Brand name (from title or hero)",
  "tagline": "Their tagline if found, or null",
  "concept": "1-2 sentence description of what they do",
  
  "colors": {
    "primary": "#hex - THE brand color (pick the most distinctive)",
    "secondary": "#hex - supporting color",
    "accent": "#hex - highlight/CTA color",
    "background": "#hex - their background",
    "foreground": "#hex - their text color",
    "mode": "light or dark (based on bg color)",
    "reasoning": "Why you chose these colors"
  },
  
  "typography": {
    "heading": "Exact font from extraction (or Google Font match)",
    "headingWeight": 600,
    "body": "Exact font from extraction (or Google Font match)",
    "bodyWeight": 400,
    "reasoning": "Why these fonts fit the brand"
  },
  
  "style": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic",
    "reasoning": "Why this style matches the brand"
  },
  
  "personality": ["trait1", "trait2", "trait3"],
  
  "confidence": {
    "colors": 0.0-1.0,
    "typography": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

RULES:
- USE THE ACTUAL EXTRACTED DATA — don't guess!
- The extracted colors.allColors array contains REAL CSS colors from the site
- The fonts.allFonts array contains REAL font-family values
- If a font isn't a Google Font, find the closest match (Inter, DM Sans, Space Grotesk, etc.)
- Primary color = the most distinctive brand color, NOT necessarily the background`;

async function synthesizeWithCreativeDirector(extractionData: any): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = CREATIVE_DIRECTOR_PROMPT.replace(
    "{EXTRACTION_DATA}",
    JSON.stringify(extractionData, null, 2)
  );

  const result = await model.generateContent([{ text: prompt }]);
  const response = result.response.text();
  
  // Parse JSON
  let jsonStr = response;
  if (response.includes("```json")) {
    jsonStr = response.split("```json")[1].split("```")[0].trim();
  } else if (response.includes("```")) {
    jsonStr = response.split("```")[1].split("```")[0].trim();
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

    // Stage 2: AI Creative Director synthesizes the data
    console.log(`[extract] Running AI Creative Director...`);
    const brandIdentity = await synthesizeWithCreativeDirector(rawData);
    
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
        colors: rawData.colors,
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
