import { makeValidateRequirements, makeRequestPayment, makeExecuteJob } from "../shared_opengfx.js";

export const validateRequirements = makeValidateRequirements("logo_system");
export const requestPayment = makeRequestPayment("Logo System", 15);
export const executeJob = makeExecuteJob("logo_system");
