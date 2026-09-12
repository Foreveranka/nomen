"use client";

import PublishReview from "@/components/PublishReview";
import { useRef, useState } from "react";
import Link from "next/link";
import { parseEvidenceBundle, verifyEvidence, type EvidenceBundle } from "@/lib/evaluation-evidence";

type Receipt = Parameters<typeof verifyEvidence>[1] & { evaluationId: string; reviewer: string };
export default function EvidencePage() {
  const generation = useRef(0);
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [reviewer, setReviewer] = useState("");
  async function inspect(text: string) {
    const current = ++generation.current;
    setBundle(null); setVerified(false); setReviewer(""); setMessage("Checking the onchain receipt…");
    try {
      const data = parseEvidenceBundle(text);
      const context = new URLSearchParams(window.location.search);
      if (context.get("chain") && (data.chain !== context.get("chain") || String(data.report.agentId) !== context.get("agentId"))) throw new Error("This file belongs to a different agent or network.");
      const response = await fetch(`/api/evaluations/receipt?chain=${data.chain}&tx=${data.transactionHash}`);
      if (!response.ok) throw new Error("Onchain verification unavailable. Retry after confirmation.");
      const result = await response.json() as { receipts: Receipt[] };
      if (current !== generation.current) return;
      const match = result.receipts.find(r => (!context.get("id") || r.evaluationId === context.get("id")) && verifyEvidence(data, r));
      setBundle(data);
      if (!match) throw new Error("Evidence does not match the requested onchain receipt. Do not rely on this file.");
      setReviewer(match.reviewer); setVerified(true); setMessage("Both hashes match the onchain receipt.");
    } catch (error) { if (current !== generation.current) return; setMessage(error instanceof Error ? error.message : "Invalid evidence file."); }
  }
  return <main className="mx-auto max-w-3xl px-6 py-12"><Link href="/workbench" className="text-sm underline">Back to the app</Link><h1 className="mt-6 text-3xl">Verify trial evidence</h1><p className="mt-4 text-[var(--soluk)]">Ask the reviewer for their evidence JSON file. NOMEN checks its report and trial notes against the hashes recorded by their wallet. Files are read in your browser; only the chain and transaction ID are sent for verification.</p><p className="mt-3 text-sm text-[var(--soluk)]">A matching hash proves the contents were committed by that wallet. It does not prove the trial happened or the outcome is accurate. Files stay local during this check. Publishing a review below is a separate, explicit choice.</p><label className="mt-6 block">Open evidence file (up to 64 KB)<input className="mt-2 block" type="file" accept="application/json,.json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 64000) { generation.current++; setBundle(null); setVerified(false); setMessage("Evidence file exceeds 64 KB."); return; } await inspect(await file.text()); }} /></label><p role="status" className="mt-6">{message}</p>{verified && bundle && <section className="kart-cizgili mt-6 space-y-4 p-6"><h2 className="text-xl">{bundle.report.name} · {bundle.evidence.outcome}</h2><p className="break-all text-xs">Reviewer: {reviewer}</p>{bundle.evidence.rating !== undefined && <p className="text-lg">Reviewer’s rating: <strong>{bundle.evidence.rating}/10</strong></p>}<h3>Task</h3><p>{bundle.report.request || bundle.report.job}</p><h3>Trial notes</h3><p className="whitespace-pre-wrap break-words">{bundle.evidence.note}</p><h3>Checked criteria</h3><ul className="list-disc pl-5">{bundle.evidence.checklist.map((item, i) => <li key={i}>{item}</li>)}</ul><details><summary>Full committed report</summary><pre className="overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(bundle.report, null, 2)}</pre></details><PublishReview key={bundle.transactionHash + bundle.evidence.note} bundle={bundle} /></section>}</main>;
}
