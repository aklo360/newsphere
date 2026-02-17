/**
 * Solana Payment Settlement
 * 
 * Handles two types of Solana payments:
 * 1. Pre-signed transactions (signature field) - submit to network
 * 2. Already-sent transactions (txHash field) - verify on network
 */

import { 
  Connection, 
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

// Solana RPC endpoints
const SOLANA_RPC = {
  mainnet: "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

interface SolanaPaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    authorization: {
      from: string;
      to: string;
      value: string;
      asset?: string;
    };
    signature?: string; // Base58 encoded signed transaction
    txHash?: string;    // Already-sent transaction hash
  };
}

interface SettlementResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function settleSolanaPayment(
  paymentPayload: SolanaPaymentPayload,
  networkMode: "mainnet" | "devnet" = "mainnet"
): Promise<SettlementResult> {
  try {
    const connection = new Connection(SOLANA_RPC[networkMode], "confirmed");
    
    const auth = paymentPayload.payload.authorization;
    const isNative = auth.asset === "native" || auth.asset === "SOL";
    const amount = BigInt(auth.value);
    const displayAmount = isNative 
      ? `${(Number(amount) / LAMPORTS_PER_SOL).toFixed(6)} SOL`
      : `${(Number(amount) / 1_000_000).toFixed(2)} USDC`;

    console.log(`[solana-settlement] Processing payment...`);
    console.log(`[solana-settlement]   From: ${auth.from}`);
    console.log(`[solana-settlement]   To: ${auth.to}`);
    console.log(`[solana-settlement]   Value: ${displayAmount}`);
    console.log(`[solana-settlement]   Scheme: ${paymentPayload.scheme}`);

    // Case 1: Transaction already sent (solana-direct scheme from web UI)
    if (paymentPayload.payload.txHash) {
      const txHash = paymentPayload.payload.txHash;
      console.log(`[solana-settlement] Verifying existing TX: ${txHash}`);
      
      // Verify the transaction exists and is confirmed
      const tx = await connection.getTransaction(txHash, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      
      if (!tx) {
        return { success: false, error: "Transaction not found on chain" };
      }
      
      if (tx.meta?.err) {
        return { success: false, error: `Transaction failed: ${JSON.stringify(tx.meta.err)}`, txHash };
      }
      
      console.log(`[solana-settlement] ✅ TX verified: ${txHash}`);
      return { success: true, txHash };
    }

    // Case 2: Pre-signed transaction (from API clients)
    const signedTx = paymentPayload.payload.signature;
    
    if (!signedTx || signedTx.length < 100) {
      return { success: false, error: "Invalid or missing signed transaction" };
    }

    console.log(`[solana-settlement] Submitting pre-signed transaction...`);

    // Decode and submit the pre-signed transaction
    const txBuffer = bs58.decode(signedTx);
    const tx = Transaction.from(txBuffer);
    
    // Submit the transaction
    const txHash = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    
    console.log(`[solana-settlement] TX submitted: ${txHash}`);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(txHash, "confirmed");
    
    if (confirmation.value.err) {
      console.error(`[solana-settlement] TX failed:`, confirmation.value.err);
      return { success: false, error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`, txHash };
    }
    
    console.log(`[solana-settlement] ✅ Confirmed: ${txHash}`);
    return { success: true, txHash };

  } catch (err) {
    console.error(`[solana-settlement] Error:`, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}
