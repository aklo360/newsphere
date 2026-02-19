import type { ExecuteJobResult, ValidationResult } from "../../runtime/offeringTypes.js";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

const OPENGFX_DIR = process.env.OPENGFX_DIR || path.resolve(__dirname, "../../../../..");

export function validateRequirements(request: any): ValidationResult {
  if (!request || typeof request !== "object") {
    return { valid: false, reason: "Request payload is required." };
  }
  
  if (!request.brand_name || typeof request.brand_name !== "string") {
    return { valid: false, reason: "'brand_name' (string) is required." };
  }
  
  // Must have either prompt OR master_url
  const hasPrompt = request.prompt && typeof request.prompt === "string";
  const hasMasterUrl = request.master_url && typeof request.master_url === "string";
  
  if (!hasPrompt && !hasMasterUrl) {
    return { valid: false, reason: "Either 'prompt' or 'master_url' is required." };
  }
  
  // If master_url provided, leg_count is required
  if (hasMasterUrl && !request.leg_count) {
    return { valid: false, reason: "'leg_count' is required when using 'master_url' (expression sheet mode)." };
  }
  
  return { valid: true };
}

export function requestPayment(): string {
  return "OpenGFX Mascot Generator. Fee: $10 USDC. Includes master pose + 5 expression variants.";
}

export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const brandName = request.brand_name;
  const prompt = request.prompt;
  const masterUrl = request.master_url;
  const creature = request.creature;
  const primaryColor = request.primary_color;
  const legCount = request.leg_count;
  const clawCount = request.claw_count || 2;
  
  // Build CLI command
  const args = ["run", "mascot", "--"];
  args.push("--name", brandName);
  
  if (masterUrl) {
    // Expression sheet mode
    args.push("--master-url", masterUrl);
    args.push("--leg-count", legCount.toString());
  } else if (prompt) {
    // Generate from prompt mode
    args.push("--prompt", prompt);
    if (legCount) args.push("--leg-count", legCount.toString());
  }
  
  if (creature) args.push("--creature", creature);
  if (primaryColor) args.push("--color", primaryColor);
  if (clawCount !== 2) args.push("--claw-count", clawCount.toString());
  
  try {
    console.log(`[opengfx_mascot] Running: npm ${args.join(" ")}`);
    
    const result = execSync(`npm ${args.join(" ")}`, {
      cwd: OPENGFX_DIR,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 5 * 60 * 1000, // 5 minutes
    });
    
    // Parse MASCOT_RESULT from output
    const resultMatch = result.match(/MASCOT_RESULT:(\{.*\})/);
    if (!resultMatch) {
      throw new Error("Could not parse mascot result from pipeline output");
    }
    
    const mascotResult = JSON.parse(resultMatch[1]);
    
    const deliverable = {
      status: "completed",
      service: "opengfx_mascot",
      brand_name: brandName,
      urls: mascotResult.urls || {},
      qc_passed: mascotResult.qcPassed ?? true,
      anatomy: mascotResult.anatomy || {},
    };
    
    return {
      deliverable: JSON.stringify(deliverable),
    };
    
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error(`[opengfx_mascot] Pipeline failed:`, errorMsg);
    
    return {
      deliverable: JSON.stringify({
        status: "failed",
        service: "opengfx_mascot",
        error: errorMsg,
        brand_name: brandName,
      }),
    };
  }
}
