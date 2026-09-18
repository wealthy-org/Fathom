import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodTestnet } from "@/lib/wallet/chains";

// ponytail: injected-only — Phantom EVM mode terdeteksi via EIP-6963.
// Tanpa WalletConnect = tanpa project ID / akun cloud.
export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  connectors: [injected()],
  transports: {
    [robinhoodTestnet.id]: http(),
  },
});
