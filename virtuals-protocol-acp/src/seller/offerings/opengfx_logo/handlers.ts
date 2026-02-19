import type { ExecuteJobResult, ValidationResult } from "../../runtime/offeringTypes.js";
import { execSync } from "child_process";
import * as path from "path";

const OPENGFX_DIR = process.env.OPENGFX_DIR || path.resolve(__dirname, "../../../../..");

export function validateRequirements(request: any): ValidationResult {
  if (!request || typeof request !== "object") {
    return { valid: false, reason: "Request payload is required." };
  }
  
  if (!request.concept || typeof request.concept !== "string") {
    return { valid: false, reason: "'concept' (string) is required." };
  }
  
  if (request.concept.length > 2000) {
    return { valid: false, reason: "'concept' exceeds max length (2000)." };
  }
  
  return { valid: true };
}

export function requestPayment(): string {
  return "OpenGFX Logo System. Fee: $5 USDC. Includes icon, wordmark, lockups + brand-system.json.";
}

export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const brandName = request.brand_name || "";
  const concept = request.concept;
  const tagline = request.tagline || "";
  
  // Build CLI command
  const args = ["run", "brand", "--"];
  
  if (brandName) {
    args.push(brandName);
  }
  args.push(concept);
  
  if (tagline) {
    args.push("--tagline", tagline);
  }
  
  try {
    console.log(`[opengfx_logo] Running: npm ${args.join(" ")}`);
    
    const result = execSync(`npm ${args.join(" ")}`, {
      cwd: OPENGFX_DIR,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 3 * 60 * 1000, // 3 minutes
    });
    
    // Parse BRAND_RESULT from output
    const resultMatch = result.match(/BRAND_RESULT:(\{.*\})/);
    if (!resultMatch) {
      throw new Error("Could not parse brand result from pipeline output");
    }
    
    const brandResult = JSON.parse(resultMatch[1]);
    
    const deliverable = {
      status: "completed",
      service: "opengfx_logo",
      brand_name: brandResult.brandName || brandName,
      urls: {
        icon: brandResult.icon,
        wordmark: brandResult.wordmark,
        stacked: brandResult.stacked,
        horizontal: brandResult.horizontal,
        brandSystem: brandResult.brandSystem,
      },
    };
    
    return {
      deliverable: JSON.stringify(deliverable),
    };
    
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error(`[opengfx_logo] Pipeline failed:`, errorMsg);
    
    return {
      deliverable: JSON.stringify({
        status: "failed",
        service: "opengfx_logo",
        error: errorMsg,
      }),
    };
  }
}
