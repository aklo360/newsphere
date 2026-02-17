import { config } from "dotenv";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

config();

const privateKey = process.env.TEST_EVM_PRIVATE_KEY;
console.log("Private key:", privateKey ? `${privateKey.slice(0, 10)}...` : "MISSING");

const account = privateKeyToAccount(privateKey as `0x${string}`);
console.log("Account address:", account.address);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

console.log("Wallet client account:", walletClient.account?.address);

const scheme = new ExactEvmScheme(walletClient);
console.log("Scheme created");
console.log("Scheme signer:", (scheme as any).signer);
