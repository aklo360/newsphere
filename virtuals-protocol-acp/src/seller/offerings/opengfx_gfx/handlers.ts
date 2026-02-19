import type { ExecuteJobResult, ValidationResult } from "../../runtime/offeringTypes.js";
import { execSync } from "child_process";
import * as path from "path";

const OPENGFX_DIR = process.env.OPENGFX_DIR || path.resolve(__dirname, "../../../../..");

export function validateRequirements(request: any): ValidationResult {
  if (!request || typeof request !== "object") {
    return { valid: false, reason: "Request payload is required." };
  }
  
  if (!request.prompt || typeof request.prompt !== "string") {
    return { valid: false, reason: "'prompt' (string) is required." };
  }
  
  const hasBrandSystem = request.brand_system_url && typeof request.brand_system_url === "string";
  const hasLogo = request.logo_url && typeof request.logo_url === "string";
  
  if (!hasBrandSystem && !hasLogo) {
    return { valid: false, reason: "Either 'brand_system_url' or 'logo_url' is required." };
  }
  
  if (hasLogo && !request.brand_name) {
    return { valid: false, reason: "'brand_name' is required when using 'logo_url' (BYOL mode)." };
  }
  
  return { valid: true };
}

export function requestPayment(): string {
  return "OpenGFX On-Brand Graphics. Fee: $2 USDC per graphic.";
}

export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const brandSystemUrl = request.brand_system_url;
  const logoUrl = request.logo_url;
  const brandName = request.brand_name || "";
  const prompt = request.prompt;
  const aspectRatio = request.aspect_ratio || "1:1";
  const primaryColor = request.primary_color;
  const renderStyle = request.render_style;
  
  // Build CLI command
  const args = ["run", "gfx", "--"];
  
  if (brandSystemUrl) {
    args.push("--brand-system", brandSystemUrl);
  } else if (logoUrl) {
    args.push("--logo-url", logoUrl);
    args.push("--brand-name", brandName);
  }
  
  args.push("--prompt", prompt);
  args.push("--aspect-ratio", aspectRatio);
  
  if (primaryColor) args.push("--primary-color", primaryColor);
  if (renderStyle) args.push("--render-style", renderStyle);
  
  try {
    console.log(`[opengfx_gfx] Running: npm ${args.join(" ")}`);
    
    const result = execSync(`npm ${args.join(" ")}`, {
      cwd: OPENGFX_DIR,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 2 * 60 * 1000, // 2 minutes
    });
    
    // Parse GFX_RESULT from output
    const resultMatch = result.match(/GFX_RESULT:(\{.*\})/);
    if (!resultMatch) {
      throw new Error("Could not parse gfx result from pipeline output");
    }
    
    const gfxResult = JSON.parse(resultMatch[1]);
    
    const deliverable = {
      status: "completed",
      service: "opengfx_gfx",
      brand_name: gfxResult.brandName || brandName,
      url: gfxResult.url,
      width: gfxResult.width,
      height: gfxResult.height,
      aspectRatio: gfxResult.aspectRatio || aspectRatio,
    };
    
    return {
      deliverable: JSON.stringify(deliverable),
    };
    
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error(`[opengfx_gfx] Pipeline failed:`, errorMsg);
    
    return {
      deliverable: JSON.stringify({
        status: "failed",
        service: "opengfx_gfx",
        error: errorMsg,
      }),
    };
  }
}
