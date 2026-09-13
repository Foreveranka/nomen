"use client";
import Link from "next/link";
import type { Ajan } from "@/lib/veri";
import { KAT_EN, etiketMetni } from "@/lib/veri";

export function Rozet({ ton = "notr", children }: { ton?: "notr" | "iyi" | "uyari" | "bilgi" | "kotu"; children: React.ReactNode }) {
  return <span className={`rozet ${ton !== "notr" ? "rozet-" + ton : ""}`}>{children}</span>;
}

export default function AjanKart({ a }: { a: Ajan }) {
  const etiketler = a.e.filter((e) => !e.startsWith("alan_yazimi:")).slice(0, 2);
  return (
    <Link href={`/agent/${a.z}/${a.id}`} className="kart block p-5 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[16px]">{a.n || <span className="text-[var(--cok-soluk)]">unnamed</span>}</div>
          <div className="mono mt-0.5 text-[11px] text-[var(--cok-soluk)]">#{a.id}</div>
        </div>
        {a.s > 0 ? <Rozet>endpoint declared</Rozet> : <Rozet>no endpoint</Rozet>}
      </div>
      <p className="ince mt-2 line-clamp-2 text-[14px] leading-relaxed text-[var(--soluk)]">{a.d}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.k && <Rozet ton="bilgi">{KAT_EN[a.k] || a.k}</Rozet>}
        {etiketler.map((e) => { const m = etiketMetni(e); return <Rozet key={e} ton={m.ton === "bilgi" ? "bilgi" : m.ton === "uyari" ? "uyari" : "notr"}>{m.metin}</Rozet>; })}
      </div>
    </Link>
  );
}
