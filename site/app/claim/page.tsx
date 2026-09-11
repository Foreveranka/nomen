"use client";
import { Suspense, useMemo, useState } from "react";

const simdiSn = () => Math.floor(Date.now() / 1000);
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";
import { useDizin, useMerkle } from "@/lib/veri";
import { REGISTRAR_ABI, IDENTITY_ABI, REGISTRY_ABI } from "@/lib/registrar";
import { Rozet } from "@/components/AjanKart";
import { useQuery } from "@tanstack/react-query";
import { keccak256, toBytes } from "viem";
import { ELEME_EN } from "@/lib/veri";

type SahipCevap = { total: number; passing: number; agents: { agentId: number; status: string; passes: boolean; reason: string; name: string | null }[] };

export default function ClaimSayfasi() {
  return <Suspense><Claim /></Suspense>;
}

function Claim() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const arama = useSearchParams();
  const [agentId, setAgentId] = useState<string>(arama.get("agent") ?? "");
  const [label, setLabel] = useState("");
  const [simdi] = useState(simdiSn);
  const { veri } = useDizin(ag);
  const merkle = useMerkle(ag, z.isimTalebi);
  const parsedId = Number(agentId);
  const idN = /^\d+$/.test(agentId) && Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;

  /* Cüzdanın sahip olduğu, kurallardan geçmiş ajanlar (tarama verisinden) */
  const benimkiler = useMemo(() => {
    if (!veri || !address) return [];
    return veri.filter((a) => a.o && a.o.toLowerCase() === address.toLowerCase());
  }, [veri, address]);

  const kanit = merkle?.kanitlar[String(idN)] as `0x${string}`[] | undefined;
  const root = useReadContract({ abi: REGISTRAR_ABI, address: z.registrar ?? undefined, functionName: "eligibilityRoot", chainId: z.chainId, query: { enabled: !!z.registrar } });
  const uygun = !!kanit && !!root.data && root.data === merkle?.kok;

  const sahip = useReadContract({
    abi: IDENTITY_ABI, address: z.identity, functionName: "ownerOf", args: [BigInt(idN || 0)],
    chainId: z.chainId, query: { enabled: idN > 0 },
  });
  const sahipBenim = !!address && !!sahip.data && (sahip.data as string).toLowerCase() === address.toLowerCase();

  const mevcut = useReadContract({
    abi: REGISTRAR_ABI, address: z.registrar ?? undefined, functionName: "isNamed", args: [BigInt(idN || 0)],
    chainId: z.chainId, query: { enabled: !!z.registrar && idN > 0 },
  });

  /* Etiket müsait mi: alt registry'de getState(labelhash). status 0 = AVAILABLE. */
  const etiketGecerliOn = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(label);
  const durum = useReadContract({
    abi: REGISTRY_ABI, address: z.altRegistry ?? undefined, functionName: "getState",
    args: [etiketGecerliOn ? BigInt(keccak256(toBytes(label))) : BigInt(0)],
    chainId: z.chainId, query: { enabled: !!z.altRegistry && etiketGecerliOn },
  });
  const musait = durum.data ? durum.data.status === 0 || (durum.data.status === 2 && Number(durum.data.expiry) < simdi) : null;

  /* Cüzdanın TÜM ajanları (elenenler dahil), tarama verisinden */
  const benimHepsi = useQuery({
    queryKey: ["sahip", ag, address?.toLowerCase()],
    queryFn: async () => (await fetch(`/api/sahip?chain=${ag}&address=${address}`)).json() as Promise<SahipCevap>,
    enabled: !!address,
  }).data;

  const yaz = useWriteContract();
  const makbuz = useWaitForTransactionReceipt({ hash: yaz.data, chainId: z.chainId });
  const etiketGecerli = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(label);

  function talepEt() {
    if (!z.registrar || !kanit || !uygun || !sahipBenim || !etiketGecerli || musait !== true || mevcut.data?.[0] || chainId !== z.chainId) return;
    yaz.writeContract({ abi: REGISTRAR_ABI, address: z.registrar, functionName: "claim", args: [label, BigInt(idN), kanit], chainId: z.chainId });
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">{z.ad}</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Claim a name for your agent</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        A name under <span className="mono text-[var(--yazi)]">nomen-demo.eth</span> is issued to an agent that passed the last scan,
        to the wallet that owns it. It cannot be sold, it expires, and the operator can revoke it if the agent stops passing.
        Two things are checked onchain: that you own the agent, and that the agent is in the published scan.
      </p>

      {!z.isimTalebi && (
        <div className="kart-cizgili mt-8 p-6">
          <p className="text-[15px]">Names are claimed on Sepolia, where ENSv2 and the ERC-8004 registry sit on the same chain.</p>
          <p className="ince mt-1 text-[14px] text-[var(--soluk)]">Switch the network at the top right to Sepolia. Agents on {z.ad} are listed in the directory but cannot claim a name yet.</p>
        </div>
      )}

      {z.isimTalebi && (
        <div className="mt-8 space-y-4">
          <Adim n={1} baslik="Connect the wallet that owns the agent" tamam={isConnected}>
            {isConnected ? <span className="mono text-[13px] text-[var(--soluk)]">{address}</span> : <span className="text-[14px] text-[var(--soluk)]">Use the button at the top right.</span>}
            {isConnected && benimkiler.length > 0 && (
              <div className="mt-3">
                <div className="text-[13px] text-[var(--cok-soluk)]">Agents this wallet owns that passed the scan</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {benimkiler.map((a) => (
                    <button key={a.id} onClick={() => setAgentId(String(a.id))} className={`dugme text-[13px] ${String(a.id) === agentId ? "dugme-birincil" : ""}`}>{a.n || "unnamed"} · #{a.id}</button>
                  ))}
                </div>
              </div>
            )}
            {isConnected && benimHepsi && benimHepsi.agents.some((a) => !a.passes) && (
              <div className="mt-4 rounded-xl border border-[var(--cizgi)] p-4">
                <div className="text-[13px] text-[var(--cok-soluk)]">Your agents that did not pass, and why</div>
                <ul className="mt-2 divide-y divide-[var(--cizgi)] text-[13.5px]">
                  {benimHepsi.agents.filter((a) => !a.passes).slice(0, 12).map((a) => (
                    <li key={a.agentId} className="flex flex-wrap items-center gap-3 py-2">
                      <Link className="mono underline decoration-[var(--cizgi)] underline-offset-4" href={`/agent/${ag}/${a.agentId}`}>#{a.agentId}</Link>
                      <span className="truncate">{a.name || <span className="text-[var(--cok-soluk)]">unnamed</span>}</span>
                      <Rozet ton="kotu">{ELEME_EN[a.status] ?? a.status}</Rozet>
                    </li>
                  ))}
                </ul>
                <p className="ince mt-3 text-[12.5px] text-[var(--cok-soluk)]">Fix the metadata behind the record and it passes on the next scan. Nothing else is needed. See <Link className="underline" href="/docs/checks">the six checks</Link>.</p>
              </div>
            )}
            {isConnected && benimHepsi && benimHepsi.total === 0 && (
              <p className="mt-3 text-[13px] text-[var(--soluk)]">This wallet owns no ERC-8004 records on {z.ad} as of the last scan.</p>
            )}
          </Adim>

          <Adim n={2} baslik="Pick the agent" tamam={idN > 0 && uygun && sahipBenim}>
            <input value={agentId} onChange={(e) => setAgentId(e.target.value.replace(/\D/g, ""))} placeholder="ERC-8004 agent id" className="girdi max-w-xs" inputMode="numeric" />
            <div className="mt-3 flex flex-wrap gap-2">
              {idN > 0 && merkle && (uygun ? <Rozet ton="iyi">in the published scan</Rozet> : <Rozet ton="kotu">not in the published scan</Rozet>)}
              {idN > 0 && sahip.data != null && (sahipBenim ? <Rozet ton="iyi">owned by this wallet</Rozet> : <Rozet ton="kotu">owned by {(sahip.data as string).slice(0, 8)}…</Rozet>)}
              {idN > 0 && sahip.isError && <Rozet ton="kotu">could not read ownership on {z.ad}</Rozet>}
              {mevcut.data && mevcut.data[0] && <Rozet ton="bilgi">already named {mevcut.data[1]}.nomen-demo.eth</Rozet>}
            </div>
            {merkle && <p className="mono mt-3 text-[11px] text-[var(--cok-soluk)]">scan root {merkle.kok.slice(0, 18)}… · {merkle.sayi.toLocaleString("en-US")} eligible</p>}
          </Adim>

          <Adim n={3} baslik="Choose the label" tamam={etiketGecerli && musait === true}>
            <div className="flex items-center gap-2">
              <input value={label} onChange={(e) => setLabel(e.target.value.toLowerCase())} placeholder="build" className="girdi max-w-xs" />
              <span className="mono text-[15px] text-[var(--soluk)]">.nomen-demo.eth</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="ince text-[13px] text-[var(--cok-soluk)]">3 to 32 characters, lowercase letters, digits, hyphen.</p>
              {etiketGecerliOn && musait === true && <Rozet ton="iyi">{label}.nomen-demo.eth is available</Rozet>}
              {etiketGecerliOn && musait === false && <Rozet ton="kotu">{label}.nomen-demo.eth is taken</Rozet>}
            </div>
          </Adim>

          <Adim n={4} baslik="Claim" tamam={makbuz.isSuccess}>
            {!z.registrar ? (
              <p className="text-[14px] text-[var(--soluk)]">The registrar is not deployed on {z.ad} yet. The claim transaction is enabled as soon as it is.</p>
            ) : (
              <>
                {isConnected && chainId !== z.chainId && <button className="dugme" onClick={() => switchChain({ chainId: z.chainId })}>switch wallet to {z.ad}</button>}
                <button onClick={talepEt} disabled={!isConnected || !uygun || !sahipBenim || !etiketGecerli || musait !== true || !!mevcut.data?.[0] || chainId !== z.chainId || yaz.isPending || makbuz.isLoading} className="dugme dugme-koyu">
                  {yaz.isPending ? "confirm in wallet…" : makbuz.isLoading ? "waiting for the block…" : `claim ${label || "…"}.nomen-demo.eth`}
                </button>
                {yaz.error && <p className="mt-3 text-[13px] text-[var(--kirmizi)]">{(yaz.error as { shortMessage?: string }).shortMessage ?? yaz.error.message}</p>}
                {makbuz.isSuccess && (
                  <p className="mt-3 text-[14px]">
                    Transaction confirmed. Check the name records before using it. <a className="underline" href={`${z.tarayici}/tx/${yaz.data}`} target="_blank" rel="noopener">view the transaction</a> · <Link className="underline" href={`/agent/${ag}/${idN}`}>open the agent</Link>
                  </p>
                )}
              </>
            )}
          </Adim>
        </div>
      )}
    </main>
  );
}

function Adim({ n, baslik, tamam, children }: { n: number; baslik: string; tamam: boolean; children: React.ReactNode }) {
  return (
    <div className="kart-cizgili p-6">
      <div className="flex items-center gap-3">
        <span className={`grid h-7 w-7 place-items-center rounded-full text-[13px] ${tamam ? "bg-[var(--yesil)] text-white" : "bg-[var(--yuzey-2)] text-[var(--soluk)]"}`}>{tamam ? "✓" : n}</span>
        <h2 className="text-[17px]">{baslik}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
