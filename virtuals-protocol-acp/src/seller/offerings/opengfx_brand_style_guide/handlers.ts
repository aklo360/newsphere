import { makeValidateRequirements, makeRequestPayment, makeExecuteJob } from "../shared_opengfx.js";

export const validateRequirements = makeValidateRequirements("brand_style_guide");
export const requestPayment = makeRequestPayment("Brand Style Guide", 25);
export const executeJob = makeExecuteJob("brand_style_guide");
