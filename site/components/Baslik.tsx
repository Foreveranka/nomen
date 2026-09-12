"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useAg } from "@/app/providers";
import { AGLAR, AG_SIRASI } from "@/lib/aglar";

const MENU = [
  ["/workbench", "Find an agent"],
  ["/workbench#shortlist", "My shortlist"],
  ["/developers", "Developers"],
  ["/docs", "Docs"],
] as const;

export default function Baslik() {
  const yol = usePathname();
  const menu = yol === "/" ? [["/#how-it-works", "How it works"], ["/developers", "Developers"], ["/docs", "Docs"]] : MENU;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--cizgi)] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--lacivert)] text-[13px] font-semibold text-white">N</span>
            <span className="text-[17px] tracking-tight">NOMEN</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-4 text-[13px] text-[var(--soluk)] xl:flex">
            {menu.map(([h, ad]) => (
              <Link key={h} href={h} className={`hover:text-[var(--yazi)] ${yol === h || yol.startsWith(h + "/") ? "text-[var(--yazi)]" : ""}`}>{ad}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {yol === "/" ? <Link href="/workbench" className="dugme dugme-koyu">Open app →</Link> : <><AgSecici /><Cuzdan /></>}
        </div>
      </div>
      <nav aria-label="Main navigation" className="flex gap-5 overflow-x-auto whitespace-nowrap px-5 pb-3 text-[13px] text-[var(--soluk)] xl:hidden">
        {menu.map(([h, ad]) => (
          <Link key={h} href={h} className={yol === h ? "text-[var(--yazi)]" : ""}>{ad}</Link>
        ))}
      </nav>
    </header>
  );
}

function AgSecici() {
  const { ag, sec } = useAg();
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const kapat = (e: MouseEvent) => { if (!kutu.current?.contains(e.target as Node)) setAcik(false); };
    document.addEventListener("mousedown", kapat);
    return () => document.removeEventListener("mousedown", kapat);
  }, []);
  const a = AGLAR[ag];
  return (
    <div ref={kutu} className="relative">
      <button onClick={() => setAcik((v) => !v)} className="dugme flex items-center gap-2" aria-haspopup="listbox" aria-expanded={acik}>
        <span className={`h-2 w-2 rounded-full ${a.testnet ? "bg-[var(--sari)]" : "bg-[var(--yesil)]"}`} />
        <span>{a.ad}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-[var(--cok-soluk)]"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      {acik && (
        <ul role="listbox" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--cizgi)] bg-white p-1 shadow-lg">
          {AG_SIRASI.map((k) => {
            const z = AGLAR[k];
            return (
              <li key={k}>
                <button
                  role="option" aria-selected={k === ag}
                  onClick={() => {
                    sec(k);
                    setAcik(false);
                    if (isConnected && chainId !== z.chainId) switchChain({ chainId: z.chainId });
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[var(--yuzey)] ${k === ag ? "bg-[var(--yuzey)]" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${z.testnet ? "bg-[var(--sari)]" : "bg-[var(--yesil)]"}`} />
                    {z.ad}
                  </span>
                  <span className="mono text-[11px] text-[var(--cok-soluk)]">{z.chainId}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Cuzdan() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  if (isConnected && address) {
    return (
      <span className="flex items-center gap-1">
        <Link href="/profile" className="dugme dugme-birincil text-[13px]">Profile</Link>
        <button onClick={() => disconnect()} className="dugme mono text-[13px]" title="Disconnect">
          {address.slice(0, 6)}…{address.slice(-4)}
        </button>
      </span>
    );
  }
  const c = connectors[0];
  return (
    <button onClick={() => c && connect({ connector: c })} disabled={!c || isPending} className="dugme dugme-koyu">
      {isPending ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
