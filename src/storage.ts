/**
 * OpenGFX Storage Module — R2 Upload
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════
// R2 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const R2_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "00a8c9ab21697a428b993a6677b75649";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET || "opengfx-assets";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-156972f0e0f44d7594f4593dbbeaddcb.r2.dev";

// ═══════════════════════════════════════════════════════════════════
// S3 CLIENT (R2-compatible)
// ═══════════════════════════════════════════════════════════════════

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      throw new Error("R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables required");
    }
    
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

// ═══════════════════════════════════════════════════════════════════
// UPLOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString("hex");
  return `${timestamp}-${random}`;
}

/**
 * Upload a file to R2 and return the public URL
 */
export async function uploadToR2(
  filePath: string,
  key: string,
  contentType?: string
): Promise<string> {
  const client = getS3Client();
  const fileBuffer = fs.readFileSync(filePath);
  
  // Auto-detect content type if not provided
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };
  const mime = contentType || mimeTypes[ext] || "application/octet-stream";

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mime,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Upload a buffer directly to R2
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Upload all deliverables for a brand job
 */
export async function uploadBrandDeliverables(
  brandName: string,
  outputDir: string,
  jobId?: string
): Promise<{
  jobId: string;
  urls: {
    avatar?: string;
    banner?: string;
    brandSystem?: string;
    [key: string]: string | undefined;
  };
}> {
  const id = jobId || generateJobId();
  const prefix = `jobs/${id}/${brandName.toLowerCase().replace(/\s+/g, "-")}`;
  const urls: Record<string, string> = {};

  // Upload avatar if exists
  const avatarPath = path.join(outputDir, "socials/avatars/avatar-master.png");
  if (fs.existsSync(avatarPath)) {
    urls.avatar = await uploadToR2(avatarPath, `${prefix}/avatar.png`);
  }

  // Upload Twitter banner if exists
  const twitterBannerPath = path.join(outputDir, "socials/banners/twitter-banner.png");
  if (fs.existsSync(twitterBannerPath)) {
    urls.twitterBanner = await uploadToR2(twitterBannerPath, `${prefix}/twitter-banner.png`);
  }

  // Upload brand system JSON if exists
  const brandSystemPath = path.join(outputDir, "brand-system.json");
  if (fs.existsSync(brandSystemPath)) {
    urls.brandSystem = await uploadToR2(brandSystemPath, `${prefix}/brand-system.json`);
  }

  // Upload all platform avatars
  const avatarsDir = path.join(outputDir, "socials/avatars");
  if (fs.existsSync(avatarsDir)) {
    const avatarFiles = fs.readdirSync(avatarsDir).filter(f => f.endsWith(".png"));
    for (const file of avatarFiles) {
      if (file !== "avatar-master.png") {
        const platform = file.replace("-profile.png", "");
        urls[`avatar_${platform}`] = await uploadToR2(
          path.join(avatarsDir, file),
          `${prefix}/avatars/${file}`
        );
      }
    }
  }

  // Upload all banners
  const bannersDir = path.join(outputDir, "socials/banners");
  if (fs.existsSync(bannersDir)) {
    const bannerFiles = fs.readdirSync(bannersDir).filter(f => f.endsWith(".png"));
    for (const file of bannerFiles) {
      const platform = file.replace("-banner.png", "").replace("-banner-alt.png", "-alt");
      urls[`banner_${platform}`] = await uploadToR2(
        path.join(bannersDir, file),
        `${prefix}/banners/${file}`
      );
    }
  }

  return { jobId: id, urls };
}

// ═══════════════════════════════════════════════════════════════════
// CLI UPLOAD (for wrangler-based upload without S3 SDK)
// ═══════════════════════════════════════════════════════════════════

/**
 * Upload using wrangler CLI (no API keys needed if logged in)
 */
export async function uploadWithWrangler(
  filePath: string,
  key: string
): Promise<string> {
  const { execSync } = await import("child_process");
  
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".json": "application/json",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  execSync(
    `wrangler r2 object put ${R2_BUCKET}/${key} --file "${filePath}" --content-type "${contentType}" --remote`,
    { stdio: "pipe" }
  );

  return `${R2_PUBLIC_URL}/${key}`;
}
