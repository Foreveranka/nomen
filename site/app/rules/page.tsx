"use client";
import Link from "next/link";
import { useAg } from "@/app/providers";
import { AGLAR } from "@/lib/aglar";
import { useOzet, useGizliOrnek, ELEME_EN } from "@/lib/veri";

const KURALLAR = [
  ["metadata URI is set", "A record minted with an empty URI describes nothing and cannot be called."],
  ["the document loads", "The URI resolved when the scan ran. One attempt, no retries; a link that needs luck is not a link."],
  ["the document is JSON", "It parses to an object. HTML error pages from parked domains fail here."],
  ["required fields are present", "ERC-8004 marks type, name and description as MUST. image is optional in practice and is not required here."],
  ["it is not a byte-identical copy", "Same metadata bytes as an earlier record. The lowest id in the snapshot is retained; this does not prove mint order."],
  ["the description states a purpose", "Keyboard noise and generated character cards cannot be classified or searched."],
];

export default function Kurallar() {
  const { ag } = useAg();
  const z = AGLAR[ag];
  const ozet = useOzet();
  const o = ozet?.zincirler[ag];
  const ornek = useGizliOrnek(ag);
  const sirali = o ? Object.entries(o.elenen).sort((a, b) => b[1] - a[1]) : [];

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12">
      <p className="text-[13px] uppercase tracking-[0.18em] text-[var(--cok-soluk)]">{z.ad}</p>
      <h1 className="baslik mt-2 text-[40px] leading-tight sm:text-[52px]">Six checks. Visible reasons.</h1>
      <p className="ince mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--soluk)]">
        Document checks and disclosed purpose heuristics help filter records. They do not certify safety or performance.
        Records remain onchain. Results can change after another scan is published. The rules,
        the published eligible set and Merkle proofs can be inspected. Exact rule replay additionally needs the archived inputs.
      </p>

      <ol className="mt-10 space-y-3">
        {KURALLAR.map(([b, a], i) => (
          <li key={b} className="kart flex gap-5 p-5">
            <span className="mono text-[13px] text-[var(--cok-soluk)]">{String(i + 1).padStart(2, "0")}</span>
            <div><div className="text-[16px]">{b}</div><div className="ince mt-1 text-[14px] text-[var(--soluk)]">{a}</div></div>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 text-[22px]">What that means on {z.ad}</h2>
      {o && (
        <div className="mt-5 space-y-2">
          {sirali.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <div className="mono w-24 text-right text-[14px]">{v.toLocaleString("en-US")}</div>
              <div className="h-6 rounded bg-[var(--mavi-pastel)]" style={{ width: `${Math.max(1.5, (v / o.toplam) * 70)}%` }} />
              <div className="text-[14px] text-[var(--soluk)]">{ELEME_EN[k] || k}</div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <div className="mono w-24 text-right text-[14px]">{o.gorunur.toLocaleString("en-US")}</div>
            <div className="h-6 rounded bg-[var(--yesil)]" style={{ width: `${Math.max(1.5, (o.gorunur / o.toplam) * 70)}%` }} />
            <div className="text-[14px]">pass</div>
          </div>
        </div>
      )}

      <h2 className="mt-14 text-[22px]">Two things that look like checks and are not</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="kart p-5"><div className="text-[15px]">Template families</div><p className="ince mt-1 text-[14px] text-[var(--soluk)]">The same description reused by many agents. A product deployed once per user is legitimate. Labelled, never hidden.</p></div>
        <div className="kart p-5"><div className="text-[15px]">No endpoint</div><p className="ince mt-1 text-[14px] text-[var(--soluk)]">An agent with no public address can still be real, and its reputation still counts. Labelled, never hidden.</p></div>
      </div>

      {ornek && (
        <>
          <h2 className="mt-14 text-[22px]">Examples of what was filtered <Link className="ml-2 text-[14px] font-normal text-[var(--soluk)] underline decoration-[var(--cizgi)] underline-offset-4" href="/filtered">full list, by reason</Link></h2>
          <div className="mt-5 space-y-6">
            {Object.entries(ornek).map(([sebep, liste]) => liste.length ? (
              <div key={sebep}>
                <div className="text-[13px] uppercase tracking-[0.14em] text-[var(--cok-soluk)]">{ELEME_EN[sebep] ?? sebep}</div>
                <ul className="mt-2 divide-y divide-[var(--cizgi)]">
                  {liste.slice(0, 4).map((r) => (
                    <li key={r.id} className="flex gap-4 py-2 text-[13px]">
                      <span className="mono w-16 shrink-0 text-[var(--cok-soluk)]">#{r.id}</span>
                      <span className="w-40 shrink-0 truncate">{r.name || <span className="text-[var(--cok-soluk)]">unnamed</span>}</span>
                      <span className="ince truncate text-[var(--soluk)]">{r.desc || "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null)}
          </div>
        </>
      )}
    </main>
  );
}
