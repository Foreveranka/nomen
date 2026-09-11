"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { AGLAR, AG_SIRASI, type AgAnahtar } from "@/lib/aglar";

type AgBaglam = { ag: AgAnahtar; sec: (a: AgAnahtar) => void };
const Baglam = createContext<AgBaglam>({ ag: "ethereum", sec: () => {} });
export const useAg = () => useContext(Baglam);

const ANAHTAR = "nomen.ag";

function AgSaglayici({ children }: { children: React.ReactNode }) {
  /* İlk değer sunucuda "ethereum"; istemcide hidrasyondan sonra kayıtlı tercih okunur. */
  const [ag, setAg] = useState<AgAnahtar>("ethereum");
  useEffect(() => {
    let k: AgAnahtar | null = null;
    try { k = localStorage.getItem(ANAHTAR) as AgAnahtar | null; } catch {}
    if (k && AGLAR[k]) queueMicrotask(() => setAg(k as AgAnahtar));
  }, []);

  const deger = useMemo<AgBaglam>(() => ({
    ag,
    sec: (a) => {
      setAg(a);
      try { localStorage.setItem(ANAHTAR, a); } catch {}

    },
  }), [ag]);

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>
        <AgSaglayici>{children}</AgSaglayici>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { AG_SIRASI };
