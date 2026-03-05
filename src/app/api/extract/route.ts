import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ═══════════════════════════════════════════════════════════════════
// SIGNAL GATHERING (raw data collection)
// ═══════════════════════════════════════════════════════════════════

interface RawSignals {
  screenshot: {
    url: string;
    base64: string;
  };
  metadata: {
    title?: string;
    description?: string;
    logo?: { url: string; type: string };
    image?: { url: string };
  };
  pageContent?: string;
}

async function gatherSignals(url: string): Promise<RawSignals> {
  // 1. Microlink for screenshot + metadata
  const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`;
  const microlinkRes = await fetch(microlinkUrl);
  const microlink = await microlinkRes.json();
  
  if (!microlink.data?.screenshot?.url) {
    throw new Error("Failed to capture screenshot");
  }

  // 2. Fetch screenshot as base64
  const screenshotRes = await fetch(microlink.data.screenshot.url);
  const screenshotBuffer = await screenshotRes.arrayBuffer();
  const screenshotBase64 = Buffer.from(screenshotBuffer).toString("base64");

  // 3. Fetch page content via Jina (clean markdown)
  let pageContent: string | undefined;
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(10_000),
    });
    if (jinaRes.ok) {
      pageContent = (await jinaRes.text()).slice(0, 15_000);
    }
  } catch {}

  return {
    screenshot: {
      url: microlink.data.screenshot.url,
      base64: screenshotBase64,
    },
    metadata: {
      title: microlink.data.title,
      description: microlink.data.description,
      logo: microlink.data.logo ? { url: microlink.data.logo.url, type: microlink.data.logo.type } : undefined,
      image: microlink.data.image ? { url: microlink.data.image.url } : undefined,
    },
    pageContent,
  };
}

// ═══════════════════════════════════════════════════════════════════
// AI CREATIVE DIRECTOR (agentic brand analysis)
// ═══════════════════════════════════════════════════════════════════

const CREATIVE_DIRECTOR_PROMPT = `You are an expert AI Creative Director analyzing a brand's website to extract and synthesize their brand identity.

Your job is NOT just to scrape colors — it's to UNDERSTAND the brand and make intelligent creative decisions:
- What colors REPRESENT this brand (not just what's on the page)?
- What's the brand's personality and voice?
- What fonts match their aesthetic?
- What render style would work for their content?

ANALYSIS FRAMEWORK:

1. BRAND ESSENCE
   - What does this company/product do?
   - What's their value proposition?
   - Who's their target audience?

2. VISUAL IDENTITY
   - Primary brand color (the ONE color people associate with them)
   - Supporting colors (secondary, accent)
   - Color mood: Is it dark/moody? Light/clean? Vibrant/energetic?
   
3. TYPOGRAPHY PERSONALITY
   - Are they technical/developer-focused? → Monospace, geometric sans
   - Luxury/premium? → Serif, elegant sans
   - Friendly/approachable? → Rounded, humanist sans
   - Bold/impactful? → Heavy display fonts
   
4. RENDER STYLE
   Choose the style that MATCHES their brand:
   - flat: Clean, minimal, solid colors (SaaS, corporate)
   - gradient: Modern, vibrant, dynamic (startups, apps)
   - glass: Premium, sophisticated, frosted (fintech, luxury)
   - gavin: Iridescent, artistic, unique (creative, design)
   - chrome: Metallic, futuristic, tech (automotive, gaming)
   - gold: Luxurious, premium, elegant (finance, luxury)
   - silver: Refined, professional, sleek (jewelry, premium)
   - neon: Edgy, cyberpunk, nightlife (gaming, entertainment)
   - 3d: Dimensional, modern, premium (products, tech)
   - holographic: Playful, trendy, unique (fashion, gen-z)

5. PERSONALITY TRAITS
   Pick 2-4 that genuinely fit:
   professional, playful, bold, minimal, luxurious, friendly, innovative,
   traditional, edgy, warm, technical, approachable, sophisticated, casual, authoritative

IMPORTANT RULES:
- Be ACCURATE with colors — extract the ACTUAL hex values you see
- For dark sites with bright accents, the ACCENT is usually the primary brand color
- If you can't determine something with confidence, say so
- Don't invent — if you don't see a tagline, return null

Return ONLY valid JSON (no markdown):
{
  "name": "Brand name (properly capitalized)",
  "tagline": "Their tagline if visible, or null",
  "concept": "1-2 sentence description of what they do",
  
  "colors": {
    "primary": "#hex - THE brand color",
    "secondary": "#hex - supporting color",
    "accent": "#hex - highlight/CTA color",
    "background": "#hex - their background",
    "foreground": "#hex - their text color",
    "mode": "light" or "dark",
    "extracted": ["#hex", ...] - all colors you identified (up to 8)
  },
  
  "typography": {
    "heading": "Font family for headings (Google Font name or best match)",
    "headingWeight": 600,
    "body": "Font family for body text",
    "bodyWeight": 400,
    "reasoning": "Why these fonts match the brand"
  },
  
  "style": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic",
    "reasoning": "Why this style fits the brand"
  },
  
  "personality": ["trait1", "trait2", "trait3"],
  
  "voice": {
    "tone": "How they communicate (e.g., technical but friendly, bold and direct)",
    "vocabulary": ["words", "they", "use"]
  },
  
  "confidence": {
    "colors": 0.0-1.0,
    "typography": 0.0-1.0,
    "overall": 0.0-1.0
  }
}`;

async function analyzeWithCreativeDirector(signals: RawSignals, url: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const contextParts = [
    `Analyzing brand: ${url}`,
    signals.metadata.title ? `Page title: ${signals.metadata.title}` : null,
    signals.metadata.description ? `Meta description: ${signals.metadata.description}` : null,
    signals.pageContent ? `\nPage content:\n${signals.pageContent.slice(0, 8000)}` : null,
  ].filter(Boolean).join("\n");

  const result = await model.generateContent([
    { text: CREATIVE_DIRECTOR_PROMPT },
    { text: `\n\nCONTEXT:\n${contextParts}` },
    {
      inlineData: {
        mimeType: "image/png",
        data: signals.screenshot.base64,
      },
    },
  ]);

  const response = result.response.text();
  
  // Parse JSON from response
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

    console.log(`[extract] Gathering signals from ${url}`);
    
    // Stage 1: Gather raw signals
    const signals = await gatherSignals(url);
    
    console.log(`[extract] Signals gathered. Screenshot: ${signals.screenshot.url.slice(0, 50)}...`);
    console.log(`[extract] Logo from metadata: ${signals.metadata.logo?.url || "none"}`);
    
    // Stage 2: AI Creative Director analyzes signals
    console.log(`[extract] Running AI Creative Director analysis...`);
    const analysis = await analyzeWithCreativeDirector(signals, url);
    
    console.log(`[extract] Analysis complete. Brand: ${analysis.name}, Style: ${analysis.style?.preset}`);

    // Combine AI analysis with gathered metadata
    return NextResponse.json({
      // From AI Creative Director
      name: analysis.name,
      tagline: analysis.tagline,
      concept: analysis.concept,
      colors: analysis.colors,
      typography: analysis.typography,
      style: analysis.style,
      personality: analysis.personality,
      voice: analysis.voice,
      confidence: analysis.confidence,
      
      // From signal gathering (metadata)
      logo: signals.metadata.logo || null,
      ogImage: signals.metadata.image?.url || null,
      
      // Source info
      sourceUrl: url,
      sourceType: "url",
      screenshotUrl: signals.screenshot.url,
    });

  } catch (error) {
    console.error("[extract] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
