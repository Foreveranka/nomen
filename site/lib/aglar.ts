import { defineChain } from "viem";
import { arbitrumSepolia, mainnet, sepolia } from "viem/chains";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

export type AgAnahtar = "ethereum" | "sepolia" | "arbitrum" | "arc";

export const AGLAR: Record<AgAnahtar, {
  anahtar: AgAnahtar; ad: string; kisa: string; chainId: number; testnet: boolean;
  identity: `0x${string}`; reputation: `0x${string}`; tarayici: string; nftYolu: string;
  /** User-signed trial receipt registry; null until a verified deployment is enabled. */
  evaluationRegistry: `0x${string}` | null;
  /** NomenRegistrar adresi; deploy edilmediyse boş. */
  registrar: `0x${string}` | null;
  /** nomen.eth'in ENSv2 alt registry'si ve isimlerin çözücüsü (yalnız isim talebi olan ağda). */
  altRegistry: `0x${string}` | null;
  resolver: `0x${string}` | null;
  /** NomenRegistrar'ın dağıtıldığı blok; isim listesi bu bloktan itibaren olayları okur. */
  registrarBlok: bigint;
  /** İsim talebi bu ağda mümkün mü (ENSv2 + ERC-8004 aynı zincirde). */
  isimTalebi: boolean;
}> = {
  ethereum: {
    anahtar: "ethereum", ad: "Ethereum", kisa: "ETH", chainId: mainnet.id, testnet: false,
    identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    reputation: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
    tarayici: "https://etherscan.io",
    nftYolu: "https://etherscan.io/nft/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432/",
    evaluationRegistry: (process.env.NEXT_PUBLIC_EVALUATION_REGISTRY_ETHEREUM as `0x${string}`) || null,
    registrar: null, altRegistry: null, resolver: null, registrarBlok: BigInt(0), isimTalebi: false,
  },
  sepolia: {
    anahtar: "sepolia", ad: "Sepolia", kisa: "SEP", chainId: sepolia.id, testnet: true,
    identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    tarayici: "https://sepolia.etherscan.io",
    nftYolu: "https://sepolia.etherscan.io/nft/0x8004A818BFB912233c491871b3d84c89A494BD9e/",
    evaluationRegistry: "0xEd3dFB7c561CEf35F51e9613f8E89dD821e16605",
    registrar: process.env.NEXT_PUBLIC_ENABLE_CLAIMS === "true" ? (process.env.NEXT_PUBLIC_REGISTRAR_SEPOLIA as `0x${string}`) || null : null,
    altRegistry: (process.env.NEXT_PUBLIC_SUBREGISTRY_SEPOLIA as `0x${string}`) || null, resolver: (process.env.NEXT_PUBLIC_RESOLVER_SEPOLIA as `0x${string}`) || null,
    registrarBlok: BigInt(process.env.NEXT_PUBLIC_REGISTRAR_BLOCK || "0"), isimTalebi: true,
  },
  arbitrum: {
    anahtar: "arbitrum", ad: "Arbitrum Sepolia", kisa: "ARB SEP", chainId: arbitrumSepolia.id, testnet: true,
    identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    tarayici: "https://sepolia.arbiscan.io",
    nftYolu: "https://sepolia.arbiscan.io/nft/0x8004A818BFB912233c491871b3d84c89A494BD9e/",
    evaluationRegistry: "0x33D6893fA6015EeecE1d9232A8D0659F42eF669e",
    registrar: null, altRegistry: null, resolver: null, registrarBlok: BigInt(0), isimTalebi: false,
  },
  arc: {
    anahtar: "arc", ad: "Arc Testnet", kisa: "ARC", chainId: arcTestnet.id, testnet: true,
    identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    tarayici: "https://testnet.arcscan.app",
    nftYolu: "https://testnet.arcscan.app/token/0x8004A818BFB912233c491871b3d84c89A494BD9e/instance/",
    evaluationRegistry: (process.env.NEXT_PUBLIC_EVALUATION_REGISTRY_ARC as `0x${string}`) || null,
    registrar: null, altRegistry: null, resolver: null, registrarBlok: BigInt(0), isimTalebi: false,
  },
};

export const AG_SIRASI: AgAnahtar[] = ["ethereum", "sepolia", "arbitrum", "arc"];

export function agFromChainId(id?: number): AgAnahtar | null {
  const b = AG_SIRASI.find((k) => AGLAR[k].chainId === id);
  return b ?? null;
}

export const VIEM_ZINCIRLER = [mainnet, sepolia, arbitrumSepolia, arcTestnet] as const;
