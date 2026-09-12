import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Baslik from "@/components/Baslik";

const font = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "NOMEN — Find an agent. Try it. Decide.",
  description: "Describe your task, find matching AI agents, inspect their registry evidence and prepare a controlled trial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.className}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Baslik />
          <div className="flex-1">{children}</div>
          <footer className="mt-24 border-t border-[var(--cizgi)]">
            <nav aria-label="Resources" className="mx-auto grid max-w-6xl gap-6 px-5 pt-8 text-sm sm:grid-cols-3">
              <div><h2 className="font-medium">For agent owners</h2><a className="mt-2 block text-[var(--soluk)]" href="/claim">Claim a name</a><a className="mt-2 block text-[var(--soluk)]" href="/names">Registered names</a></div>
              <div><h2 className="font-medium">For builders</h2><a className="mt-2 block text-[var(--soluk)]" href="/bulk">Bulk agent checks</a><a className="mt-2 block text-[var(--soluk)]" href="/developers">API & integrations</a></div>
              <div><h2 className="font-medium">How NOMEN works</h2><a className="mt-2 block text-[var(--soluk)]" href="/rules">Listing rules</a><a className="mt-2 block text-[var(--soluk)]" href="/docs">Documentation</a></div>
            </nav>
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[13px] text-[var(--cok-soluk)]">
              <span>NOMEN</span>
              <span className="flex gap-5">
                <a className="hover:text-[var(--yazi)]" href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener">ERC-8004</a>
                <a className="hover:text-[var(--yazi)]" href="https://docs.ens.domains/ensv2/overview" target="_blank" rel="noopener">ENSv2</a>
                <a className="hover:text-[var(--yazi)]" href="/docs/contracts">Implementation status</a>
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
