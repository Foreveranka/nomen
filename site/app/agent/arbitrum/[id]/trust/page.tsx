"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AgentTrustHistory from "@/components/AgentTrustHistory";
import { useAg } from "@/app/providers";

export default function AgentTrustPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agentId = Number(id);
  const { sec } = useAg();
  useEffect(() => { queueMicrotask(() => sec("arbitrum")); }, [sec]);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(agentId) || agentId < 1) notFound();
  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-10">
      <Link href={`/agent/arbitrum/${agentId}`} className="text-[13px] text-[var(--soluk)] hover:text-[var(--yazi)]">← Back to agent #{agentId}</Link>
      <div className="mt-6">
        <h1 className="baslik text-[36px] leading-tight sm:text-[44px]">Agent #{agentId}</h1>
        <p className="mono mt-1 text-[13px] text-[var(--cok-soluk)]">Arbitrum Sepolia · public evaluation receipts</p>
      </div>
      <AgentTrustHistory agentId={agentId} full />
    </main>
  );
}
