import type { ExecuteJobResult, ValidationResult } from "../../runtime/offeringTypes.js";
import { execSync } from "child_process";
import * as path from "path";

const OPENGFX_DIR = process.env.OPENGFX_DIR || path.resolve(__dirname, "../../../../..");

export function validateRequirements(request: any): ValidationResult {
  if (!request || typeof request !== "object") {
    return { valid: false, reason: "Request payload is required." };
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
  return "OpenGFX Social Assets. Fee: $5 USDC. Includes avatar, Twitter banner, OG card, community banner.";
}

export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const brandSystemUrl = request.brand_system_url;
  const logoUrl = request.logo_url;
  const brandName = request.brand_name || "";
  const tagline = request.tagline || "";
  const primaryColor = request.primary_color;
  const secondaryColor = request.secondary_color;
  const renderStyle = request.render_style;
  
  // Build CLI command
  const args = ["run", "socials", "--"];
  
  if (brandSystemUrl) {
    args.push(brandSystemUrl);
  } else if (logoUrl) {
    args.push("--logo-url", logoUrl);
    args.push("--brand-name", brandName);
  }
  
  if (tagline) args.push("--tagline", tagline);
  if (primaryColor) args.push("--primary-color", primaryColor);
  if (secondaryColor) args.push("--secondary-color", secondaryColor);
  if (renderStyle) args.push("--render-style", renderStyle);
  
  try {
    console.log(`[opengfx_social] Running: npm ${args.join(" ")}`);
    
    const result = execSync(`npm ${args.join(" ")}`, {
      cwd: OPENGFX_DIR,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 3 * 60 * 1000,
    });
    
    // Parse SOCIALS_RESULT from output
    const resultMatch = result.match(/SOCIALS_RESULT:(\{.*\})/);
    if (!resultMatch) {
      throw new Error("Could not parse socials result from pipeline output");
    }
    
    const socialsResult = JSON.parse(resultMatch[1]);
    
    const deliverable = {
      status: "completed",
      service: "opengfx_social",
      brand_name: socialsResult.brandName || brandName,
      urls: {
        avatarMaster: socialsResult.avatarMaster,
        avatarAcp: socialsResult.avatarAcp,
        twitterBanner: socialsResult.twitterBanner,
        ogCard: socialsResult.ogCard,
        communityBanner: socialsResult.communityBanner,
      },
    };
    
    return {
      deliverable: JSON.stringify(deliverable),
    };
    
  } catch (err: any) {
    const errorMsg = err.message || "Unknown error";
    console.error(`[opengfx_social] Pipeline failed:`, errorMsg);
    
    return {
      deliverable: JSON.stringify({
        status: "failed",
        service: "opengfx_social",
        error: errorMsg,
      }),
    };
  }
}
