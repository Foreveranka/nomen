"use client";
import { useState } from "react";
import type { Evaluation } from "@/lib/evaluation";
import { JOBS } from "@/lib/evaluation";
import { trialAccess, trialLink, trialPrompt } from "@/lib/trial";

export default function TryAgent({ report, now, expired }: { report: Evaluation; now: number; expired: boolean }) {
  const [sample, setSample] = useState("");
  const [message, setMessage] = useState("");
  const available = !expired && trialAccess(report, now);
  const prompt = trialPrompt(report.request || JOBS[report.job].sample, sample);
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setMessage("Copied. Paste it into the provider’s interface when you are ready."); }
    catch { setMessage("Copy was blocked by your browser. Select and copy the text below."); }
  }
  return <section aria-label="Try this agent" className="my-5 rounded-2xl border border-[var(--cizgi)] bg-[var(--kagit)] p-5 sm:p-6">
    <h2 className="text-2xl">Try {report.name}</h2>
    <p className="mt-2 text-sm text-[var(--soluk)]">Prepare a small trial here, then run it with the provider. Nothing is sent automatically.</p>
    <h3 className="mt-6 font-medium">1. Find where to try it</h3>
    {!available ? <p role="status" className="mt-3 rounded-lg bg-[var(--zemin)] p-4 text-sm">
      {expired ? "This check has expired. Recheck the agent before opening its service." : report.decision === "hold" ? "The evidence changed or failed. Review it before trying this agent." : "No usable service link was confirmed. Open the registry record to look for provider instructions, or choose another agent."}
    </p> : <div className="mt-3 space-y-3">{report.services.map(s => {
      const url = trialLink(s); if (!url) return null;
      const document = s.protocol === "A2A card" || s.protocol === "JSON document";
      return <div key={s.url} className="rounded-lg border border-[var(--cizgi)] p-3 text-sm">
        <p className="break-all text-[var(--soluk)]">{url}</p>
        <p className="my-2">{document ? "This is a service document, not a chat interface. Follow the provider’s connection instructions; an A2A or API client may be needed." : "This service responded to the check. It may be a website or API; a browser-based trial is not confirmed."}</p>
        {s.status === "auth_required" && <p className="mb-2">Provider sign-in or authorization is required.</p>}
        {s.status === "payment_required" && <p className="mb-2">The provider requires payment. Confirm the price before proceeding.</p>}
        <a className="underline" href={url} target="_blank" rel="noopener noreferrer">{document ? "Open service document ↗" : "Open provider endpoint ↗"}</a>
      </div>;
    })}</div>}
    <h3 className="mt-6 font-medium">2. Prepare a small trial</h3>
    <p className="mt-2 text-sm text-[var(--soluk)]">Use a few invented data rows, a short public text or a public test example. Confirm price and permissions with the provider.</p>
    <label className="mt-3 block text-sm">Public or synthetic sample
      <textarea className="girdi mt-2 min-h-24 w-full" value={sample} maxLength={2000} onChange={e => { setSample(e.target.value); setMessage(""); }} placeholder="Paste a small, non-confidential sample. This stays in your browser." />
    </label>
    <label className="mt-3 block text-sm">Your trial prompt
      <textarea readOnly value={prompt} className="girdi mt-2 min-h-48 w-full text-sm" />
    </label>
    <button className="dugme mt-3" onClick={() => void copy()}>Copy trial prompt</button>
    <p role="status" className="mt-2 text-sm">{message}</p>
    <h3 className="mt-6 font-medium">3. Judge the result</h3>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
      <li>Did it produce the output you asked for, using your sample?</li>
      <li>Can you verify its calculations, sources or other claims independently?</li>
      <li>Did it respect your limits on data access, cost and actions?</li>
    </ul>
    <p className="mt-3 text-sm text-[var(--soluk)]">Record your findings below. If it fails or cannot be accessed, return to the matches and try another agent.</p>
    <a href="#agent-search" className="mt-3 inline-block text-sm underline">Back to matches ↑</a>
  </section>;
}
