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
            skipPageImages: true, // Only need embedded images (logos), not page renders
          }),
        }).then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            embeddedImages = data.data?.embeddedImages || [];
            console.log(`[extract-pdf] Got ${embeddedImages.length} embedded images`);
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
        console.log(`[extract-pdf] Classifying ${embeddedImages.length} images with Gemini Vision...`);
        
        // Use flash model for speed
        const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // Send up to 10 images for classification
        const imagesToClassify = embeddedImages.slice(0, 10);
        const imagePrompt = `Analyze these ${imagesToClassify.length} images extracted from a brand style guide PDF.

For EACH image, classify it as one of:
- "logo" - Company logo, wordmark, icon mark, or logo variant
- "photography" - Photo used for brand examples/mood
- "illustration" - Illustrated graphics or icons
- "discard" - Decorative elements, patterns, UI elements, or irrelevant images

Return JSON array with one object per image (in order):
[
  { "index": 0, "type": "logo", "subtype": "primary|secondary|icon|wordmark", "confidence": 0.95 },
  { "index": 1, "type": "photography", "description": "brief description", "confidence": 0.8 },
  { "index": 2, "type": "discard", "reason": "decorative pattern", "confidence": 0.9 }
]

Return ONLY valid JSON array, no markdown.`;

        const imageParts = imagesToClassify.map(img => {
          // Extract base64 data from data URL
          const base64Data = img.data.split(",")[1];
          return {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          };
        });

        const classifyResult = await visionModel.generateContent([
          ...imageParts,
          { text: imagePrompt },
        ]);

        const classifyText = classifyResult.response.text();
        let classifications = [];
        try {
          // Parse JSON (handle potential markdown)
          let jsonStr = classifyText;
          if (classifyText.includes("```")) {
            jsonStr = classifyText.split("```")[1].replace(/^json\n?/, "").trim();
          }
          classifications = JSON.parse(jsonStr);
        } catch (e) {
          console.error(`[extract-pdf] Failed to parse classifications:`, e);
        }

        // Sort classified images
        for (const cls of classifications) {
          const img = imagesToClassify[cls.index];
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
          // Discard type is ignored
        }

        // Sort logos by confidence, pick main
        classifiedImages.logos.sort((a, b) => b.confidence - a.confidence);
        if (classifiedImages.logos.length > 0) {
          mainLogoData = classifiedImages.logos[0].data;
          console.log(`[extract-pdf] Identified ${classifiedImages.logos.length} logos, main type: ${classifiedImages.logos[0].type}`);
        }
      } catch (err) {
        console.error(`[extract-pdf] Image classification failed:`, err);
        // Fallback to largest image
        if (embeddedImages.length > 0) {
          const sorted = [...embeddedImages].sort((a, b) => b.size - a.size);
          mainLogoData = sorted[0].data;
        }
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
      // Include classified images
      _classifiedImages: {
        logos: classifiedImages.logos.slice(0, 5),
        photography: classifiedImages.photography.slice(0, 5),
        illustrations: classifiedImages.illustrations.slice(0, 3),
      },
      // Fallback: raw embedded images if classification failed
      _embeddedImages: classifiedImages.logos.length === 0 
        ? embeddedImages.slice(0, 5).map(img => ({
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
