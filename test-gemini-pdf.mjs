import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY not set");
  process.exit(1);
}

const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

console.log("Uploading PDF to Gemini...");
const uploadResult = await fileManager.uploadFile(
  process.env.HOME + "/Merck_Guidelines.pdf",
  { mimeType: "application/pdf", displayName: "Merck Brand Guidelines" }
);

console.log(`Uploaded: ${uploadResult.file.name}`);
console.log(`URI: ${uploadResult.file.uri}`);

// Wait for processing
let file = await fileManager.getFile(uploadResult.file.name);
while (file.state === "PROCESSING") {
  console.log("Processing...");
  await new Promise(r => setTimeout(r, 2000));
  file = await fileManager.getFile(uploadResult.file.name);
}

if (file.state === "FAILED") {
  console.error("Processing failed");
  process.exit(1);
}

console.log("File ready. Analyzing brand guide...");

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const result = await model.generateContent([
  {
    fileData: {
      mimeType: uploadResult.file.mimeType,
      fileUri: uploadResult.file.uri,
    },
  },
  {
    text: `Analyze this brand style guide PDF and extract the complete brand identity.

Return JSON (no markdown):
{
  "name": "Brand name",
  "colors": {
    "primary": { "name": "Color name", "hex": "#hex" },
    "secondary": [{ "name": "Name", "hex": "#hex" }],
    "accent": [{ "name": "Name", "hex": "#hex" }]
  },
  "typography": {
    "primary": { "family": "Font name", "weights": ["Light", "Regular", "Bold"], "usage": "Headlines" },
    "secondary": { "family": "Font name", "usage": "Body/fallback" }
  },
  "logo": {
    "description": "Describe the logo",
    "variants": ["Primary", "Secondary", "Icon"]
  },
  "personality": ["trait1", "trait2", "trait3"],
  "summary": "2-3 sentence brand summary"
}`
  }
]);

console.log("\n=== BRAND IDENTITY ===\n");
console.log(result.response.text());
