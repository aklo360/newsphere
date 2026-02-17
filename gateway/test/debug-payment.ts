import { config } from "dotenv";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

config();

const privateKey = process.env.TEST_EVM_PRIVATE_KEY!;
const account = privateKeyToAccount(privateKey as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

const x402Signer = {
  address: account.address,
  signTypedData: async (args: any) => {
    console.log("Signing typed data...");
    return await walletClient.signTypedData(args);
  },
};

const client = new x402Client()
  .register("eip155:8453", new ExactEvmScheme(x402Signer as any));

// Create a custom fetch that logs ALL headers
const loggingFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Handle Request objects
  let url: string;
  let headers: Record<string, string> = {};
  
  if (input instanceof Request) {
    url = input.url;
    input.headers.forEach((v, k) => headers[k] = v);
  } else {
    url = input.toString();
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => headers[k] = v);
      } else {
        headers = init.headers as Record<string, string>;
      }
    }
  }
  
  console.log(`\n>>> ${init?.method || "GET"} ${url}`);
  console.log("    Headers:", Object.keys(headers));
  if (headers["PAYMENT-SIGNATURE"]) {
    console.log("    PAYMENT-SIGNATURE:", headers["PAYMENT-SIGNATURE"].slice(0, 50) + "...");
  }
  if (headers["X-PAYMENT"]) {
    console.log("    X-PAYMENT:", headers["X-PAYMENT"].slice(0, 50) + "...");
  }
  
  const response = await fetch(input, init);
  console.log(`<<< ${response.status}`);
  return response;
};

const x402Fetch = wrapFetchWithPayment(loggingFetch, client);

console.log("\n=== Making request ===");
const response = await x402Fetch("http://localhost:4022/v1/logo", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    brand_name: "DebugTest",
    concept: "test",
  }),
});

console.log("\n=== Final Response ===");
console.log("Status:", response.status);
