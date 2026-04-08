/**
 * OpenGFX x402 Test Client
 * 
 * Mimics the real customer flow:
 * 1. POST to endpoint → get 402
 * 2. Sign payment with wallet
 * 3. Retry with X-Payment header
 * 4. Poll for completion
 * 
 * Usage:
 *   npx tsx test/client.ts base logo "BrandName" "concept description"
 *   npx tsx test/client.ts solana socials "BrandName" "concept description"
 */

import { config } from "dotenv";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { Keypair, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

config();

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4022";

// ============================================================
// Base USDC Payment (using @x402/fetch)
// ============================================================

async function testBasePayment(service: "logo" | "socials", brandName: string, concept: string) {
  const privateKey = process.env.TEST_EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("TEST_EVM_PRIVATE_KEY not set in .env");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log(`\n🔵 Testing Base USDC payment`);
  console.log(`   Wallet: ${account.address}`);
  console.log(`   Service: ${service}`);
  console.log(`   Brand: "${brandName}"`);

  // Create wallet client for signing
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  });

  // Create x402-compatible signer (x402/evm expects .address at top level)
  const x402Signer = {
    address: account.address,
    signTypedData: (args: any) => walletClient.signTypedData(args),
  };

  // Create x402 client with EVM scheme (v2)
  const client = new x402Client()
    .register("eip155:8453", new ExactEvmScheme(x402Signer as any));

  // Wrap fetch with x402 payment handling
  const x402Fetch = wrapFetchWithPayment(fetch, client);

  console.log(`\n📤 Sending request to ${GATEWAY_URL}/v1/${service}...`);

  const response = await x402Fetch(`${GATEWAY_URL}/v1/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_name: brandName,
      concept: concept,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`\n✅ Payment accepted! Job created:`);
  console.log(JSON.stringify(result, null, 2));

  // Poll for completion
  if (result.jobId) {
    await pollForCompletion(result.jobId);
  }

  return result;
}

// ============================================================
// Solana SOL Payment (manual signing)
// ============================================================

async function testSolanaPayment(service: "logo" | "socials", brandName: string, concept: string) {
  const privateKey = process.env.TEST_SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("TEST_SOLANA_PRIVATE_KEY not set in .env");
  }

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  console.log(`\n🟣 Testing Solana SOL payment`);
  console.log(`   Wallet: ${keypair.publicKey.toBase58()}`);
  console.log(`   Service: ${service}`);
  console.log(`   Brand: "${brandName}"`);

  // Step 1: Get 402 response
  console.log(`\n📤 Getting payment requirements...`);
  const initialResponse = await fetch(`${GATEWAY_URL}/v1/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_name: brandName,
      concept: concept,
    }),
  });

  if (initialResponse.status !== 402) {
    throw new Error(`Expected 402, got ${initialResponse.status}`);
  }

  const paymentData = await initialResponse.json();
  const solOption = paymentData.options.solanaSol;
  
  console.log(`   Amount: ${solOption.amountFormatted}`);
  console.log(`   Pay to: ${solOption.payTo}`);

  // Step 2: Create and sign Solana transaction
  console.log(`\n🔐 Creating and signing transaction...`);
  
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const { blockhash } = await connection.getLatestBlockhash();
  
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: keypair.publicKey,
  }).add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(solOption.payTo),
      lamports: BigInt(solOption.amount),
    })
  );

  transaction.sign(keypair);
  const serializedTx = bs58.encode(transaction.serialize());

  // Step 3: Submit transaction to Solana
  console.log(`\n📡 Submitting transaction to Solana...`);
  const txHash = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log(`   TX: ${txHash}`);

  // Wait for confirmation
  console.log(`   Waiting for confirmation...`);
  await connection.confirmTransaction(txHash, "confirmed");
  console.log(`   ✅ Confirmed!`);

  // Step 4: Retry with payment proof
  console.log(`\n📤 Retrying with payment proof...`);
  
  const paymentPayload = {
    x402Version: 1,
    scheme: "exact",
    network: "solana:mainnet",
    payload: {
      authorization: {
        from: keypair.publicKey.toBase58(),
        to: solOption.payTo,
        value: solOption.amount,
        asset: "native",
      },
      txHash: txHash,
    },
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

  const response = await fetch(`${GATEWAY_URL}/v1/${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Payment": paymentHeader,
    },
    body: JSON.stringify({
      brand_name: brandName,
      concept: concept,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`\n✅ Payment verified! Job created:`);
  console.log(JSON.stringify(result, null, 2));

  // Poll for completion
  if (result.jobId) {
    await pollForCompletion(result.jobId);
  }

  return result;
}

// ============================================================
// Poll for job completion
// ============================================================

async function pollForCompletion(jobId: string, maxWaitMs = 600000) {
  console.log(`\n⏳ Polling for completion (job: ${jobId})...`);
  
  const startTime = Date.now();
  let lastStep = "";

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${GATEWAY_URL}/v1/jobs/${jobId}`);
    const job = await response.json();

    if (job.step && job.step !== lastStep) {
      console.log(`   Step: ${job.step}`);
      lastStep = job.step;
    }

    if (job.status === "completed") {
      console.log(`\n🎉 Job completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
      console.log(`\n📦 Results:`);
      if (job.logo) {
        console.log(`\n   Logo:`);
        Object.entries(job.logo).forEach(([k, v]) => console.log(`     ${k}: ${v}`));
      }
      if (job.socials) {
        console.log(`\n   Socials:`);
        Object.entries(job.socials).forEach(([k, v]) => console.log(`     ${k}: ${v}`));
      }
      return job;
    }

    if (job.status === "failed") {
      throw new Error(`Job failed: ${job.error}`);
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error(`Timeout waiting for job completion`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const [chain, service, brandName, concept] = process.argv.slice(2);

  if (!chain || !service || !brandName || !concept) {
    console.log(`
Usage:
  npx tsx test/client.ts <chain> <service> "<brand_name>" "<concept>"

Examples:
  npx tsx test/client.ts base logo "TestBrand" "AI agent platform"
  npx tsx test/client.ts solana socials "TestBrand" "AI agent platform"

Chains: base, solana
Services: logo, socials
`);
    process.exit(1);
  }

  if (chain !== "base" && chain !== "solana") {
    throw new Error(`Invalid chain: ${chain}. Use 'base' or 'solana'`);
  }

  if (service !== "logo" && service !== "socials") {
    throw new Error(`Invalid service: ${service}. Use 'logo' or 'socials'`);
  }

  try {
    if (chain === "base") {
      await testBasePayment(service, brandName, concept);
    } else {
      await testSolanaPayment(service, brandName, concept);
    }
  } catch (err) {
    console.error(`\n❌ Error:`, err);
    process.exit(1);
  }
}

main();
