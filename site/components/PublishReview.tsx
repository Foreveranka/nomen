"use client";
import Link from "next/link";
import type { EvidenceBundle } from "@/lib/evaluation-evidence";
export default function PublishReview({ bundle }: { bundle: EvidenceBundle }) {
  return <div className="mt-5 rounded-xl border border-[var(--cizgi)] p-5"><h3 className="font-medium">Public ratings have moved to complaint records</h3><p className="mt-2 text-sm">This evidence file remains verifiable. New public statements use the paid complaint workflow, with free updates and provider responses.</p><Link className="dugme mt-4" href={`/orders?chain=${bundle.chain}&agentId=${bundle.report.agentId}`}>Open Orders →</Link></div>;
}
