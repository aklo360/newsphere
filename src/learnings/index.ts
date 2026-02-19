/**
 * OpenGFX Learnings Loader
 * 
 * Loads LEARNINGS.md at runtime and injects into prompts.
 * Edit LEARNINGS.md → change ALL future design outputs.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEARNINGS_PATH = path.join(__dirname, "LEARNINGS.md");

/**
 * Load learnings from LEARNINGS.md
 * Called at runtime — changes to file affect next generation
 */
export function loadLearnings(): string {
  try {
    return fs.readFileSync(LEARNINGS_PATH, "utf-8");
  } catch (err) {
    console.error("[learnings] Failed to load LEARNINGS.md:", err);
    return "";
  }
}

/**
 * Get a specific section from learnings
 */
export function getLearningsSection(sectionName: string): string {
  const learnings = loadLearnings();
  const regex = new RegExp(`## ${sectionName}[\\s\\S]*?(?=\\n## |$)`, "i");
  const match = learnings.match(regex);
  return match ? match[0].trim() : "";
}

/**
 * Build prompt with learnings injected
 */
export function injectLearnings(prompt: string, sections?: string[]): string {
  let learningsBlock: string;
  
  if (sections && sections.length > 0) {
    // Inject specific sections
    learningsBlock = sections
      .map(s => getLearningsSection(s))
      .filter(Boolean)
      .join("\n\n");
  } else {
    // Inject full learnings
    learningsBlock = loadLearnings();
  }
  
  return `${learningsBlock}\n\n---\n\n${prompt}`;
}

// Re-export TypeScript learnings for services that need structured data
export * from "./core.js";
export * from "./logo.js";
export * from "./social.js";
export * from "./gfx.js";
export * from "./mascot.js";
