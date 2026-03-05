import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Step 1: Take a screenshot using a free screenshot API
    const screenshotApiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
    const screenshotRes = await fetch(screenshotApiUrl);
    const screenshotData = await screenshotRes.json();
    
    if (!screenshotData.data?.screenshot?.url) {
      console.error("Screenshot failed:", screenshotData);
      return NextResponse.json({ error: "Failed to capture screenshot" }, { status: 500 });
    }

    const imageUrl = screenshotData.data.screenshot.url;

    // Step 2: Fetch the image and convert to base64
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

    // Step 4: Try to fetch favicon/logo
    let logo = null;
    try {
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
      logo = {
        url: faviconUrl,
        format: "png",
      };
    } catch (e) {
      // Ignore favicon errors
    }

    return NextResponse.json({
      name: extracted.name,
      tagline: extracted.tagline,
      colors: extracted.colors,
      fonts: extracted.fonts,
      style: extracted.style,
      personality: extracted.personality,
      logo,
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
