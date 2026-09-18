import { SiweMessage } from "siwe";
import { ROBINHOOD_TESTNET_CHAIN_ID } from "@/lib/wallet/chains";

export const SIWE_STATEMENT = "Sign in to Fathom to prove ownership of this wallet.";

export const SIWE_EXPIRY_MINUTES = 10;

/** Bangun pesan SIWE untuk address + nonce server. Domain = host aktif. */
export function buildSiweMessage(
  address: string,
  domain: string,
  uri: string,
  nonce: string,
): string {
  return new SiweMessage({
    domain,
    address,
    statement: SIWE_STATEMENT,
    uri,
    version: "1",
    chainId: ROBINHOOD_TESTNET_CHAIN_ID,
    nonce,
    expirationTime: new Date(
      Date.now() + SIWE_EXPIRY_MINUTES * 60_000,
    ).toISOString(),
  }).prepareMessage();
}
