import { makeValidateRequirements, makeRequestPayment, makeExecuteJob } from "../shared_opengfx.js";

export const validateRequirements = makeValidateRequirements("design_materials");
export const requestPayment = makeRequestPayment("Design Materials Kit", 30);
export const executeJob = makeExecuteJob("design_materials");
