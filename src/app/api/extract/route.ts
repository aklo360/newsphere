import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ═══════════════════════════════════════════════════════════════════
// LOGO FINDER (from OpenGFX)
// ═══════════════════════════════════════════════════════════════════

async function findLogoUrl(url: string): Promise<{ url: string; format: string } | null> {
  const baseUrl = new URL(url).origin;
  const paths = [
    "/logo.png", "/logo.svg", "/logo.webp",
    "/favicon.svg", "/apple-touch-icon.png", "/apple-touch-icon-180x180.png",
    "/icon.png", "/icon-512.png",
    "/android-chrome-512x512.png", "/android-chrome-192x192.png",
    "/favicon-32x32.png", "/favicon.png",
    "/assets/logo.png", "/assets/logo.svg",
    "/images/logo.png", "/images/logo.svg",
    "/img/logo.png", "/img/logo.svg",
    "/static/logo.png", "/static/logo.svg",
  ];

  // Probe common paths
  for (const p of paths) {
    try {
      const logoUrl = baseUrl + p;
      const res = await fetch(logoUrl, { method: "HEAD", signal: AbortSignal.timeout(3_000) });
      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("image") || p.endsWith(".svg") || p.endsWith(".png") || p.endsWith(".webp")) {
          const format = p.endsWith(".svg") ? "svg" : p.endsWith(".webp") ? "webp" : "png";
          return { url: logoUrl, format };
        }
      }
    } catch {}
  }

  // Clearbit fallback (high quality logos)
  try {
    const domain = new URL(url).hostname;
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const res = await fetch(clearbitUrl, { method: "HEAD", signal: AbortSignal.timeout(3_000) });
    if (res.ok) return { url: clearbitUrl, format: "png" };
  } catch {}

  // Google Favicon fallback (last resort)
  try {
    const domain = new URL(url).hostname;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return { url: faviconUrl, format: "png" };
  } catch {}

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Use Microlink to get screenshot + metadata (including logo)
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`;
    const microlinkRes = await fetch(microlinkUrl);
    const microlinkData = await microlinkRes.json();
    
    if (!microlinkData.data?.screenshot?.url) {
      console.error("Screenshot failed:", microlinkData);
      return NextResponse.json({ error: "Failed to capture screenshot" }, { status: 500 });
    }

    const imageUrl = microlinkData.data.screenshot.url;
    
    // Get logo from Microlink (it's smart about finding the best one)
    // Falls back to our manual search if Microlink doesn't find one
    let logoResult = microlinkData.data?.logo 
      ? { url: microlinkData.data.logo.url, format: microlinkData.data.logo.type || "png" }
      : await findLogoUrl(url);

    // Fetch the image and convert to base64
    const imageRes = await fetch(imageUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Step 3: Use Gemini Vision to analyze the screenshot
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this website screenshot and extract the brand identity. Return a JSON object with:

{
  "name": "Brand name (from logo or page title)",
  "tagline": "Tagline or slogan if visible",
  "colors": {
    "primary": "#hex - main brand color",
    "secondary": "#hex - secondary color",
    "accent": "#hex - accent/CTA color",
    "background": "#hex - main background",
    "foreground": "#hex - main text color",
    "extracted": ["#hex", "#hex", ...] - all colors found (up to 8)
  },
  "fonts": {
    "heading": "Font family for headings (best guess from visual style)",
    "body": "Font family for body text",
    "extracted": ["font1", "font2"] - all fonts identified
  },
  "style": {
    "preset": "flat|gradient|glass|gavin|chrome|gold|silver|neon|3d|holographic",
    "vibe": ["modern", "minimal", etc - 3-5 descriptors]
  },
  "personality": ["professional", "playful", "bold", "minimal", "luxurious", "friendly", "innovative", "traditional", "edgy", "warm", "technical", "approachable", "sophisticated", "casual", "authoritative"] - pick 2-4 that fit,
  "confidence": {
    "colors": 0.0-1.0,
    "fonts": 0.0-1.0,
    "overall": 0.0-1.0
  }
}

Be accurate with colors - use an eyedropper mentally. For fonts, make educated guesses based on visual characteristics (geometric sans, humanist sans, modern serif, etc).

Return ONLY the JSON, no markdown or explanation.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
    ]);

    const response = result.response.text();
    
    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = response;
    if (response.includes("```json")) {
      jsonStr = response.split("```json")[1].split("```")[0].trim();
    } else if (response.includes("```")) {
      jsonStr = response.split("```")[1].split("```")[0].trim();
    }

    const extracted = JSON.parse(jsonStr);

    return NextResponse.json({
      name: extracted.name,
      tagline: extracted.tagline,
      colors: extracted.colors,
      fonts: extracted.fonts,
      style: extracted.style,
      personality: extracted.personality,
      logo: logoResult,
      sourceUrl: url,
      sourceType: "url",
      confidence: extracted.confidence,
      screenshotUrl: imageUrl,
    });

  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
