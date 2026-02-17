/**
 * Job Manager for Async Brand Generation
 * 
 * Uses Cloudflare Worker API for persistent storage (KV-backed).
 * Falls back to in-memory if API unavailable.
 */

const API_BASE = process.env.API_BASE_URL || "https://api.opengfx.app";

export type JobType = "logo" | "socials" | "brand";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface LogoOutput {
  icon: string;
  wordmark: string;
  stacked: string;
  horizontal: string;
  brandSystem: string;
}

export interface SocialsOutput {
  avatarMaster: string;
  avatarAcp: string;
  twitterBanner: string;
  ogCard: string;
  communityBanner: string;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  // Input
  brandName: string;
  concept: string;
  tagline?: string;
  renderStyle?: string;
  brandSystemPath?: string; // For socials jobs - path to existing brand-system.json
  // Wallet (for indexing)
  walletAddress: string;
  chain: string;
  priceUsd: number;
  // Timestamps
  createdAt: number;
  updatedAt: number;
  // Payment info
  settlementTxHash?: string;
  // Pipeline progress
  step?: "analyzing" | "icon" | "wordmark" | "lockups" | "styleguide" | "avatar" | "banner" | "upload";
  // Results
  logoOutput?: LogoOutput;
  socialsOutput?: SocialsOutput;
  generationTimeSeconds?: number;
  // Error
  error?: string;
}

// In-memory fallback (for when API is unreachable)
const localJobs = new Map<string, Job>();

export async function createJob(
  type: JobType,
  brandName: string,
  concept: string,
  priceUsd: number,
  chain: string,
  walletAddress: string,
  options?: {
    tagline?: string;
    renderStyle?: string;
    brandSystemPath?: string;
  }
): Promise<Job> {
  try {
    const response = await fetch(`${API_BASE}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        brandName,
        concept,
        priceUsd,
        chain,
        walletAddress: walletAddress.toLowerCase(),
        tagline: options?.tagline,
        renderStyle: options?.renderStyle,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const job = await response.json() as Job;
    
    // Also store locally for fast access during generation
    if (options?.brandSystemPath) {
      job.brandSystemPath = options.brandSystemPath;
    }
    localJobs.set(job.id, job);
    
    console.log(`[jobs] Created ${job.id} (${type}) for wallet ${walletAddress} (persisted)`);
    return job;
  } catch (err: any) {
    console.error(`[jobs] API create failed, using local: ${err.message}`);
    
    // Fallback to local
    const job: Job = {
      id: crypto.randomUUID(),
      type,
      status: "pending",
      brandName,
      concept,
      tagline: options?.tagline,
      renderStyle: options?.renderStyle,
      brandSystemPath: options?.brandSystemPath,
      priceUsd,
      chain,
      walletAddress: walletAddress.toLowerCase(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localJobs.set(job.id, job);
    console.log(`[jobs] Created ${job.id} (${type}) (local only)`);
    return job;
  }
}

export async function getJob(id: string): Promise<Job | undefined> {
  // Check local first (faster during active generation)
  const local = localJobs.get(id);
  if (local) return local;

  try {
    const response = await fetch(`${API_BASE}/api/jobs/${id}`);
    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error(`API error: ${response.status}`);
    }
    const job = await response.json() as Job;
    localJobs.set(job.id, job);
    return job;
  } catch (err: any) {
    console.error(`[jobs] API get failed: ${err.message}`);
    return undefined;
  }
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
  // Update local immediately
  const local = localJobs.get(id);
  if (local) {
    Object.assign(local, updates, { updatedAt: Date.now() });
    localJobs.set(id, local);
  }

  try {
    const response = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 404) return local;
      throw new Error(`API error: ${response.status}`);
    }

    const job = await response.json() as Job;
    localJobs.set(job.id, job);
    return job;
  } catch (err: any) {
    console.error(`[jobs] API update failed: ${err.message}`);
    return local;
  }
}

export async function listJobsByWallet(walletAddress: string): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE}/api/jobs?wallet=${walletAddress.toLowerCase()}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json() as { jobs: Job[] };
    return data.jobs;
  } catch (err: any) {
    console.error(`[jobs] API list failed: ${err.message}`);
    // Return local jobs for this wallet
    return Array.from(localJobs.values())
      .filter(j => j.walletAddress?.toLowerCase() === walletAddress.toLowerCase())
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

// Legacy function for backwards compatibility
export function listJobs(): Job[] {
  return Array.from(localJobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}
