/**
 * OpenGFX Logo Service — CREATIVE DIRECTOR MODE
 * 
 * ARCHITECTURE (mirrors mascot):
 * 1. ONE INPUT: Concept prompt (brand name optional - AI can generate)
 * 2. ONE BRIEF: AI makes ALL creative decisions holistically
 * 3. DYNAMIC PROMPTS: AI generates icon/wordmark prompts per job
 * 4. QC CRITERIA: AI defines what to check per job
 * 5. UNIQUENESS: Logo registry prevents duplicates
 * 
 * PRESERVED RULES:
 * - Base logos MUST be grayscale (black, white, grey only)
 * - Color/effects come ONLY at socials/render stage
 * - Icon complexity 40-50%, frame fill 60-70%
 * - The Rule of One: One interesting visual element
 * - Must be recognizable at 32x32px
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createCanvas, registerFont } from "canvas";

import { execSync } from "child_process";
import { ai, IMAGE_MODEL, TEXT_MODEL, generateImage } from "../ai.js";
import type { BrandSystem, ColorPalette, Typography, RenderStyle } from "../types.js";
import { FONT_LIBRARY, INSTALLED_FONTS } from "../constants.js";

const CDN_BASE = "https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev";

// Import existing learnings — these are PRESERVED
import {
  LOGO_RULES,
  LOGO_ANTI_PATTERNS,
  ICON_RULES,
  ICON_PROMPT_BLOCK,
  WORDMARK_RULES,
  LOCKUP_RULES,
  BANNER_LAYOUT,
  BANNER_PROMPT_BLOCK,
  RENDER_STYLES,
  EYE_RENDERING_RULES,
} from "../learnings/logo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// LOGO REGISTRY (for uniqueness tracking)
// ═══════════════════════════════════════════════════════════════════

interface LogoRegistryEntry {
  brandName: string;
  iconConcept: string;
  primaryColor: string;
  renderStyle: string;
  createdAt: string;
}

interface LogoRegistry {
  logos: LogoRegistryEntry[];
  takenConcepts: string[];
}

const REGISTRY_PATH = path.join(__dirname, "..", "..", "data", "logo-registry.json");

function loadLogoRegistry(): LogoRegistry {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
    }
  } catch {}
  return { logos: [], takenConcepts: [] };
}

function saveLogoRegistry(registry: LogoRegistry): void {
  const dir = path.dirname(REGISTRY_PATH);
  if (!dir.includes("node_modules")) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

// ═══════════════════════════════════════════════════════════════════
// CREATIVE BRIEF — The AI Creative Director
// Makes ALL creative decisions holistically for each unique job
// ═══════════════════════════════════════════════════════════════════

export interface LogoCreativeBrief {
  // Brand Identity
  brandName: string;
  generatedName: boolean;
  tagline: string | null;
  
  // Visual Concept (AI decides)
  iconConcept: string;           // "Abstract eye with flowing lines"
  iconDescription: string;       // Detailed description
  iconImagePrompt: string;       // Full prompt for Gemini
  
  // Typography (AI decides)
  wordmarkApproach: "library" | "custom";
  fontFamily: string | null;
  fontWeight: number;
  wordmarkStyle: string;
  wordmarkPrompt: string | null; // If custom generation needed
  
  // Colors (AI picks - for render stage)
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  mode: "dark" | "light";
  
  // Render Style
  renderStyle: string;
  styleNotes: string;
  
  // Has Eyes? (affects render style choices)
  iconHasEyes: boolean;
  recommendedRenderStyles: string[];
  
  // QC Criteria (AI defines per job)
  mustHaveFeatures: string[];    // ["eye symbol", "flowing lines"]
  qcCriteria: string[];          // ["icon is recognizable at 32px", "single visual element"]
  iconComplexityTarget: number;  // 0.40-0.50
  
  // Uniqueness
  similarExisting: string[];
}

async function createLogoBrief(
  concept: string,
  brandName?: string,
  tagline?: string
): Promise<LogoCreativeBrief> {
  
  const registry = loadLogoRegistry();
  const existingLogos = registry.logos.slice(-20).map(l => 
    `${l.brandName}: ${l.iconConcept}`
  ).join("\n");

  const prompt = `You are the Creative Director at a prestigious branding agency (Pentagram-level).
A client has come to you with a brand concept. Make ALL creative decisions for this logo system.

═══════════════════════════════════════════════════════════════
CLIENT BRIEF
═══════════════════════════════════════════════════════════════
${brandName ? `BRAND NAME: "${brandName}"` : "BRAND NAME: (Generate a perfect name for this concept)"}
CONCEPT: "${concept}"
${tagline ? `TAGLINE: "${tagline}"` : "TAGLINE: (Optional - suggest one if it fits)"}

═══════════════════════════════════════════════════════════════
YOUR CONSTRAINTS (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════════

ICON RULES:
${ICON_PROMPT_BLOCK}

GRAYSCALE BASE RULE:
- Base icons MUST be BLACK on WHITE only (no colors!)
- Grey (#333-#CCC) ONLY if shape absolutely requires shading
- Color/effects come LATER at render stage
- This is NON-NEGOTIABLE

RENDER STYLES AVAILABLE (for later stage):
${RENDER_STYLES.presets.join(", ")}

EYE/PUPIL RULE:
- If icon has eyes with pupils, AVOID neon style
- Eyes need solid white fill for catchlights
- Preferred for eye icons: glass, gradient, gavin

FONT LIBRARY (if library font fits):
${Object.keys(FONT_LIBRARY).join(", ")}

═══════════════════════════════════════════════════════════════
EXISTING LOGOS (ensure uniqueness)
═══════════════════════════════════════════════════════════════
${existingLogos || "(none yet)"}

Ensure your icon concept is DIFFERENT from existing logos.

═══════════════════════════════════════════════════════════════
YOUR TASK: Make ALL creative decisions
═══════════════════════════════════════════════════════════════

Think through:
1. What is this brand about? What emotion should it evoke?
2. What is the ONE perfect visual symbol for the icon? (Rule of One)
3. Is this simple enough to recognize at 32x32px?
4. Should wordmark use a library font or need custom generation?
5. What's the brand mode? (dark = tech/gaming/edgy, light = friendly/wellness)
6. What render style fits the brand?
7. Does the icon have eyes? (affects style choices)
8. What MUST be in the icon? What should QC check?

Respond with ONLY this JSON:
{
  "brandName": "${brandName || '<generate a perfect 1-2 word brand name>'}",
  "generatedName": ${!brandName},
  "tagline": ${tagline ? `"${tagline}"` : "null or suggested tagline"},
  
  "iconConcept": "<2-5 word concept, e.g. 'Abstract eye with circuits'>",
  "iconDescription": "<detailed description of what the icon looks like>",
  "iconImagePrompt": "<FULL prompt for Gemini to generate the icon - include all style rules>",
  
  "wordmarkApproach": "library" or "custom",
  "fontFamily": "Font Name" or null,
  "fontWeight": 600,
  "wordmarkStyle": "<describe the wordmark style>",
  "wordmarkPrompt": "<prompt if custom>" or null,
  
  "primaryColor": "#hex",
  "secondaryColor": "#hex", 
  "backgroundColor": "#hex",
  "mode": "dark" or "light",
  
  "renderStyle": "flat-solid|flat|gradient|glass|gavin|chrome|gold|neon|3d",
  "styleNotes": "<why this style fits>",
  
  "iconHasEyes": true/false,
  "recommendedRenderStyles": ["style1", "style2"],
  
  "mustHaveFeatures": ["feature1", "feature2"],
  "qcCriteria": ["check1", "check2", "recognizable at 32px", "single visual element"],
  "iconComplexityTarget": 0.45,
  
  "similarExisting": ["brand names to avoid similarity with"]
}`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
  });

  const text = response.text?.trim() || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error("Could not parse Creative Director response");
  }
  
  const brief = JSON.parse(jsonMatch[0]) as LogoCreativeBrief;
  
  // Ensure icon prompt includes critical rules
  if (!brief.iconImagePrompt.includes("BLACK")) {
    brief.iconImagePrompt = `🚨 CRITICAL: BLACK (#000000) on WHITE (#FFFFFF) only. NO COLORS.\n\n${brief.iconImagePrompt}`;
  }
  
  // Add standard QC criteria if missing
  const standardQC = [
    "Icon is recognizable at 32x32px",
    "Single visual element (Rule of One)",
    "Black on white only (no colors)",
    "60-70% frame fill",
  ];
  for (const qc of standardQC) {
    if (!brief.qcCriteria.some(c => c.toLowerCase().includes(qc.toLowerCase().slice(0, 20)))) {
      brief.qcCriteria.push(qc);
    }
  }
  
  return brief;
}

// ═══════════════════════════════════════════════════════════════════
// QC VERIFICATION
// ═══════════════════════════════════════════════════════════════════

interface LogoQCResult {
  passed: boolean;
  issues: string[];
  complexity: number;
}

async function verifyLogoIcon(
  iconPath: string,
  brief: LogoCreativeBrief
): Promise<LogoQCResult> {
  const imageData = fs.readFileSync(iconPath);
  const base64Image = imageData.toString("base64");

  const prompt = `You are a Creative Director doing STRICT QC on a logo icon.

THE BRIEF:
- Concept: ${brief.iconConcept}
- Description: ${brief.iconDescription}

⚠️ CRITICAL CHECKS (REJECT IF WRONG):
1. BLACK ON WHITE ONLY — no colors allowed (grey OK if needed for form)
2. SINGLE VISUAL ELEMENT — not busy or cluttered (Rule of One)
3. RECOGNIZABLE AT 32x32px — simple enough to scale down
4. 60-70% FRAME FILL — substantial but not cramped
5. NO TEXT — icon only, no letters or words

MUST-HAVE FEATURES:
${brief.mustHaveFeatures.map(f => `• ${f}`).join("\n")}

QC CHECKLIST:
${brief.qcCriteria.map(c => `☐ ${c}`).join("\n")}

${brief.iconHasEyes ? "⚠️ ICON HAS EYES: Verify white catchlight/highlight is solid fill, not outline." : ""}

Estimate complexity on 0-1 scale (target: 0.40-0.50).

Respond with ONLY this JSON:
{
  "matches_concept": <boolean>,
  "is_black_on_white": <boolean>,
  "has_colors": <boolean>,
  "single_element": <boolean>,
  "readable_at_32px": <boolean>,
  "frame_fill_ok": <boolean>,
  "has_text": <boolean>,
  "complexity": <0.0-1.0>,
  "features_present": ["list"],
  "features_missing": ["list"],
  "issues": ["list any problems"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        { role: "user", parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          { text: prompt }
        ]}
      ],
    });

    const text = response.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { passed: false, issues: ["Could not parse QC response"], complexity: 0.5 };
    }
    
    const qc = JSON.parse(jsonMatch[0]);
    const issues: string[] = [];
    
    // Critical checks
    if (qc.has_colors === true) {
      issues.push("CRITICAL: Icon has colors — must be black on white only");
    }
    if (qc.single_element === false) {
      issues.push("Icon is too complex — should be single visual element (Rule of One)");
    }
    if (qc.readable_at_32px === false) {
      issues.push("Icon won't be readable at 32x32px — simplify");
    }
    if (qc.has_text === true) {
      issues.push("Icon contains text — must be purely graphical");
    }
    if (qc.matches_concept === false) {
      issues.push(`Icon doesn't match concept: "${brief.iconConcept}"`);
    }
    if (qc.features_missing?.length > 0) {
      issues.push(`Missing features: ${qc.features_missing.join(", ")}`);
    }
    if (qc.complexity > 0.65) {
      issues.push(`Complexity too high (${qc.complexity}) — target is 0.40-0.50`);
    }
    
    // Add any issues from vision
    if (qc.issues?.length > 0) {
      issues.push(...qc.issues.filter((i: string) => i && i.length > 0));
    }
    
    return {
      passed: issues.length === 0,
      issues,
      complexity: qc.complexity || 0.5,
    };
  } catch (err) {
    return { passed: false, issues: [`QC error: ${err}`], complexity: 0.5 };
  }
}

// ═══════════════════════════════════════════════════════════════════
// WORDMARK RENDERING (preserves existing logic)
// ═══════════════════════════════════════════════════════════════════

function renderWordmarkFromFont(
  brandName: string,
  outputPath: string,
  fontFamily: string,
  fontWeight: number
): string {
  const canvasWidth = 2048;
  const canvasHeight = 512;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");
  
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  let fontSize = 400;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  let textWidth = ctx.measureText(brandName).width;
  
  while (textWidth > canvasWidth * 0.90 && fontSize > 50) {
    fontSize -= 10;
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    textWidth = ctx.measureText(brandName).width;
  }
  
  ctx.fillText(brandName, canvasWidth / 2, canvasHeight / 2);
  
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════════

export interface LogoInput {
  concept: string;
  brandName?: string;
  tagline?: string;
  outputDir?: string;
  // Overrides (optional)
  primaryColor?: string;
  renderStyle?: string;
}

export interface LogoOutput {
  brandSystem: BrandSystem;
  brief: LogoCreativeBrief;
  qcReport: LogoQCResult;
  paths: {
    icon: string;
    wordmark: string;
    stacked: string;
    horizontal: string;
    brandSystem: string;
  };
  cdn: {
    icon: string;
    wordmark: string;
    stacked: string;
    horizontal: string;
    brandSystem: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// CDN UPLOAD
// ═══════════════════════════════════════════════════════════════════

async function uploadToR2(localPath: string, cdnKey: string): Promise<string> {
  const contentType = localPath.endsWith(".json") ? "application/json" : "image/png";
  execSync(
    `wrangler r2 object put opengfx-assets/${cdnKey} --file "${localPath}" --content-type "${contentType}" --remote`,
    { stdio: "pipe" }
  );
  return `${CDN_BASE}/${cdnKey}`;
}

export async function generateLogo(input: LogoInput): Promise<LogoOutput> {
  const opengfxDir = path.resolve(__dirname, "..", "..");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  OpenGFX Logo Generator — Creative Director Mode`);
  console.log(`  Concept: ${input.concept.slice(0, 50)}...`);
  console.log(`${"═".repeat(62)}\n`);

  // ─── STEP 1: CREATIVE BRIEF ───
  console.log(`[1/7] Creative Director analyzing brief...`);
  const brief = await createLogoBrief(input.concept, input.brandName, input.tagline);
  
  // Apply user overrides
  if (input.primaryColor) brief.primaryColor = input.primaryColor;
  if (input.renderStyle) brief.renderStyle = input.renderStyle;
  
  console.log(`\n      ┌─────────────────────────────────────────────────`);
  console.log(`      │ CREATIVE BRIEF`);
  console.log(`      ├─────────────────────────────────────────────────`);
  console.log(`      │ Brand: ${brief.brandName}${brief.generatedName ? " (AI generated)" : ""}`);
  console.log(`      │ Icon: ${brief.iconConcept}`);
  console.log(`      │ Mode: ${brief.mode}`);
  console.log(`      │ Style: ${brief.renderStyle}`);
  console.log(`      │ Font: ${brief.wordmarkApproach === "library" ? brief.fontFamily : "Custom AI"}`);
  console.log(`      │ Must-have: ${brief.mustHaveFeatures.slice(0, 3).join(", ")}`);
  console.log(`      └─────────────────────────────────────────────────\n`);

  // Setup output directories
  const brandSlug = brief.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const outputDir = input.outputDir || path.join(opengfxDir, "output", brandSlug);
  const logoDir = path.join(outputDir, "logo");
  const styleDir = path.join(outputDir, "style");
  
  fs.mkdirSync(logoDir, { recursive: true });
  fs.mkdirSync(styleDir, { recursive: true });

  // ─── STEP 2: GENERATE ICON ───
  console.log(`[2/7] Generating icon...`);
  const iconPath = path.join(logoDir, "icon.png");
  
  let qcReport: LogoQCResult = { passed: false, issues: [], complexity: 0.5 };
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await generateImage(brief.iconImagePrompt, iconPath);
    
    qcReport = await verifyLogoIcon(iconPath, brief);
    
    if (qcReport.passed) {
      console.log(`      ✓ icon.png (QC PASS, complexity: ${qcReport.complexity.toFixed(2)})`);
      break;
    } else {
      console.log(`      ⚠️ icon QC FAIL (attempt ${attempt}): ${qcReport.issues[0]}`);
      if (attempt < maxRetries) {
        // Regenerate with feedback
        brief.iconImagePrompt += `\n\n⚠️ PREVIOUS ATTEMPT FAILED: ${qcReport.issues.join(", ")}\nFix these issues.`;
      }
    }
  }
  
  if (!qcReport.passed) {
    console.log(`      ⚠️ Using best attempt despite QC issues`);
  }

  // ─── STEP 3: GENERATE WORDMARK ───
  console.log(`[3/7] Generating wordmark...`);
  const wordmarkPath = path.join(logoDir, "wordmark.png");
  
  if (brief.wordmarkApproach === "library" && brief.fontFamily) {
    renderWordmarkFromFont(brief.brandName, wordmarkPath, brief.fontFamily, brief.fontWeight);
    console.log(`      ✓ wordmark.png [${brief.fontFamily}]`);
  } else {
    const wordmarkPrompt = brief.wordmarkPrompt || `Create a wordmark that says exactly "${brief.brandName}".

STYLE: ${brief.wordmarkStyle}

CRITICAL:
- Solid black (#000000) on pure white (#FFFFFF)
- Text fills ~90% of width
- Preserve EXACT capitalization
- 2048x512 pixels (4:1 ratio)
- NO decorations, just clean typography`;
    
    await generateImage(wordmarkPrompt, wordmarkPath);
    console.log(`      ✓ wordmark.png [Custom AI]`);
  }

  // ─── STEP 4: COMPOSITE LOCKUPS ───
  console.log(`[4/7] Compositing lockups...`);
  const stackedPath = path.join(logoDir, "stacked.png");
  const horizontalPath = path.join(logoDir, "horizontal.png");
  
  // Import composite functions from existing service
  const { compositeStacked, compositeHorizontal } = await import("./brand-foundation.js");
  await compositeStacked(logoDir);
  console.log(`      ✓ stacked.png`);
  await compositeHorizontal(logoDir, brief.brandName);
  console.log(`      ✓ horizontal.png`);

  // ─── STEP 5: SAVE BRAND SYSTEM ───
  console.log(`[5/7] Generating style guide...`);
  
  const colors: ColorPalette = {
    primary: brief.primaryColor,
    secondary: brief.secondaryColor,
    background: brief.backgroundColor,
    foreground: brief.mode === "dark" ? "#FFFFFF" : "#000000",
  };
  
  const typography: Typography = {
    headerFont: brief.fontFamily || "Inter",
    headerWeight: brief.fontWeight,
    bodyFont: "Inter",
    bodyWeight: 400,
  };
  
  const renderStyle: RenderStyle = {
    preset: brief.renderStyle as any,
    parameters: {},
  };
  
  // Save individual files
  fs.writeFileSync(path.join(styleDir, "colors.json"), JSON.stringify(colors, null, 2));
  fs.writeFileSync(path.join(styleDir, "typography.json"), JSON.stringify(typography, null, 2));
  fs.writeFileSync(path.join(styleDir, "render-style.json"), JSON.stringify(renderStyle, null, 2));
  
  const brandSystem: BrandSystem = {
    brand: {
      name: brief.brandName,
      tagline: brief.tagline || undefined,
      concept: input.concept,
    },
    logo: {
      icon: "logo/icon.png",
      wordmark: "logo/wordmark.png",
      stacked: "logo/stacked.png",
      horizontal: "logo/horizontal.png",
    },
    colors,
    typography,
    renderStyle,
    mode: brief.mode,
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    creativeBrief: {
      iconConcept: brief.iconConcept,
      mustHaveFeatures: brief.mustHaveFeatures,
      qcCriteria: brief.qcCriteria,
    },
  };
  
  const brandSystemPath = path.join(outputDir, "brand-system.json");
  fs.writeFileSync(brandSystemPath, JSON.stringify(brandSystem, null, 2));
  console.log(`      ✓ brand-system.json`);

  // ─── STEP 6: REGISTER LOGO ───
  console.log(`[6/7] Registering logo...`);
  const registry = loadLogoRegistry();
  registry.logos.push({
    brandName: brief.brandName,
    iconConcept: brief.iconConcept,
    primaryColor: brief.primaryColor,
    renderStyle: brief.renderStyle,
    createdAt: new Date().toISOString().split("T")[0],
  });
  registry.takenConcepts.push(brief.iconConcept.toLowerCase());
  saveLogoRegistry(registry);
  console.log(`      ✓ Registered: ${brief.brandName} (${brief.iconConcept})`);

  // ─── STEP 7: UPLOAD TO CDN ───
  console.log(`[7/7] Uploading to CDN...`);
  const version = Date.now();
  const cdnPrefix = `${brandSlug}/v${version}`;
  
  const cdn = {
    icon: await uploadToR2(iconPath, `${cdnPrefix}/icon.png`),
    wordmark: await uploadToR2(wordmarkPath, `${cdnPrefix}/wordmark.png`),
    stacked: await uploadToR2(stackedPath, `${cdnPrefix}/stacked.png`),
    horizontal: await uploadToR2(horizontalPath, `${cdnPrefix}/horizontal.png`),
    brandSystem: await uploadToR2(brandSystemPath, `${cdnPrefix}/brand-system.json`),
  };
  
  console.log(`      ✓ icon.png → ${cdn.icon}`);
  console.log(`      ✓ wordmark.png`);
  console.log(`      ✓ stacked.png`);
  console.log(`      ✓ horizontal.png`);
  console.log(`      ✓ brand-system.json`);

  // ─── SUMMARY ───
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  ✓ LOGO COMPLETE`);
  console.log(`  Brand: ${brief.brandName}${brief.generatedName ? " (AI named)" : ""}`);
  console.log(`  QC: ${qcReport.passed ? "PASSED" : "WARNINGS"}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`${"═".repeat(62)}\n`);
  
  console.log(`  CDN Links:`);
  console.log(`    Icon:     ${cdn.icon}`);
  console.log(`    Wordmark: ${cdn.wordmark}`);
  console.log(`    Stacked:  ${cdn.stacked}`);
  console.log(`    Horiz:    ${cdn.horizontal}`);
  console.log(`    System:   ${cdn.brandSystem}`);
  console.log();

  // Print result for parsing
  console.log(`LOGO_RESULT:${JSON.stringify({
    brandName: brief.brandName,
    generatedName: brief.generatedName,
    paths: {
      icon: iconPath,
      wordmark: wordmarkPath,
      stacked: stackedPath,
      horizontal: horizontalPath,
      brandSystem: brandSystemPath,
    },
    cdn,
    qcPassed: qcReport.passed,
  })}`);

  return {
    brandSystem,
    brief,
    qcReport,
    paths: {
      icon: iconPath,
      wordmark: wordmarkPath,
      stacked: stackedPath,
      horizontal: horizontalPath,
      brandSystem: brandSystemPath,
    },
    cdn,
  };
}
