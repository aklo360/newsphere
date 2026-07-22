/**
 * OpenGFX guidance loader.
 *
 * Loads CHANGELOG.md at runtime and injects it into prompts.
 * Edit CHANGELOG.md to change future design outputs.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHANGELOG_PATH = path.join(__dirname, "CHANGELOG.md");

/**
 * Load prompt guidance from CHANGELOG.md.
 * Called at runtime, so changes affect the next generation.
 */
export function loadGuidance(): string {
  try {
    return fs.readFileSync(CHANGELOG_PATH, "utf-8");
  } catch (err) {
    console.error("[guidance] Failed to load CHANGELOG.md:", err);
    return "";
  }
}

/**
 * Get a specific section from guidance.
 */
export function getGuidanceSection(sectionName: string): string {
  const guidance = loadGuidance();
  const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, "i");
  const match = guidance.match(regex);
  return match ? match[0].trim() : "";
}

/**
 * Build prompt with guidance injected.
 */
export function injectGuidance(prompt: string, sections?: string[]): string {
  let guidanceBlock: string;
  
  if (sections && sections.length > 0) {
    // Inject specific sections
    guidanceBlock = sections
      .map(s => getGuidanceSection(s))
      .filter(Boolean)
      .join("\n\n");
  } else {
    // Inject full guidance
    guidanceBlock = loadGuidance();
  }
  
  return `${guidanceBlock}\n\n---\n\n${prompt}`;
}

// Re-export TypeScript guidance for services that need structured data.
export * from "./core.js";
export * from "./logo.js";
export * from "./social.js";
export * from "./gfx.js";
export * from "./mascot.js";
