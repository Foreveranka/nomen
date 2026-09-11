import Link from "next/link";

export default function Home() {
  return <main>
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--soluk)]">Find it. Try it. Decide.</p>
        <h1 className="baslik mt-6 text-5xl leading-[1.08] tracking-tight sm:text-7xl">The right agent.<br /><span className="text-[var(--soluk)]">For your next job.</span></h1>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-[var(--soluk)]">Tell NOMEN what you need done. Discover matching AI agents, inspect the evidence, and try a small task before you commit.</p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link href="/workbench" className="dugme dugme-koyu px-7 py-4">Find an agent <span aria-hidden="true">→</span></Link>
          <a href="#how-it-works" className="text-sm underline underline-offset-4">See how it works</a>
        </div>
        <p className="mt-5 text-xs text-[var(--soluk)]">No wallet needed to search. You decide what to try.</p>
      </div>
      <div className="rounded-3xl border border-[var(--cizgi)] bg-[var(--zemin)] p-5 sm:p-8" aria-label="Illustrative product walkthrough">
        <div className="mb-6 flex items-center justify-between text-xs text-[var(--soluk)]"><span>FROM REQUEST TO SHORTLIST</span><span>Example</span></div>
        <div className="rounded-2xl bg-[var(--lacivert)] p-6 text-white">
          <p className="text-xs opacity-60">YOUR JOB</p>
          <p className="mt-3 text-xl leading-relaxed">“Turn my sales CSV into a clear report and charts.”</p>
        </div>
        <div className="ml-6 h-8 border-l border-dashed border-[var(--soluk)]" aria-hidden="true" />
        <div className="rounded-2xl border border-[var(--cizgi)] bg-white p-6">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--zemin)] text-lg" aria-hidden="true">↗</span><div><p className="font-medium">A matching data agent</p><p className="mt-1 text-xs text-[var(--soluk)]">CSV analysis · Charts · Reports</p></div></div>
          <p className="mt-5 border-t border-[var(--cizgi)] pt-4 text-sm leading-relaxed text-[var(--soluk)]">See why it matches, what its record says, and what still needs checking.</p>
          <div className="mt-5 rounded-lg bg-[var(--zemin)] px-4 py-3 text-sm">Next: try a small, public sample <span aria-hidden="true">→</span></div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[var(--soluk)]">Illustrative example. Matching is based on published descriptions, not a guarantee of performance.</p>
      </div>
    </section>
    <section id="how-it-works" className="scroll-mt-24 border-y border-[var(--cizgi)] bg-[var(--zemin)]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--soluk)]">HOW IT WORKS</p>
        <h2 className="mt-3 text-3xl tracking-tight sm:text-4xl">A clear path from search to a first trial.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            ["01", "Describe your job", "Write what you want to achieve, the tools you use, and your limits. Or browse and filter the directory yourself."],
            ["02", "Compare the evidence", "Get a ranked shortlist with short reasons. Check current ownership, metadata and service responses."],
            ["03", "Try before committing", "Open the provider’s service, copy a small trial prompt, and review the result. Save your findings for later."],
          ].map(([number, title, body]) => <article key={number} className="border-t border-[var(--cizgi)] pt-5"><p className="text-sm text-[var(--soluk)]">{number}</p><h3 className="mt-4 text-xl">{title}</h3><p className="mt-3 text-sm leading-7 text-[var(--soluk)]">{body}</p></article>)}
        </div>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2">
      <div><h2 className="text-3xl tracking-tight">Know what you’re choosing.</h2><p className="mt-5 max-w-md leading-7 text-[var(--soluk)]">NOMEN brings agent discovery and registry evidence together. A useful match is a starting point: the final decision stays with you.</p></div>
      <div className="space-y-5 text-sm">
        <div className="border-b border-[var(--cizgi)] pb-5"><h3 className="font-medium">Published capabilities, visible evidence</h3><p className="mt-2 leading-6 text-[var(--soluk)]">See the description behind each recommendation and inspect current registry observations.</p></div>
        <div className="border-b border-[var(--cizgi)] pb-5"><h3 className="font-medium">A trial you control</h3><p className="mt-2 leading-6 text-[var(--soluk)]">Trials run with the provider. NOMEN does not automatically send tasks, authorize spending, or certify results.</p></div>
        <div><h3 className="font-medium">Built for people and developers</h3><p className="mt-2 leading-6 text-[var(--soluk)]">Use the app to find an agent, or explore the <Link href="/developers" className="underline">API and integration docs</Link> for your own workflow.</p></div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-6"><div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-[var(--lacivert)] p-8 text-white sm:flex-row sm:items-center sm:p-12"><div><h2 className="text-3xl">What would you like to get done?</h2><p className="mt-3 text-sm text-white/70">Start with a task. Find an agent worth trying.</p></div><Link href="/workbench" className="shrink-0 rounded-xl bg-white px-6 py-4 text-sm font-medium text-[var(--lacivert)]">Find an agent →</Link></div></section>
  </main>;
}
