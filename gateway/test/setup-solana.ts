/**
 * Setup Solana test wallet
 * 1. Generate new keypair (or use existing)
 * 2. Transfer SOL from receiver wallet
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "dotenv";
import * as fs from "fs";

config();

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

async function main() {
  // Source wallet (receiver wallet with funds)
  const sourceKey = process.env.SOLANA_PRIVATE_KEY;
  if (!sourceKey) throw new Error("SOLANA_PRIVATE_KEY not set");
  
  const sourceKeypair = Keypair.fromSecretKey(bs58.decode(sourceKey));
  console.log(`Source wallet: ${sourceKeypair.publicKey.toBase58()}`);
  
  const sourceBalance = await connection.getBalance(sourceKeypair.publicKey);
  console.log(`Source balance: ${(sourceBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  // Generate new test wallet
  const testKeypair = Keypair.generate();
  const testPrivateKey = bs58.encode(testKeypair.secretKey);
  
  console.log(`\n🆕 Generated test wallet:`);
  console.log(`   Address: ${testKeypair.publicKey.toBase58()}`);
  console.log(`   Private key: ${testPrivateKey}`);

  // Transfer 0.07 SOL (enough for one $5 test + fees)
  const amount = 0.07 * LAMPORTS_PER_SOL;
  console.log(`\n📤 Transferring 0.07 SOL...`);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sourceKeypair.publicKey,
      toPubkey: testKeypair.publicKey,
      lamports: amount,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [sourceKeypair]);
  console.log(`✅ TX: ${sig}`);

  const newBalance = await connection.getBalance(testKeypair.publicKey);
  console.log(`\nTest wallet balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);

  // Output env line
  console.log(`\n📋 Add to .env:`);
  console.log(`TEST_SOLANA_PRIVATE_KEY=${testPrivateKey}`);
}

main().catch(console.error);
