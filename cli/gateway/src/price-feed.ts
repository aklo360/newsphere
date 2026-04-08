/**
 * Real-time Price Feeds
 * 
 * Fetches SOL/USD price from Pyth Network (primary) with CoinGecko fallback.
 * Caches price for 30 seconds to avoid rate limiting.
 */

// Pyth SOL/USD price feed ID
const PYTH_SOL_USD_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const PYTH_API = "https://hermes.pyth.network/api/latest_price_feeds";

// Cache
let cachedSolPrice: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Get SOL/USD price from Pyth Network
 */
async function fetchPythPrice(): Promise<number | null> {
  try {
    const response = await fetch(`${PYTH_API}?ids[]=${PYTH_SOL_USD_ID}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || !data[0]?.price) return null;

    const { price, expo } = data[0].price;
    // price * 10^expo = USD price
    const solPrice = Number(price) * Math.pow(10, expo);
    
    console.log(`[price-feed] Pyth SOL/USD: $${solPrice.toFixed(2)}`);
    return solPrice;
  } catch (err) {
    console.error(`[price-feed] Pyth error:`, err);
    return null;
  }
}

/**
 * Get SOL/USD price from CoinGecko (fallback)
 */
async function fetchCoinGeckoPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    if (!response.ok) return null;

    const data = await response.json();
    const solPrice = data?.solana?.usd;
    
    if (solPrice) {
      console.log(`[price-feed] CoinGecko SOL/USD: $${solPrice.toFixed(2)}`);
      return solPrice;
    }
    return null;
  } catch (err) {
    console.error(`[price-feed] CoinGecko error:`, err);
    return null;
  }
}

/**
 * Get current SOL/USD price (cached)
 */
export async function getSolPrice(): Promise<number> {
  const now = Date.now();
  
  // Return cached price if fresh
  if (cachedSolPrice && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedSolPrice;
  }

  // Try Pyth first
  let price = await fetchPythPrice();
  
  // Fallback to CoinGecko
  if (!price) {
    price = await fetchCoinGeckoPrice();
  }

  // Last resort: use cached price or default
  if (!price) {
    if (cachedSolPrice) {
      console.warn(`[price-feed] Using stale cached price: $${cachedSolPrice}`);
      return cachedSolPrice;
    }
    console.warn(`[price-feed] All feeds failed, using fallback: $100`);
    return 100; // Conservative fallback
  }

  // Update cache
  cachedSolPrice = price;
  cacheTimestamp = now;
  
  return price;
}

/**
 * Calculate SOL amount for a given USD price
 */
export async function usdToSol(usdAmount: number): Promise<{ 
  solAmount: number; 
  lamports: string; 
  solPrice: number;
}> {
  const solPrice = await getSolPrice();
  const solAmount = usdAmount / solPrice;
  const lamports = Math.ceil(solAmount * 1_000_000_000).toString();
  
  return { solAmount, lamports, solPrice };
}

/**
 * Pre-warm the cache on startup
 */
export async function initPriceFeed(): Promise<void> {
  console.log(`[price-feed] Initializing...`);
  const price = await getSolPrice();
  console.log(`[price-feed] Ready. SOL/USD: $${price.toFixed(2)}`);
}
