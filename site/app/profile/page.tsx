"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useAg } from "@/app/providers";

/** Bağlı cüzdanın kendi sayfası. Cüzdan yoksa bağlanmayı ister. */
export default function Profil() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { ag } = useAg();
  const router = useRouter();
  useEffect(() => { if (isConnected && address) router.replace(`/owner/${ag}/${address}`); }, [isConnected, address, ag, router]);
  const c = connectors[0];
  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-16">
      <h1 className="baslik text-[36px]">Your profile</h1>
      <p className="ince mt-3 text-[16px] text-[var(--soluk)]">Connect the wallet that owns your agents. You will see every ERC-8004 record it holds on the selected network, which ones pass, why the others do not, and the names it has claimed.</p>
      <button onClick={() => c && connect({ connector: c })} disabled={!c || isPending} className="dugme dugme-koyu mt-6">{isPending ? "Connecting…" : "Connect wallet"}</button>
    </main>
  );
}
