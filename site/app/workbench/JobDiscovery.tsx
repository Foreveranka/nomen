"use client";
import { useState } from "react";
import Link from "next/link";
import type { Discovery } from "@/lib/discovery";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";

const examples = [
  {
    label: "Customer support",
    text: "I run an online store. I need an agent that answers order-status questions and escalates refund requests to a human. It must not issue refunds automatically.",
  },
  {
    label: "Contract review",
    text: "Find an agent that can review a Solidity contract for security issues, explain its findings and suggest tests. It should work with public code without access to my wallet.",
  },
  {
    label: "Market research",
    text: "Find an agent that compares competitors’ public websites, product features and prices with sources.",
  },
];
export default function JobDiscovery({
  onSelect,
  disabled,
}: {
  onSelect: (chain: AgAnahtar, agentId: number, request: string) => void;
  disabled: boolean;
}) {
  const [request, setRequest] = useState("");
  const [network, setNetwork] = useState("sepolia");
  const [result, setResult] = useState<Discovery | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function search() {
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, chain: network }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(data.error || "Could not complete this search.");
      setResult(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "AI matching is unavailable. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="agent-search" className="mb-12 scroll-mt-24" aria-label="Find agents for your work">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="rounded-2xl border border-[var(--cizgi)] bg-[var(--kagit)] p-5 sm:p-8"
      >
        <label htmlFor="job-request" className="text-xl">
          What would you like an agent to do?
        </label>
        <p id="job-help" className="mt-2 text-sm text-[var(--soluk)]">
          Describe the outcome, tools you use, and any constraints in English.
          {" "}<a href="#directory" className="underline">Or browse agents below ↓</a>
        </p>
        <textarea
          id="job-request"
          aria-describedby="job-help job-privacy"
          value={request}
          onChange={(e) => {
            setRequest(e.target.value);
            setResult(null);
          }}
          minLength={15}
          maxLength={500}
          required
          disabled={busy}
          rows={5}
          className="girdi mt-5 min-h-36 w-full resize-y text-base leading-relaxed"
          placeholder="I need an agent to… It should work with… It must not…"
        />
        <div
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Example requests"
        >
          {examples.map((e) => (
            <button
              type="button"
              disabled={busy}
              key={e.label}
              className="rounded-full border border-[var(--cizgi)] px-3 py-1.5 text-xs hover:bg-[var(--zemin)]"
              onClick={() => {
                setRequest(e.text);
                setResult(null);
              }}
            >
              {e.label} ↗
            </button>
          ))}
          <span className="ml-auto self-center text-xs text-[var(--soluk)]">
            {request.length}/500
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="text-sm">
            Search in
            <select
              disabled={busy}
              value={network}
              onChange={(e) => {
                setNetwork(e.target.value);
                setResult(null);
              }}
              className="girdi mt-2 block w-full sm:w-52"
            >
              <option value="all">All networks · mixed evidence</option>
              {Object.entries(AGLAR).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.ad}{(k === "sepolia" || k === "arc") ? " · live Graph evidence" : " · snapshot only"}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={busy || disabled || request.trim().length < 15}
            className="dugme dugme-koyu min-h-12 px-7"
          >
            {busy
              ? "Understanding your task & finding agents…"
              : "Find agents for this job →"}
          </button>
        </div>
        <p
          id="job-privacy"
          className="mt-4 text-xs leading-relaxed text-[var(--soluk)]"
        >
          Your text is sent to an AI provider to interpret the task and compare
          directory records and public registry history. Use public information; do not include passwords,
          keys or confidential documents. Recommendations do not execute tasks.
        </p>
        <p className="mt-2 text-xs text-[var(--soluk)]">Sepolia and Arc matching require fresh registry evidence from The Graph. Ethereum and Arbitrum Sepolia matching use published snapshots.</p>
      </form>
      <div aria-live="polite" aria-busy={busy}>
        {busy && (
          <p className="mt-5 text-sm">
            Reading your requirements, checking available live registry evidence, then
            comparing matching agents. This may take up to 45
            seconds.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4"
          >
            {error}
          </p>
        )}
        {result && (
          <div className="mt-7 space-y-6">
            <div>
              <h2 className="text-2xl">
                {result.matches.length
                  ? "Matching agents"
                  : result.registry.status === "stale" || result.registry.status === "unavailable"
                  ? "Matching paused"
                  : "No supported match yet"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--soluk)]">
                {result.conclusion}
              </p>
              <p className="mt-2 text-xs text-[var(--soluk)]">
                {result.searched.toLocaleString("en-US")} published records searched ·{" "}
                {result.considered} candidate descriptions compared by AI ·{" "}
                {new Date(result.generatedAt).toLocaleString("en-US")}
              </p>
            </div>
            <section className="rounded-xl border border-[var(--cizgi)] bg-[var(--kagit)] p-4 text-sm" aria-label="Registry evidence used by AI">
              <h3 className="font-medium">{result.registry.status === "live" ? "Live registry evidence used in matching" : "Registry evidence coverage"}</h3>
              <p className="mt-2 text-[var(--soluk)]">{result.registry.message}</p>
              {(result.registry.networks ?? []).map(network => <div key={network.chain} className="mt-4 border-t border-[var(--cizgi)] pt-3">
                <p className="font-medium">{AGLAR[network.chain].ad} · {network.status === "live" ? "Live evidence" : "Recommendations paused"}</p>
                <p className="mt-1 text-xs text-[var(--soluk)]">{network.scope}</p>
                {network.indexedBlock !== undefined && <p className="mt-2 text-xs text-[var(--soluk)]">The Graph · block {network.indexedBlock.toLocaleString("en-US")}{network.indexedAt ? ` · ${new Date(network.indexedAt).toLocaleString("en-US")}` : ""}</p>}
                <p className="mt-2 text-xs">{network.eligible} of {network.checked} candidates passed the registry evidence gate.</p>
                {network.status !== "live" && <p className="mt-2 text-sm">{network.message}</p>}
                {network.withheld.length > 0 && <details className="mt-3"><summary className="cursor-pointer">{network.withheld.length} candidates withheld before AI ranking</summary><ul className="mt-2 space-y-2">{network.withheld.map(item => <li key={item.key}><Link href={`/agent/${network.chain}/${item.key.split(":")[1]}`} className="underline">{item.key}</Link>: {item.reason}</li>)}</ul></details>}
              </div>)}
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              {result.matches.map((m, i) => (
                <article
                  key={m.key}
                  className="kart-cizgili flex min-w-0 flex-col p-6"
                >
                  <p className="text-xs text-[var(--soluk)]">
                    Candidate {i + 1} · {AGLAR[m.chain as AgAnahtar].ad} · #
                    {m.agentId}
                  </p>
                  <h3 className="mt-2 break-words text-xl">{m.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed">{m.reason}</p>
                  <p className="mt-3 text-xs text-[var(--soluk)]">{m.registryEvidence ? "Task fit + live Graph evidence" : "Snapshot match · no live registry check"}</p>
                  {m.registryEvidence && <div className="mt-3 text-sm"><p className="font-medium">Registry facts considered by AI</p><ul className="mt-2 list-disc space-y-1 pl-4 text-[var(--soluk)]">{m.registrySignals?.map(id => <li key={id}>{m.registryEvidence!.signals.find(s => s.id === id)?.text}</li>)}</ul><Link className="mt-2 inline-block text-xs underline" href={`/api/activity?chain=${m.chain}&agentId=${m.agentId}`}>View current indexed evidence →</Link></div>}
                  <details className="mt-4 text-sm text-[var(--soluk)]">
                    <summary className="cursor-pointer">Evidence &amp; unknowns</summary>
                    <blockquote className="mt-3 border-l-2 border-[var(--cizgi)] pl-3">“{m.evidenceQuote}”</blockquote>
                    {m.gaps.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4">{m.gaps.map((g, j) => <li key={j}>{g}</li>)}</ul>}
                  </details>
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
                    <button
                      disabled={disabled || busy}
                      className="dugme dugme-koyu"
                      onClick={() =>
                        onSelect(
                          m.chain as AgAnahtar,
                          m.agentId,
                          result.request,
                        )
                      }
                    >
                      Try this agent →
                    </button>
                    <Link
                      className="text-sm underline"
                      href={`/agent/${m.chain}/${m.agentId}`}
                    >
                      View record
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <p className="text-xs text-[var(--soluk)]">
              Capabilities come from published descriptions. Sepolia and Arc registry facts come from The Graph;
              neither proves task performance or current document contents. Try the agent before committing. Model:{" "}
              {result.model}.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
