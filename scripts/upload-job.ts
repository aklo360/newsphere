#!/usr/bin/env npx tsx
/**
 * Upload job outputs to R2
 * Usage: npx tsx scripts/upload-job.ts <type> <brandSlug> <jobId>
 */

import * as fs from "fs";
import * as path from "path";
import { uploadWithWrangler } from "../src/storage.js";

const OUTPUT_DIR = path.join(process.cwd(), "output");

interface UploadResult {
  logo?: {
    icon: string;
    wordmark: string;
    stacked: string;
    horizontal: string;
    brandSystem: string;
  };
  socials?: {
    avatarMaster: string;
    avatarAcp: string;
    twitterBanner: string;
    ogCard: string;
    communityBanner: string;
  };
}

async function uploadLogo(brandSlug: string, jobId: string): Promise<UploadResult["logo"]> {
  const brandDir = path.join(OUTPUT_DIR, brandSlug);
  const logoDir = path.join(brandDir, "logo");
  const prefix = `jobs/${jobId}/${brandSlug}`;
  
  const result: any = {};
  
  const files = [
    { file: "icon.png", key: "icon" },
    { file: "wordmark.png", key: "wordmark" },
    { file: "stacked.png", key: "stacked" },
    { file: "horizontal.png", key: "horizontal" },
  ];
  
  for (const { file, key } of files) {
    const fp = path.join(logoDir, file);
    if (fs.existsSync(fp)) {
      result[key] = await uploadWithWrangler(fp, `${prefix}/logo/${file}`);
      console.log(`  ✓ ${file}`);
    }
  }
  
  const bsPath = path.join(brandDir, "brand-system.json");
  if (fs.existsSync(bsPath)) {
    result.brandSystem = await uploadWithWrangler(bsPath, `${prefix}/brand-system.json`);
    console.log(`  ✓ brand-system.json`);
  }
  
  return result;
}

async function uploadSocials(brandSlug: string, jobId: string): Promise<UploadResult["socials"]> {
  const brandDir = path.join(OUTPUT_DIR, brandSlug);
  const socialsDir = path.join(brandDir, "socials");
  const avatarsDir = path.join(socialsDir, "avatars");
  const bannersDir = path.join(socialsDir, "banners");
  const prefix = `jobs/${jobId}/${brandSlug}`;
  
  const result: any = {};
  
  const avatarFiles = [
    { file: "avatar-master.png", key: "avatarMaster" },
    { file: "avatar-acp.jpg", key: "avatarAcp" },
  ];
  
  for (const { file, key } of avatarFiles) {
    const fp = path.join(avatarsDir, file);
    if (fs.existsSync(fp)) {
      result[key] = await uploadWithWrangler(fp, `${prefix}/socials/${file}`);
      console.log(`  ✓ ${file}`);
    }
  }
  
  const bannerFiles = [
    { file: "twitter-banner.png", key: "twitterBanner" },
    { file: "og-card.png", key: "ogCard" },
    { file: "community-banner.png", key: "communityBanner" },
  ];
  
  for (const { file, key } of bannerFiles) {
    const fp = path.join(bannersDir, file);
    if (fs.existsSync(fp)) {
      result[key] = await uploadWithWrangler(fp, `${prefix}/socials/${file}`);
      console.log(`  ✓ ${file}`);
    }
  }
  
  return result;
}

async function main() {
  const [type, brandSlug, jobId] = process.argv.slice(2);
  
  if (!type || !brandSlug || !jobId) {
    console.error("Usage: npx tsx scripts/upload-job.ts <logo|socials> <brandSlug> <jobId>");
    process.exit(1);
  }
  
  console.log(`Uploading ${type} for ${brandSlug} (job: ${jobId})...`);
  
  let result: UploadResult = {};
  
  if (type === "logo") {
    result.logo = await uploadLogo(brandSlug, jobId);
  } else if (type === "socials") {
    result.socials = await uploadSocials(brandSlug, jobId);
  } else {
    console.error(`Unknown type: ${type}`);
    process.exit(1);
  }
  
  // Output JSON for parsing
  console.log("UPLOAD_RESULT:" + JSON.stringify(result));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
