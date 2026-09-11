"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BOLUMLER = [
  ["/docs", "Overview"],
  ["/docs/evaluate", "Find & try an agent"],
  ["/docs/checks", "The six checks"],
  ["/docs/names", "Names on ENSv2"],
  ["/docs/api", "API reference"],
  ["/docs/contracts", "Contracts & addresses"],
  ["/docs/subgraph", "Subgraph"],
  ["/docs/reproduce", "Reproducing the scan"],
] as const;

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const yol = usePathname();
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-10 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="text-[12px] uppercase tracking-[0.16em] text-[var(--cok-soluk)]">Docs</div>
        <nav className="mt-3 flex gap-2 overflow-x-auto md:flex-col md:gap-0.5">
          {BOLUMLER.map(([h, ad]) => (
            <Link key={h} href={h} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[14px] ${yol === h ? "bg-[var(--yuzey)] text-[var(--yazi)]" : "text-[var(--soluk)] hover:text-[var(--yazi)]"}`}>{ad}</Link>
          ))}
        </nav>
      </aside>
      <article className="docs min-w-0 max-w-3xl">{children}</article>
    </main>
  );
}
