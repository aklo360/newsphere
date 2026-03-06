import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const API_KEY = process.env.GEMINI_API_KEY!;
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

const BRAND_EXTRACTION_PROMPT = `Analyze this brand style guide PDF and extract the complete brand identity.

Return JSON only (no markdown, no code blocks):
{
  "name": "Brand name",
  "tagline": "Brand tagline/anthem if present, or null",
  "concept": "1-2 sentence description of what this brand represents",
  
  "colors": {
    "primary": { "name": "Color name", "hex": "#hex" },
    "secondary": [{ "name": "Name", "hex": "#hex" }],
    "accent": [{ "name": "Name", "hex": "#hex" }],
    "background": "#hex (typical background color)",
    "foreground": "#hex (typical text color)",
    "mode": "light or dark"
  },
  
  "typography": {
    "primary": {
      "family": "Primary font family name",
      "weights": ["Light", "Regular", "Bold"],
      "usage": "How it's used (headlines, body, etc.)"
    },
    "secondary": {
      "family": "Secondary/fallback font",
      "usage": "When used"
    },
    "heading": "Font for headings",
    "body": "Font for body text"
  },
  
  "logo": {
    "description": "Describe the logo",
    "variants": ["Primary", "Secondary", "Icon only"],
    "colorVariants": ["On light", "On dark"]
  },
  
  "personality": ["trait1", "trait2", "trait3"],
  
  "guidelines": {
    "dos": ["Key brand dos from the guide"],
    "donts": ["Key brand don'ts from the guide"]
  },
  
  "confidence": 0.95
}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    console.log(`[extract-pdf] Processing ${file.name} (${file.size} bytes)`);

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write to temp file (Gemini File API needs a file path)
    const tempPath = `/tmp/newsphere-${Date.now()}.pdf`;
    const fs = await import("fs/promises");
    await fs.writeFile(tempPath, buffer);

    // Upload PDF directly to Gemini
    console.log(`[extract-pdf] Uploading to Gemini File API...`);
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: "application/pdf",
      displayName: file.name,
    });

    console.log(`[extract-pdf] Uploaded: ${uploadResult.file.name}`);

    // Wait for processing
    let geminiFile = await fileManager.getFile(uploadResult.file.name);
    let attempts = 0;
    while (geminiFile.state === "PROCESSING" && attempts < 30) {
      console.log(`[extract-pdf] Processing... (${attempts + 1})`);
      await new Promise(r => setTimeout(r, 2000));
      geminiFile = await fileManager.getFile(uploadResult.file.name);
      attempts++;
    }

    // Cleanup temp file
    await fs.unlink(tempPath).catch(() => {});

    if (geminiFile.state === "FAILED") {
      return NextResponse.json({ error: "PDF processing failed" }, { status: 500 });
    }

    console.log(`[extract-pdf] File ready. Analyzing brand guide...`);

    // Use Gemini to analyze the entire PDF
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: BRAND_EXTRACTION_PROMPT },
    ]);

    const responseText = result.response.text();
    
    // Parse JSON (handle potential markdown wrapping)
    let jsonStr = responseText;
    if (responseText.includes("```json")) {
      jsonStr = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonStr = responseText.split("```")[1].split("```")[0].trim();
    }

    const brandIdentity = JSON.parse(jsonStr);

    console.log(`[extract-pdf] Extracted: ${brandIdentity.name}`);

    // Cleanup uploaded file from Gemini
    await fileManager.deleteFile(uploadResult.file.name).catch(() => {});

    return NextResponse.json({
      ...brandIdentity,
      _source: "pdf",
      _filename: file.name,
    });

  } catch (error) {
    console.error("[extract-pdf] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF extraction failed" },
      { status: 500 }
    );
  }
}
