/**
 * Generate a Base test wallet
 */

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log(`\n🔵 Generated Base test wallet:`);
console.log(`   Address: ${account.address}`);
console.log(`   Private key: ${privateKey}`);
console.log(`\n💰 Fund this wallet with:`);
console.log(`   • $5+ USDC on Base`);
console.log(`   • Tiny ETH for gas (~0.0001 ETH)`);
console.log(`\n📋 Add to .env:`);
console.log(`TEST_EVM_PRIVATE_KEY=${privateKey}`);
