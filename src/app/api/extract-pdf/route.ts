import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { PDF_EXTRACTION_PROMPT } from "@/lib/extraction-prompts";

const API_KEY = process.env.GEMINI_API_KEY!;
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

const EXTRACTOR_URL = process.env.EXTRACTOR_URL;
const EXTRACTOR_API_KEY = process.env.EXTRACTOR_API_KEY;

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fs = await import("fs/promises");
    const tempPath = `/tmp/newsphere-${Date.now()}.pdf`;
    await fs.writeFile(tempPath, buffer);

    // Run BOTH in parallel: Mac Mini extractor (logos) + Gemini upload
    let embeddedImages: Array<{ filename: string; data: string; size: number }> = [];
    let mainLogoData: string | null = null;
    
    // Extractor call - no timeout, we need all images
    const extractorPromise = (EXTRACTOR_URL && EXTRACTOR_API_KEY) 
      ? fetch(`${EXTRACTOR_URL}/extract-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${EXTRACTOR_API_KEY}`,
          },
          body: JSON.stringify({
            pdfBase64: buffer.toString("base64"),
            filename: file.name,
            skipPageImages: true,
          }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            embeddedImages = data.data?.embeddedImages || [];
            console.log(`[extract-pdf] Got ${embeddedImages.length} embedded images`);
          } else {
            console.error(`[extract-pdf] Extractor returned ${res.status}`);
          }
        }).catch(err => console.error(`[extract-pdf] Extractor failed:`, err))
      : Promise.resolve();

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

    // Use Gemini 3.1 Pro for the most accurate extraction
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: PDF_EXTRACTION_PROMPT },
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

    console.log(`[extract-pdf] Extracted: ${brandIdentity.metadata?.brandName || brandIdentity.name}`);

    // Wait for extractor to finish (likely already done since Gemini takes longer)
    await extractorPromise;

    // Classify embedded images using Gemini Vision
    let classifiedImages: {
      logos: Array<{ data: string; type: string; confidence: number }>;
      photography: Array<{ data: string; description: string }>;
      illustrations: Array<{ data: string; description: string }>;
    } = { logos: [], photography: [], illustrations: [] };

    if (embeddedImages.length > 0) {
      try {
        console.log(`[extract-pdf] Classifying ALL ${embeddedImages.length} images with Gemini Vision...`);
        
        const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const imagePrompt = `You are analyzing ${embeddedImages.length} images extracted from a brand style guide PDF.

For EACH image (in order), classify as:
- "logo" - Company logo, wordmark, icon mark, logo variant, or brand mark
- "photography" - Photograph used for brand mood/examples
- "illustration" - Illustrated graphics, icons, or artwork
- "discard" - Decorative patterns, UI elements, screenshots, or irrelevant

Return a JSON array with one object per image (matching the order):
[
  { "index": 0, "type": "logo", "subtype": "primary", "confidence": 0.95 },
  { "index": 1, "type": "photography", "description": "person smiling", "confidence": 0.8 },
  { "index": 2, "type": "discard", "reason": "decorative pattern", "confidence": 0.9 }
]

Logo subtypes: primary, secondary, icon, wordmark, monochrome, reversed
Return ONLY valid JSON array, no markdown code blocks.`;

        const imageParts = embeddedImages.map(img => ({
          inlineData: {
            mimeType: "image/png",
            data: img.data.split(",")[1],
          },
        }));

        const classifyResult = await visionModel.generateContent([
          ...imageParts,
          { text: imagePrompt },
        ]);

        const classifyText = classifyResult.response.text();
        let classifications: any[] = [];
        try {
          let jsonStr = classifyText;
          if (classifyText.includes("```json")) {
            jsonStr = classifyText.split("```json")[1].split("```")[0].trim();
          } else if (classifyText.includes("```")) {
            jsonStr = classifyText.split("```")[1].split("```")[0].trim();
          }
          classifications = JSON.parse(jsonStr);
          console.log(`[extract-pdf] Parsed ${classifications.length} classifications`);
        } catch (e) {
          console.error(`[extract-pdf] Failed to parse classifications`);
        }

        // Process all classifications
        for (const cls of classifications) {
          const img = embeddedImages[cls.index];
          if (!img) continue;
          
          if (cls.type === "logo") {
            classifiedImages.logos.push({
              data: img.data,
              type: cls.subtype || "primary",
              confidence: cls.confidence || 0.8,
            });
          } else if (cls.type === "photography") {
            classifiedImages.photography.push({
              data: img.data,
              description: cls.description || "",
            });
          } else if (cls.type === "illustration") {
            classifiedImages.illustrations.push({
              data: img.data,
              description: cls.description || "",
            });
          }
          // "discard" type is ignored
        }

        // Sort logos by confidence
        classifiedImages.logos.sort((a, b) => b.confidence - a.confidence);
        
        if (classifiedImages.logos.length > 0) {
          mainLogoData = classifiedImages.logos[0].data;
          console.log(`[extract-pdf] Found ${classifiedImages.logos.length} logos, ${classifiedImages.photography.length} photos, ${classifiedImages.illustrations.length} illustrations`);
        }
      } catch (err) {
        console.error(`[extract-pdf] Image classification failed:`, err);
      }
      
      // Fallback if no logos found
      if (!mainLogoData && embeddedImages.length > 0) {
        // Pick smallest image (logos tend to be smaller than photos)
        const sorted = [...embeddedImages].sort((a, b) => a.size - b.size);
        mainLogoData = sorted[0].data;
        console.log(`[extract-pdf] Fallback: using smallest image as likely logo`);
      }
    }

    // Cleanup uploaded file from Gemini
    await fileManager.deleteFile(uploadResult.file.name).catch(() => {});

    return NextResponse.json({
      ...brandIdentity,
      _source: "pdf",
      _filename: file.name,
      // Include main logo
      logo: mainLogoData ? { 
        url: mainLogoData, 
        format: "png",
        source: "embedded" 
      } : null,
      // Include ALL classified images
      _classifiedImages: {
        logos: classifiedImages.logos,
        photography: classifiedImages.photography,
        illustrations: classifiedImages.illustrations,
      },
      // Fallback: raw embedded images if classification failed
      _embeddedImages: classifiedImages.logos.length === 0 
        ? embeddedImages.map(img => ({
            filename: img.filename,
            data: img.data,
            size: img.size,
          }))
        : undefined,
    });

  } catch (error) {
    console.error("[extract-pdf] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PDF extraction failed" },
      { status: 500 }
    );
  }
}
