"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { AG_SIRASI, type AgAnahtar } from "@/lib/aglar";

type AgBaglam = { ag: AgAnahtar; sec: (a: AgAnahtar) => void };
const Baglam = createContext<AgBaglam>({ ag: "sepolia", sec: () => {} });
export const useAg = () => useContext(Baglam);

const ANAHTAR = "nomen.ag";

function AgSaglayici({ children }: { children: React.ReactNode }) {
  /* İlk değer sunucuda "sepolia"; istemcide hidrasyondan sonra kayıtlı tercih okunur. */
  const [ag, setAg] = useState<AgAnahtar>("sepolia");
  useEffect(() => {
    let k: AgAnahtar | null = null;
    try { k = localStorage.getItem(ANAHTAR) as AgAnahtar | null; } catch {}
    if (k && AG_SIRASI.includes(k)) queueMicrotask(() => setAg(k as AgAnahtar));
  }, []);

  const deger = useMemo<AgBaglam>(() => ({
    ag,
    sec: (a) => {
      if (!AG_SIRASI.includes(a)) a = "sepolia";
      setAg(a);
      try { localStorage.setItem(ANAHTAR, a); } catch {}

    },
  }), [ag]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={qc}>
        <AgSaglayici>{children}</AgSaglayici>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { AG_SIRASI };
