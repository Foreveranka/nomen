"use client";
import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useReadContract, useReadContracts } from "wagmi";
import { keccak256, toBytes, namehash } from "viem";
import { AGLAR } from "@/lib/aglar";
import { REGISTRAR_ABI, REGISTRY_ABI, RESOLVER_ABI } from "@/lib/registrar";
import { Rozet } from "@/components/AjanKart";

const DURUM = ["available", "reserved", "registered"];

/** label.nomen-demo.eth profili. Her şey zincirden okunur: ENSv2 alt registry, registrar, resolver. */
export default function IsimSayfasi({ params }: { params: Promise<{ label: string }> }) {
  const { label: ham } = use(params);
  const label = ham.toLowerCase();
  const valid = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(label);
  const [simdi] = useState(() => Math.floor(Date.now() / 1000));
  const z = AGLAR.sepolia;
  const tam = `${label}.nomen-demo.eth`;
  const node = namehash(valid ? tam : "nomen-demo.eth");
  const identity7930 = "0x0001000003aa36a7148004a818bfb912233c491871b3d84c89a494bd9e";

  const durum = useReadContract({
    abi: REGISTRY_ABI, address: z.altRegistry!, functionName: "getState", args: [BigInt(keccak256(toBytes(label)))], chainId: z.chainId, query: { enabled: valid },
  });
  const resolverRead = useReadContract({ abi: REGISTRY_ABI, address: z.altRegistry!, functionName: "getResolver", args: [label], chainId: z.chainId, query: { enabled: valid } });
  const s = durum.data;
  const kayitli = !!s && s.status === 2;
  const suresiDolmus = kayitli && Number(s!.expiry) <= simdi;

  const ajan = useReadContract({
    abi: REGISTRAR_ABI, address: z.registrar ?? undefined, functionName: "agentOfTokenId", args: [s?.tokenId ?? BigInt(0)], chainId: z.chainId,
    query: { enabled: kayitli && !!z.registrar },
  });
  const agentId = ajan.data ? Number(ajan.data) : 0;

  const endorsement = useReadContract({ abi: REGISTRAR_ABI, address: z.registrar ?? undefined, functionName: "isNamed", args: [BigInt(agentId)], chainId: z.chainId, query: { enabled: kayitli && agentId > 0 && !!z.registrar } });
  const endorsed = endorsement.data?.[0] === true && endorsement.data[1] === label;
  const kayitlar = useReadContracts({
    contracts: [
      { abi: RESOLVER_ABI, address: resolverRead.data, functionName: "text", args: [node, `agent-registration[${identity7930}][${agentId}]`], chainId: z.chainId },
      { abi: RESOLVER_ABI, address: resolverRead.data, functionName: "text", args: [node, "agent-context"], chainId: z.chainId },
    ],
    query: { enabled: kayitli && agentId > 0 && !!resolverRead.data },
  });
  const [kayitReg, kayitCtx] = kayitlar.data ?? [];

  if (!valid) notFound();
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-10">
      <Link href="/names" className="text-[13px] text-[var(--soluk)] hover:text-[var(--yazi)]">← all names</Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">Sepolia · ENSv2</p>
          <h1 className="mono mt-2 text-[32px] sm:text-[40px]"><span className="text-[var(--yazi)]">{label}</span><span className="text-[var(--cok-soluk)]">.nomen-demo.eth</span></h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {durum.isLoading || durum.isError ? null : kayitli && !suresiDolmus ? <Rozet ton={endorsed ? "iyi" : "notr"}>{endorsed ? "endorsed" : "registered · endorsement unconfirmed"}</Rozet> : kayitli ? <Rozet ton="uyari">expired</Rozet> : <Rozet>{DURUM[s?.status ?? 0]}</Rozet>}
          {agentId > 0 && <Link href={`/agent/sepolia/${agentId}`}><Rozet ton="bilgi">agent #{agentId}</Rozet></Link>}
        </div>
      </div>

      {durum.isError && <p role="alert" className="mt-6">Could not read name status. Please retry.</p>}
      {agentId > 0 && <div className="mt-6 rounded-xl border border-[var(--cizgi)] p-5"><p>This name identifies an agent. It does not guarantee its current service quality.</p><Link className="dugme mt-3 inline-block" href={`/workbench?chain=sepolia&agentId=${agentId}`}>Check current evidence for your job →</Link></div>}
      {!durum.isLoading && !durum.isError && !kayitli && (
        <div className="kart-cizgili mt-8 p-6">
          <p className="text-[16px]">This name is not registered.</p>
          <p className="ince mt-1 text-[14px] text-[var(--soluk)]">It is issued only to an agent that passed the last scan, by the wallet that owns it.</p>
          <Link href="/claim" className="dugme dugme-birincil mt-4 inline-block">claim it</Link>
        </div>
      )}

      {kayitli && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="kart-cizgili p-6">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Ownership</h2>
            <dl className="mt-4 space-y-3 text-[14px]">
              <div><dt className="text-[var(--cok-soluk)]">owner</dt><dd className="mono break-all"><a className="underline decoration-[var(--cizgi)] underline-offset-4" href={`${z.tarayici}/address/${s!.latestOwner}`} target="_blank" rel="noopener">{s!.latestOwner}</a></dd></div>
              <div><dt className="text-[var(--cok-soluk)]">expires</dt><dd>{new Date(Number(s!.expiry) * 1000).toISOString().slice(0, 10)}{suresiDolmus ? " (expired)" : ""}</dd></div>
              <div><dt className="text-[var(--cok-soluk)]">transferable</dt><dd>no. The registrar withholds the transfer role; ENSv2 rejects transfers.</dd></div>
              <div><dt className="text-[var(--cok-soluk)]">revocable</dt><dd>yes, by the registrar, when the agent stops passing. Every revocation carries a reason onchain.</dd></div>
              <div><dt className="text-[var(--cok-soluk)]">token id</dt><dd className="mono break-all text-[12px]">{s!.tokenId.toString()}</dd></div>
            </dl>
          </div>
          <div className="kart-cizgili p-6">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Text records</h2>
            <p className="ince mt-2 text-[13px] text-[var(--soluk)]">ENSIP-25 ties the name to the registry record; ENSIP-26 describes the agent to anything that speaks ENS.</p>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="mono break-all text-[12px] text-[var(--cok-soluk)]">agent-registration[{identity7930}][{agentId}]</dt>
                <dd className="mono mt-0.5">{kayitReg?.status === "success" && kayitReg.result ? String(kayitReg.result) : <span className="text-[var(--cok-soluk)]">not written</span>}</dd>
              </div>
              <div>
                <dt className="mono text-[12px] text-[var(--cok-soluk)]">agent-context</dt>
                <dd className="mt-0.5">{kayitCtx?.status === "success" && kayitCtx.result ? String(kayitCtx.result) : <span className="text-[var(--cok-soluk)]">not written</span>}</dd>
              </div>
            </dl>
            <p className="ince mt-4 text-[12px] text-[var(--cok-soluk)]">node <span className="mono">{node}</span></p>
          </div>
        </div>
      )}

      {kayitli && (
        <div className="kart-cizgili mt-4 p-6">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Check it from a contract</h2>
          <pre className="mono mt-3 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-[12px] leading-relaxed">{`(bool live, string memory label, uint64 expiry) = NomenRegistrar(${z.registrar}).isNamed(${agentId});`}</pre>
        </div>
      )}
    </main>
  );
}
