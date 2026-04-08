import type { ExecuteJobResult, ValidationResult } from "../runtime/offeringTypes.js";

type ServiceType = "logo_system" | "brand_style_guide" | "design_materials";

export function makeValidateRequirements(service: ServiceType) {
  return function validateRequirements(request: any): ValidationResult {
    if (!request || typeof request !== "object") {
      return { valid: false, reason: "Request payload is required." };
    }
    if (!request.brand_name || typeof request.brand_name !== "string") {
      return { valid: false, reason: "'brand_name' (string) is required." };
    }
    if (!request.brief || typeof request.brief !== "string") {
      return { valid: false, reason: "'brief' (string) is required." };
    }
    if (request.brief.length > 8000) {
      return { valid: false, reason: "'brief' exceeds max length (8000)." };
    }

    if (service === "design_materials") {
      if (!request.material_types || !Array.isArray(request.material_types) || request.material_types.length === 0) {
        return { valid: false, reason: "'material_types' (non-empty array) is required for design materials." };
      }
    }

    return { valid: true };
  };
}

export function makeRequestPayment(serviceLabel: string, fee: number) {
  return function requestPayment(): string {
    return `OpenGFX ${serviceLabel}. Fee: $${fee} USDC.`;
  };
}

export function makeExecuteJob(service: ServiceType) {
  return async function executeJob(request: any): Promise<ExecuteJobResult> {
    const deliverable = {
      status: "scaffold_ready",
      service,
      message: "OpenGFX offering scaffold is live. Pipeline wiring is pending.",
      received: {
        brand_name: request?.brand_name ?? null,
        brief: request?.brief ?? null,
        material_types: request?.material_types ?? [],
      },
      planned_outputs: [
        "brand-system.tokens.json",
        "figma.variables.json",
        "tokens-studio.json",
        "web.theme.json",
        "openvid-style-pack.json",
      ],
      next_step: "Wire OpenGFX generation pipeline and exporter adapters.",
    };

    return {
      deliverable: JSON.stringify(deliverable),
    };
  };
}
