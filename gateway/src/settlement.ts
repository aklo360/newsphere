/**
 * EIP-3009 Payment Settlement (Base USDC)
 * 
 * Executes the signed transferWithAuthorization on-chain
 * to actually transfer USDC from payer to OpenGFX wallet.
 */

import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

// EIP-3009 ABI for transferWithAuthorization
const USDC_ABI = parseAbi([
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function balanceOf(address account) view returns (uint256)",
  "function authorizationState(address authorizer, bytes32 nonce) view returns (bool)",
]);

interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string;
    };
    signature: string;
  };
}

interface SettlementResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// Parse signature into r, s, v components
function parseSignature(signature: string): { r: `0x${string}`; s: `0x${string}`; v: number } {
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature;
  
  const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
  const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
  const v = parseInt(sig.slice(128, 130), 16);
  
  return { r, s, v };
}

export async function settlePayment(
  paymentPayload: PaymentPayload,
  usdcAddress: string,
  networkMode: "mainnet" | "testnet"
): Promise<SettlementResult> {
  const privateKey = process.env.SETTLEMENT_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("[settlement] No private key configured for settlement");
    return { success: false, error: "No settlement key configured" };
  }

  const chain = networkMode === "mainnet" ? base : baseSepolia;
  
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  const auth = paymentPayload.payload.authorization;
  const { r, s, v } = parseSignature(paymentPayload.payload.signature);

  console.log(`[settlement] Executing transferWithAuthorization...`);
  console.log(`[settlement]   From: ${auth.from}`);
  console.log(`[settlement]   To: ${auth.to}`);
  console.log(`[settlement]   Value: ${Number(auth.value) / 1_000_000} USDC`);

  try {
    // Check if authorization has already been used
    const isUsed = await publicClient.readContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: "authorizationState",
      args: [auth.from as `0x${string}`, auth.nonce as `0x${string}`],
    });

    if (isUsed) {
      console.error("[settlement] Authorization nonce already used");
      return { success: false, error: "Authorization already used" };
    }

    // Check payer balance
    const balance = await publicClient.readContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [auth.from as `0x${string}`],
    });

    if (BigInt(balance) < BigInt(auth.value)) {
      console.error(`[settlement] Insufficient balance: ${balance} < ${auth.value}`);
      return { success: false, error: "Insufficient payer balance" };
    }

    // Execute the transfer
    const txHash = await walletClient.writeContract({
      address: usdcAddress as `0x${string}`,
      abi: USDC_ABI,
      functionName: "transferWithAuthorization",
      args: [
        auth.from as `0x${string}`,
        auth.to as `0x${string}`,
        BigInt(auth.value),
        BigInt(auth.validAfter),
        BigInt(auth.validBefore),
        auth.nonce as `0x${string}`,
        v,
        r,
        s,
      ],
    });

    console.log(`[settlement] ✅ Transaction submitted: ${txHash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "success") {
      console.log(`[settlement] ✅ Payment settled! Block: ${receipt.blockNumber}`);
      return { success: true, txHash };
    } else {
      console.error(`[settlement] Transaction reverted`);
      return { success: false, error: "Transaction reverted", txHash };
    }

  } catch (err) {
    console.error(`[settlement] Error:`, err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}
