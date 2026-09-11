import { createConfig, http } from "wagmi";
import { injected } from "wagmi";
import { mainnet, sepolia } from "viem/chains";
import { arcTestnet } from "./aglar";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, arcTestnet],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http("https://ethereum-rpc.publicnode.com"),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
  },
  ssr: true,
});
