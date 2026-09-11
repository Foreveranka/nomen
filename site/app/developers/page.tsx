"use client";
import { useState } from "react";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";

const ISTEMCI = `import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.KEY);
const fetchPaid = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:*", client: new ExactEvmScheme(account) }],
});

const r = await fetchPaid(
  "https://nomen.example/api/dogrula?chain=sepolia&agentId=1001"
);
const verdict = await r.json();
if (!verdict.passes) throw new Error(verdict.reason);`;

const CEVAP = `{
  "chain": "sepolia",
  "agentId": 1001,
  "status": "passes",
  "passes": true,
  "reason": "Passes every check in the published rule set.",
  "agent": {
    "name": "…", "type": "…", "description": "…",
    "owner": "0x…", "endpoints": ["https://…"],
    "category": "Altyapı/Servis",
    "metadata_source": "uzak",
    "metadata_hash": "SHA-256 of archived metadata bytes",
    "notes": []
  },
  "scan": { "highest_agent_id_seen": 10105, "agents_passing_on_this_chain": 1420 }
}`;

const KONTRAT = `(bool live, string memory label, uint64 expiry) = registrar.isNamed(agentId);
require(live, "agent has no live name");`;

export default function Gelistiriciler() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const [id, setId] = useState("2364");
  const [cevap, setCevap] = useState<string>("");
  async function dene() {
    setCevap("…");
    try {
      const r = await fetch(`/api/snapshot?chain=${ag}&agentId=${encodeURIComponent(id)}`);
      setCevap(JSON.stringify(await r.json(), null, 2));
    } catch { setCevap("Could not reach the API. Retry the request."); }
  }
  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">For agents and the people who run them</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Find agents. Inspect the evidence.</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        One request, one agent, one answer. The endpoint never says &ldquo;trustworthy&rdquo;; it says which of the six checks the
        record passed or failed, and why, so the caller decides. The snapshot API is free. A separate optional x402 endpoint demonstrates payments on Base Sepolia.
      </p>

      <section className="kart-cizgili mt-8 p-6">
        <h2 className="text-xl">Match a job, then check the selected record</h2>
        <pre className="mono mt-4 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-xs">{`const result = await fetch("/api/discover", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    request: "Find an agent for weather forecasts and air quality",
    chain: "all"
  })
});
if (!result.ok) throw new Error("Discovery unavailable");
const { matches } = await result.json(); // May be empty.
// Inspect a selected chain + agentId using POST /api/evaluate.`}</pre>
        <p className="mt-4 text-sm text-[var(--soluk)]">DeepSeek ranks published descriptions with short reasons. Sepolia and Arc candidates must pass live Graph ownership and URI checks; the AI also considers indexed feedback and change history, citing the facts used. English requests accept 15–500 characters. This does not execute the selected agent. The app prepares a local trial prompt for the user to run with the provider.</p>
        <a href="/docs/api" className="mt-3 inline-block text-sm underline">API fields, errors and limits →</a>
      </section>
      <section className="kart-cizgili mt-10 p-6">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Endpoint</h2>
        <pre className="mono mt-3 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-[13px]">GET /api/snapshot?chain={ag}&amp;agentId=&lt;id&gt;</pre>
        <p className="ince mt-3 text-[14px] text-[var(--soluk)]">chain is one of ethereum, sepolia, arc. Response is JSON.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input value={id} onChange={(e) => setId(e.target.value.replace(/\D/g, ""))} className="girdi max-w-[180px]" inputMode="numeric" />
          <button onClick={dene} className="dugme dugme-koyu">try it on {z.ad}</button>
        </div>
        {cevap && <pre className="mono mt-4 max-h-96 overflow-auto rounded-lg bg-[var(--lacivert)] p-4 text-[12px] leading-relaxed text-white">{cevap}</pre>}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="kart-cizgili p-6">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Optional payment example</h2>
          <pre className="mono mt-3 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-[12px] leading-relaxed">{ISTEMCI}</pre>
        </div>
        <div className="kart-cizgili p-6">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">Illustrative response (not a live record)</h2>
          <pre className="mono mt-3 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-[12px] leading-relaxed">{CEVAP}</pre>
          <p className="ince mt-3 text-[13px] text-[var(--soluk)]">A record that fails answers with status and reason and no agent block. An id without conclusive evidence answers not_scanned; failed registry reads answer rpc_error.</p>
        </div>
      </section>

      <section className="kart-cizgili mt-8 p-6">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">From a contract</h2>
        <p className="ince mt-3 text-[14px] text-[var(--soluk)]">The Sepolia registrar interface exposes a live-name check. The replacement contracts are verified on Sepolia under nomen-demo.eth, including a real claim and resolver reads. See <a href="/docs/contracts" className="underline">deployment status</a> before integrating.</p>
        <pre className="mono mt-3 overflow-x-auto rounded-lg bg-[var(--yuzey)] p-4 text-[12px] leading-relaxed">{KONTRAT}</pre>
      </section>
    </main>
  );
}
