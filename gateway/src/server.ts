/**
 * OpenGFX x402 Payment Gateway
 * 
 * Multi-chain AI brand design with x402 crypto payments.
 * Supports: Base (EVM) and Solana
 * 
 * Flow:
 * 1. POST /v1/logo (or /socials, /brand) → 402 with payment options
 * 2. Client chooses chain, signs payment, retries with X-Payment
 * 3. Server returns job ID immediately
 * 4. Client polls /v1/jobs/:id for completion
 * 
 * Pricing (matches ACP):
 * - Logo System: $5 (icon, wordmark, lockups, brand-system.json)
 * - Social Assets: $5 (avatar, banners)
 */

import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { spawn } from "child_process";
import path from "path";
import { createJob, getJob, updateJob, listJobs, listJobsByWallet, type Job, type JobType } from "./jobs.js";
import { settlePayment as settleEvmPayment } from "./settlement.js";
import { settleSolanaPayment } from "./settlement-solana.js";
import { getSolPrice, usdToSol, initPriceFeed } from "./price-feed.js";

config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4022;
const EVM_WALLET = process.env.WALLET_ADDRESS!;
const SOLANA_WALLET = process.env.SOLANA_WALLET_ADDRESS!;
const NETWORK_MODE = process.env.NETWORK_MODE || "mainnet";
const OPENGFX_PATH = process.env.OPENGFX_PATH || "..";

// Chain configurations (Base USDC + Solana SOL only)
const CHAINS = {
  base: {
    networkId: NETWORK_MODE === "mainnet" ? "eip155:8453" : "eip155:84532",
    name: "Base",
    asset: NETWORK_MODE === "mainnet" 
      ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
      : "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    assetSymbol: "USDC",
    decimals: 6,
    wallet: EVM_WALLET,
  },
  solanaSol: {
    networkId: NETWORK_MODE === "mainnet" ? "solana:mainnet" : "solana:devnet",
    name: "Solana",
    asset: "native",
    assetSymbol: "SOL",
    decimals: 9,
    wallet: SOLANA_WALLET,
  },
};

console.log(`
╔═══════════════════════════════════════════════════════════╗
║            OpenGFX x402 Multi-Chain Gateway               ║
╠═══════════════════════════════════════════════════════════╣
║  Mode:        ${NETWORK_MODE.padEnd(42)}║
║  Base:        ${EVM_WALLET?.slice(0, 20) || 'Not configured'}...                  ║
║  Solana:      ${SOLANA_WALLET?.slice(0, 20) || 'Not configured'}...                  ║
╚═══════════════════════════════════════════════════════════╝
`);

// Pricing (USD) — matches ACP pricing
const PRICING: Record<JobType, number> = {
  logo: 5,
  socials: 5,
  gfx: 2,
  mascot: 10,
};

// ============================================================
// API Documentation
// ============================================================

app.get("/", (req, res) => {
  res.json({
    service: "OpenGFX x402 Gateway",
    description: "AI-powered brand design with multi-chain crypto payments",
    version: "1.0.0",
    pricing: {
      logo: "$5 - Logo system (icon, wordmark, lockups)",
      socials: "$5 - Social assets (avatar, banners)",
      gfx: "$2 - On-brand marketing graphic",
      mascot: "$10 - Brand mascot/character with consistent poses",
    },
    supportedChains: [
      {
        chain: "Base",
        network: CHAINS.base.networkId,
        asset: "USDC",
        assetAddress: CHAINS.base.asset,
        payTo: CHAINS.base.wallet,
      },
      {
        chain: "Solana",
        network: CHAINS.solanaSol.networkId,
        asset: "SOL",
        assetMint: "native",
        payTo: CHAINS.solanaSol.wallet,
        note: "Amount calculated at current SOL/USD rate",
      },
    ],
    endpoints: {
      "GET /": "API documentation",
      "GET /health": "Health check",
      "GET /v1/pricing": "Pricing tiers",
      "POST /v1/logo": "Generate logo system (x402 payment required)",
      "POST /v1/socials": "Generate social assets (x402 payment required)",
      "POST /v1/gfx": "Generate on-brand marketing graphic (x402 payment required)",
      "POST /v1/mascot": "Generate brand mascot/character (x402 payment required)",
      "GET /v1/jobs/:id": "Check job status",
      "GET /v1/jobs": "List jobs (filter by wallet)",
    },
    flow: [
      "1. POST /v1/logo or /v1/socials → 402 with payment options",
      "2. Choose your chain (Base or Solana), sign payment",
      "3. Retry with X-Payment header → get {jobId, status: 'processing'}",
      "4. Poll GET /v1/jobs/:jobId until completed",
      "5. Get CDN URLs from response",
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "opengfx-gateway", 
    network: NETWORK_MODE,
    chains: ["base", "solana"],
  });
});

app.get("/v1/pricing", async (req, res) => {
  const solPrice = await getSolPrice();
  
  const tiers = await Promise.all(
    Object.entries(PRICING).map(async ([type, price]) => {
      const { solAmount, lamports } = await usdToSol(price);
      return {
        type,
        priceUsd: `$${price}`,
        usdc: (price * 1_000_000).toString(),
        sol: lamports,
        solAmount: solAmount.toFixed(6),
      };
    })
  );
  
  res.json({
    chains: {
      base: {
        network: CHAINS.base.networkId,
        asset: "USDC",
        assetAddress: CHAINS.base.asset,
        payTo: CHAINS.base.wallet,
        decimals: 6,
      },
      solanaSol: {
        network: CHAINS.solanaSol.networkId,
        asset: "SOL",
        assetMint: "native",
        payTo: CHAINS.solanaSol.wallet,
        decimals: 9,
        solPriceUsd: solPrice,
      },
    },
    tiers,
    solPriceUsd: solPrice,
    priceSource: "Pyth Network",
  });
});

// ============================================================
// Job Status
// ============================================================

app.get("/v1/jobs/:id", async (req, res) => {
  const job = await getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  
  const response: any = {
    jobId: job.id,
    type: job.type,
    status: job.status,
    brandName: job.brandName,
    createdAt: new Date(job.createdAt).toISOString(),
  };
  
  if (job.status === "processing") {
    response.message = "Brand assets are being generated...";
    response.step = job.step || "analyzing";
  } else if (job.status === "completed") {
    response.generationTimeSeconds = job.generationTimeSeconds;
    response.settlementTxHash = job.settlementTxHash;
    
    if (job.logoOutput) {
      response.logo = job.logoOutput;
    }
    if (job.socialsOutput) {
      response.socials = job.socialsOutput;
    }
    if (job.gfxOutput) {
      response.gfx = job.gfxOutput;
    }
    if (job.mascotOutput) {
      response.mascot = job.mascotOutput;
    }
  } else if (job.status === "failed") {
    response.error = job.error;
  }
  
  res.json(response);
});

app.get("/v1/jobs", async (req, res) => {
  try {
    const wallet = req.query.wallet as string | undefined;
    
    let jobs: Job[];
    if (wallet) {
      jobs = await listJobsByWallet(wallet);
    } else {
      jobs = listJobs().slice(0, 20);
    }
    
    const response = jobs.map(j => ({
      jobId: j.id,
      type: j.type,
      status: j.status,
      brandName: j.brandName,
      priceUsd: j.priceUsd,
      chain: j.chain,
      createdAt: new Date(j.createdAt).toISOString(),
      step: j.step,
      logoOutput: j.logoOutput,
      socialsOutput: j.socialsOutput,
      gfxOutput: j.gfxOutput,
      mascotOutput: j.mascotOutput,
      error: j.error,
    }));
    
    res.json({ jobs: response, wallet: wallet || null });
  } catch (err) {
    console.error("[jobs] List error:", err);
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// ============================================================
// Payment Handler (shared by all service endpoints)
// ============================================================

// Valid API keys for free internal/partner use
const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || "").split(",").map(k => k.trim()).filter(Boolean)
);

async function handlePaymentRequest(
  req: express.Request,
  res: express.Response,
  jobType: JobType,
  brandName: string,
  concept: string,
  options?: { 
    tagline?: string; 
    renderStyle?: string; 
    brandSystemPath?: string;
    gfxPrompt?: string;
    aspectRatio?: string;
    logoUrl?: string;
  }
) {
  const priceUsd = PRICING[jobType];
  const amountRaw = (priceUsd * 1_000_000).toString();

  // Check for API key bypass (free internal/partner use)
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && VALID_API_KEYS.has(apiKey)) {
    console.log(`[gateway] API key authenticated for ${jobType}: "${brandName}"`);
    
    // Create job directly without payment
    const job = await createJob(
      jobType,
      brandName,
      concept,
      0, // Free
      "api-key",
      `apikey:${apiKey.slice(0, 8)}...`,
      options
    );
    await updateJob(job.id, { status: "processing" });

    // Return immediately
    res.json({
      jobId: job.id,
      type: jobType,
      status: "processing",
      brandName,
      chain: "api-key",
      message: "Generation started (API key). Poll /v1/jobs/:jobId for status.",
      pollUrl: `https://gateway.opengfx.app/v1/jobs/${job.id}`,
    });

    // Generate in background
    generateAsync(job, null, "base", null);
    return;
  }

  // Accept both x-payment (legacy) and payment-signature (x402 v2)
  const paymentHeader = (req.headers["x-payment"] || req.headers["payment-signature"]) as string | undefined;

  if (!paymentHeader) {
    // Return 402 with ALL payment options
    const { solAmount, lamports, solPrice } = await usdToSol(priceUsd);
    
    console.log(`[gateway] 402: $${priceUsd} for ${jobType} (SOL @ $${solPrice.toFixed(2)} = ${solAmount.toFixed(6)} SOL)`);

    const paymentRequirements = {
      x402Version: 2,
      accepts: [
        // Base USDC (v2 format uses 'amount' not 'maxAmountRequired')
        {
          scheme: "exact",
          network: CHAINS.base.networkId,
          amount: amountRaw,
          resource: `https://gateway.opengfx.app/v1/${jobType}`,
          description: `Generate ${jobType} for "${brandName}"`,
          mimeType: "application/json",
          payTo: CHAINS.base.wallet,
          maxTimeoutSeconds: 600,
          asset: CHAINS.base.asset,
          // EIP-712 domain params for USDC on Base
          extra: {
            name: "USD Coin",
            version: "2",
          },
        },
        // Solana SOL
        {
          scheme: "exact",
          network: CHAINS.solanaSol.networkId,
          amount: lamports,
          resource: `https://gateway.opengfx.app/v1/${jobType}`,
          description: `Generate ${jobType} for "${brandName}"`,
          mimeType: "application/json",
          payTo: CHAINS.solanaSol.wallet,
          maxTimeoutSeconds: 600,
          asset: "native",
        },
      ],
      error: null,
    };

    const headerValue = Buffer.from(JSON.stringify(paymentRequirements)).toString("base64");

    // Return x402-compatible response
    // Body must have x402Version at root for @x402/fetch compatibility
    res.status(402)
      .set("X-Payment", headerValue)
      .set("PAYMENT-REQUIRED", headerValue)
      .json({
        // x402 standard fields (required for @x402/fetch)
        x402Version: 2,
        accepts: paymentRequirements.accepts,
        // Extra info for human-readable clients
        error: "Payment Required",
        service: jobType,
        brandName,
        price: `$${priceUsd}`,
        message: "Choose your payment method",
        options: {
          baseUsdc: {
            network: CHAINS.base.networkId,
            asset: "USDC",
            amount: amountRaw,
            amountFormatted: `${priceUsd} USDC`,
            payTo: CHAINS.base.wallet,
          },
          solanaSol: {
            network: CHAINS.solanaSol.networkId,
            asset: "SOL",
            amount: lamports,
            amountFormatted: `${solAmount.toFixed(6)} SOL`,
            payTo: CHAINS.solanaSol.wallet,
            solPriceUsd: solPrice,
          },
        },
      });
    return;
  }

  // Payment received
  console.log(`[gateway] Payment received for ${jobType}: "${brandName}"`);

  let paymentPayload: any;
  try {
    paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
  } catch {
    res.status(402).json({ error: "Invalid payment format" });
    return;
  }

  // Detect chain (Base USDC or Solana SOL)
  const network = paymentPayload.network || paymentPayload.payload?.network;
  const isSolana = network?.includes("solana");
  const chain = isSolana ? "solanaSol" : "base";
  
  const payerAddress = paymentPayload.payload?.authorization?.from;

  console.log(`[gateway] Chain: ${chain}, Payer: ${payerAddress?.slice(0, 20)}...`);

  // For Solana: settle immediately (blockhash expires in ~60s)
  let earlySettlement: { success: boolean; txHash?: string; error?: string } | null = null;
  if (chain === "solanaSol") {
    console.log(`[gateway] Settling Solana payment immediately...`);
    earlySettlement = await settleSolanaPayment(paymentPayload, NETWORK_MODE as any);
    
    if (!earlySettlement.success) {
      console.error(`[gateway] Solana payment failed: ${earlySettlement.error}`);
      res.status(402).json({ 
        error: "Payment failed", 
        details: earlySettlement.error,
      });
      return;
    }
    console.log(`[gateway] ✅ Solana payment confirmed: ${earlySettlement.txHash}`);
  }

  // Create job
  const job = await createJob(
    jobType,
    brandName,
    concept,
    priceUsd,
    chain,
    payerAddress || "unknown",
    options
  );
  await updateJob(job.id, { 
    status: "processing",
    settlementTxHash: earlySettlement?.txHash,
  });

  // Return immediately
  res.json({
    jobId: job.id,
    type: jobType,
    status: "processing",
    brandName,
    chain,
    paymentTxHash: earlySettlement?.txHash,
    message: "Generation started. Poll /v1/jobs/:jobId for status.",
    pollUrl: `https://gateway.opengfx.app/v1/jobs/${job.id}`,
  });

  // Generate in background
  generateAsync(job, paymentPayload, chain, earlySettlement);
}

// ============================================================
// Service Endpoints
// ============================================================

app.post("/v1/logo", async (req, res) => {
  try {
    const { brand_name, concept, tagline } = req.body;

    if (!brand_name || !concept) {
      res.status(400).json({ error: "Missing required fields: brand_name, concept" });
      return;
    }

    await handlePaymentRequest(req, res, "logo", brand_name, concept, { tagline });
  } catch (err) {
    console.error(`[gateway] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/socials", async (req, res) => {
  try {
    const { brand_name, concept, tagline, render_style, brand_system_url } = req.body;

    if (!brand_name || !concept) {
      res.status(400).json({ error: "Missing required fields: brand_name, concept" });
      return;
    }

    await handlePaymentRequest(req, res, "socials", brand_name, concept, { 
      tagline, 
      renderStyle: render_style,
      brandSystemPath: brand_system_url,
    });
  } catch (err) {
    console.error(`[gateway] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/gfx", async (req, res) => {
  try {
    const { 
      brand_name, 
      brand_system_url, 
      logo_url,
      prompt, 
      aspect_ratio,
      primary_color,
      secondary_color,
      background_color,
      render_style,
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Missing required field: prompt" });
      return;
    }

    if (!brand_system_url && !logo_url) {
      res.status(400).json({ error: "Either brand_system_url or logo_url is required" });
      return;
    }

    // For GFX, brand_name can be derived from brand_system or provided directly
    const brandName = brand_name || "Brand";
    const concept = prompt; // Use prompt as concept for job creation

    await handlePaymentRequest(req, res, "gfx", brandName, concept, { 
      gfxPrompt: prompt,
      aspectRatio: aspect_ratio || "1:1",
      brandSystemPath: brand_system_url,
      logoUrl: logo_url,
      renderStyle: render_style,
    });
  } catch (err) {
    console.error(`[gateway] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/v1/mascot", async (req, res) => {
  try {
    const { 
      brand_name, 
      brand_system_url, 
      logo_url,
      character_type,
      style,
      personality,
      features,
      poses,
      primary_color,
      secondary_color,
    } = req.body;

    if (!brand_system_url && !logo_url) {
      res.status(400).json({ error: "Either brand_system_url or logo_url is required" });
      return;
    }

    const brandName = brand_name || "Brand";
    const concept = `${character_type || "mascot"} character`;

    await handlePaymentRequest(req, res, "mascot", brandName, concept, { 
      brandSystemPath: brand_system_url,
      logoUrl: logo_url,
      characterType: character_type || "mascot",
      mascotStyle: style || "2d-flat",
      personality: personality || "friendly, approachable, modern",
      features: features || "",
      poses: poses || 3,
      primaryColor: primary_color,
      secondaryColor: secondary_color,
    });
  } catch (err) {
    console.error(`[gateway] Error:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// Background Generation
// ============================================================

async function generateAsync(
  job: Job, 
  paymentPayload: any, 
  chain: "base" | "solanaSol",
  earlySettlement?: { success: boolean; txHash?: string; error?: string } | null
) {
  const startTime = Date.now();
  
  console.log(`[generate] Starting job ${job.id}: ${job.type} for "${job.brandName}" (${chain})`);

  try {
    let result: any;
    
    if (job.type === "logo") {
      // Run logo pipeline
      await updateJob(job.id, { step: "analyzing" });
      result = await runBrandPipeline(job);
    } else if (job.type === "socials") {
      // Run socials pipeline (requires brand-system.json)
      await updateJob(job.id, { step: "avatar" });
      result = await runSocialsPipeline(job);
    } else if (job.type === "gfx") {
      // Run GFX pipeline (single graphic)
      await updateJob(job.id, { step: "generating" });
      result = await runGfxPipeline(job);
    } else if (job.type === "mascot") {
      // Run Mascot pipeline (character generation)
      await updateJob(job.id, { step: "designing" });
      result = await runMascotPipeline(job);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[generate] Job ${job.id} completed in ${elapsed.toFixed(1)}s`);

    // Settle EVM payment (Solana already settled)
    let settlement = earlySettlement;
    if (!settlement && chain === "base") {
      settlement = await settleEvmPayment(
        paymentPayload,
        CHAINS.base.asset,
        NETWORK_MODE as "mainnet" | "testnet"
      );
    }

    const finalSettlement = settlement || { success: false, error: "No settlement", txHash: undefined };

    if (finalSettlement.success) {
      console.log(`[generate] ✅ Job ${job.id} complete, paid on ${chain}: ${finalSettlement.txHash}`);
    } else {
      console.warn(`[generate] ⚠️ Job ${job.id} complete but payment failed: ${finalSettlement.error}`);
    }

    await updateJob(job.id, {
      status: "completed",
      logoOutput: result.logo,
      socialsOutput: result.socials,
      gfxOutput: result.gfx,
      mascotOutput: result.mascot,
      generationTimeSeconds: elapsed,
      settlementTxHash: finalSettlement.txHash,
      error: finalSettlement.success ? undefined : `Payment: ${finalSettlement.error}`,
    });

  } catch (err) {
    console.error(`[generate] Job ${job.id} failed:`, err);
    await updateJob(job.id, {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

interface BrandResult {
  logo: {
    icon: string;
    wordmark: string;
    stacked: string;
    horizontal: string;
    brandSystem: string;
  };
  brandSystemPath: string;
}

interface SocialsResult {
  avatarMaster: string;
  avatarAcp: string;
  twitterBanner: string;
  ogCard: string;
  communityBanner: string;
}

const PIPELINE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

function runBrandPipeline(job: Job): Promise<BrandResult> {
  return new Promise((resolve, reject) => {
    const opengfxDir = path.resolve(process.cwd(), OPENGFX_PATH);
    
    // Build args
    const args = [
      "run", "brand", "--",
      job.brandName,
      job.concept,
    ];
    
    if (job.tagline) {
      args.push("--tagline", job.tagline);
    }
    
    console.log(`[brand] Running: npm ${args.join(" ")}`);
    
    const proc = spawn("npm", args, { 
      cwd: opengfxDir, 
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Pipeline timed out after ${PIPELINE_TIMEOUT_MS / 1000}s`));
    }, PIPELINE_TIMEOUT_MS);
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n").filter((l: string) => l.trim())) {
        console.log(`  ${line}`);
        
        // Update job step based on log output
        if (line.includes("[1/5]") || line.includes("icon")) {
          updateJob(job.id, { step: "icon" });
        } else if (line.includes("[2/5]") || line.includes("wordmark")) {
          updateJob(job.id, { step: "wordmark" });
        } else if (line.includes("[3/5]") || line.includes("[4/5]") || line.includes("lockup")) {
          updateJob(job.id, { step: "lockups" });
        } else if (line.includes("[5/5]") || line.includes("style guide")) {
          updateJob(job.id, { step: "styleguide" });
        }
      }
    });
    
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        reject(new Error(`Brand pipeline failed: ${stderr.slice(-2000)}`));
        return;
      }
      
      // Upload outputs to CDN
      try {
        const brandSlug = job.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const outputDir = path.join(opengfxDir, "output", brandSlug);
        
        // Run upload script
        const uploadResult = await uploadOutputs(opengfxDir, outputDir, job.id, brandSlug, "logo");
        
        resolve({
          logo: uploadResult as unknown as BrandResult["logo"],
          brandSystemPath: path.join(outputDir, "brand-system.json"),
        });
      } catch (err) {
        reject(new Error(`Failed to upload outputs: ${err}`));
      }
    });
    
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn pipeline: ${err.message}`));
    });
  });
}

function runSocialsPipeline(job: Job, brandSystemPath?: string): Promise<SocialsResult> {
  return new Promise((resolve, reject) => {
    const opengfxDir = path.resolve(process.cwd(), OPENGFX_PATH);
    
    // Use provided brand system path or construct from brand name
    const brandSlug = job.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const bsPath = brandSystemPath || job.brandSystemPath || path.join(opengfxDir, "output", brandSlug, "brand-system.json");
    
    const args = ["run", "socials", "--", bsPath];
    
    console.log(`[socials] Running: npm ${args.join(" ")}`);
    
    const proc = spawn("npm", args, { 
      cwd: opengfxDir, 
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Pipeline timed out after ${PIPELINE_TIMEOUT_MS / 1000}s`));
    }, PIPELINE_TIMEOUT_MS);
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n").filter((l: string) => l.trim())) {
        console.log(`  ${line}`);
        
        if (line.includes("[1/2]") || line.includes("avatar")) {
          updateJob(job.id, { step: "avatar" });
        } else if (line.includes("[2/2]") || line.includes("banner")) {
          updateJob(job.id, { step: "banner" });
        } else if (line.includes("[3/3]") || line.includes("variant")) {
          updateJob(job.id, { step: "upload" });
        }
      }
    });
    
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        reject(new Error(`Socials pipeline failed: ${stderr.slice(-2000)}`));
        return;
      }
      
      // Upload outputs to CDN
      try {
        const outputDir = path.join(opengfxDir, "output", brandSlug, "socials");
        const uploadResult = await uploadOutputs(opengfxDir, outputDir, job.id, brandSlug, "socials");
        resolve(uploadResult as unknown as SocialsResult);
      } catch (err) {
        reject(new Error(`Failed to upload outputs: ${err}`));
      }
    });
    
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn pipeline: ${err.message}`));
    });
  });
}

interface GfxResult {
  gfx: {
    url: string;
    width: number;
    height: number;
    aspectRatio: string;
  };
}

function runGfxPipeline(job: Job): Promise<GfxResult> {
  return new Promise((resolve, reject) => {
    const opengfxDir = path.resolve(process.cwd(), OPENGFX_PATH);
    
    // Build args
    const args = ["run", "gfx", "--"];
    
    if (job.brandSystemPath) {
      args.push("--brand-system", job.brandSystemPath);
    } else if (job.logoUrl) {
      args.push("--logo-url", job.logoUrl);
      args.push("--brand-name", job.brandName);
    }
    
    args.push("--prompt", job.gfxPrompt || job.concept);
    args.push("--aspect-ratio", job.aspectRatio || "1:1");
    args.push("--job-id", job.id);
    
    console.log(`[gfx] Running: npm ${args.join(" ")}`);
    
    const proc = spawn("npm", args, { 
      cwd: opengfxDir, 
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Pipeline timed out after ${PIPELINE_TIMEOUT_MS / 1000}s`));
    }, PIPELINE_TIMEOUT_MS);
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n").filter((l: string) => l.trim())) {
        console.log(`  ${line}`);
      }
    });
    
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        reject(new Error(`GFX pipeline failed: ${stderr.slice(-2000)}`));
        return;
      }
      
      // Parse result from stdout
      const resultMatch = stdout.match(/GFX_RESULT:(\{.*\})/);
      if (!resultMatch) {
        reject(new Error("Could not parse GFX result"));
        return;
      }
      
      try {
        const localResult = JSON.parse(resultMatch[1]);
        const brandSlug = job.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        
        // Upload to CDN using wrangler directly for GFX
        const { execSync } = await import("child_process");
        const gfxKey = `${brandSlug}/gfx/${job.id}.png`;
        
        try {
          execSync(
            `wrangler r2 object put opengfx-assets/${gfxKey} --file "${localResult.path}" --content-type "image/png" --remote`,
            { cwd: opengfxDir, stdio: "pipe" }
          );
          console.log(`[gfx] Uploaded to CDN: ${gfxKey}`);
        } catch (uploadErr) {
          console.error(`[gfx] Upload failed:`, uploadErr);
        }
        
        resolve({
          gfx: {
            url: `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/${gfxKey}`,
            width: localResult.width,
            height: localResult.height,
            aspectRatio: localResult.aspectRatio,
          }
        });
      } catch (err) {
        reject(new Error(`Failed to process GFX result: ${err}`));
      }
    });
    
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn pipeline: ${err.message}`));
    });
  });
}

interface MascotResult {
  mascot: {
    master: string;
    wave: string;
    happy: string;
    sad: string;
    unhappy: string;
    laugh: string;
  };
}

// Standard mascot poses
const MASCOT_POSES = ["master", "wave", "happy", "sad", "unhappy", "laugh"];

function runMascotPipeline(job: Job): Promise<MascotResult> {
  return new Promise((resolve, reject) => {
    const opengfxDir = path.resolve(process.cwd(), OPENGFX_PATH);
    
    // Build args for mascot-v2
    const args = ["run", "mascot-v2", "--"];
    
    // Required args for mascot-v2
    args.push("--name", job.brandName);
    if (job.primaryColor) args.push("--color", job.primaryColor);
    if (job.characterType) args.push("--creature", job.characterType);
    if (job.mascotStyle) args.push("--style", job.mascotStyle);
    if (job.personality) args.push("--personality", job.personality);
    
    console.log(`[mascot] Running: npm ${args.join(" ")}`);
    
    const proc = spawn("npm", args, { 
      cwd: opengfxDir, 
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    
    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Mascot pipeline timed out after ${PIPELINE_TIMEOUT_MS / 1000}s`));
    }, PIPELINE_TIMEOUT_MS);
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      for (const line of text.split("\n").filter((l: string) => l.trim())) {
        console.log(`  ${line}`);
      }
    });
    
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", async (code) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        reject(new Error(`Mascot pipeline failed: ${stderr.slice(-2000)}`));
        return;
      }
      
      try {
        const brandSlug = job.brandName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        // Find latest mascot output dir
        const mascotBaseDir = path.join(opengfxDir, "output", brandSlug, "mascot");
        const dirs = fs.readdirSync(mascotBaseDir).filter(d => d.startsWith("202")).sort().reverse();
        const mascotDir = dirs.length > 0 ? path.join(mascotBaseDir, dirs[0]) : mascotBaseDir;
        
        const { execSync } = await import("child_process");
        
        const cdnBase = `https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev/${brandSlug}/mascot`;
        const uploads: { master: string; wave: string; happy: string; sad: string; unhappy: string; laugh: string } = {
          master: "",
          wave: "",
          happy: "",
          sad: "",
          unhappy: "",
          laugh: "",
        };
        
        // Upload all standard poses
        for (const pose of MASCOT_POSES) {
          const posePath = path.join(mascotDir, `${pose}.png`);
          if (fs.existsSync(posePath)) {
            execSync(`wrangler r2 object put opengfx-assets/${brandSlug}/mascot/${pose}.png --file "${posePath}" --content-type "image/png" --remote`, { cwd: opengfxDir, stdio: "pipe" });
            (uploads as any)[pose] = `${cdnBase}/${pose}.png`;
            console.log(`  ✓ ${pose}.png`);
          }
        }
        
        console.log(`[mascot] Uploaded ${MASCOT_POSES.length} poses to CDN`);
        
        resolve({ mascot: uploads });
      } catch (err) {
        reject(new Error(`Failed to process mascot result: ${err}`));
      }
    });
    
    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn pipeline: ${err.message}`));
    });
  });
}

async function uploadOutputs(
  opengfxDir: string, 
  outputDir: string, 
  jobId: string, 
  brandSlug: string,
  type: "logo" | "socials" | "gfx" | "mascot"
): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    console.log(`[upload] Running scripts/upload-job.ts ${type} ${brandSlug} ${jobId}`);
    
    const proc = spawn("npx", ["tsx", "scripts/upload-job.ts", type, brandSlug, jobId], {
      cwd: opengfxDir,
      stdio: ["pipe", "pipe", "pipe"],
    });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => { 
      const text = data.toString();
      stdout += text;
      // Log upload progress
      for (const line of text.split("\n").filter((l: string) => l.trim())) {
        console.log(`  ${line}`);
      }
    });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });
    
    proc.on("close", (code) => {
      if (code !== 0) {
        console.error(`[upload] Failed: ${stderr}`);
        reject(new Error(`Upload failed: ${stderr}`));
        return;
      }
      
      const match = stdout.match(/UPLOAD_RESULT:(\{.*\})/);
      if (!match) {
        console.error(`[upload] Could not parse result from: ${stdout}`);
        reject(new Error("Could not parse upload result"));
        return;
      }
      
      try {
        const result = JSON.parse(match[1]);
        // Extract the inner object (logo or socials)
        const urls = result.logo || result.socials || result;
        resolve(urls);
      } catch (err) {
        reject(new Error(`Failed to parse upload result: ${err}`));
      }
    });
  });
}

// ============================================================
// Start Server
// ============================================================

async function start() {
  await initPriceFeed();
  
  app.listen(PORT, () => {
    console.log(`[gateway] Listening on http://localhost:${PORT}`);
    console.log(`[gateway] Chains: Base USDC, Solana SOL`);
    console.log(`[gateway] Services: /v1/logo ($5), /v1/socials ($5)`);
  });
}

start().catch(console.error);
