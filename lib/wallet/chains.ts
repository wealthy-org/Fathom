import { defineChain } from "viem";

/** Robinhood Chain testnet — satu-satunya chain MVP. */
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ??
          "https://rpc.testnet.chain.robinhood.com",
      ],
    },
  },
});

export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;
