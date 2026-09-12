import { createConfig, createStorage, http } from "wagmi";
import { arbitrumSepolia, sepolia } from "viem/chains";
import { arcTestnet } from "./aglar";

export const wagmiConfig = createConfig({
  chains: [sepolia, arbitrumSepolia, arcTestnet],
  // Discover each wallet separately; window.ethereum can belong to another extension.
  multiInjectedProviderDiscovery: true,
  connectors: [],
  // Keep connections in this app session; never hydrate stale extension sessions.
  storage: createStorage({
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  }),
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
  ssr: true,
});
