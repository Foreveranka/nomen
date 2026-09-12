"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import type { PublicReview, ReviewResponse } from "@/lib/reviews";
function RatingStars({ rating }: { rating: number }) {
  return <span aria-hidden="true" className="relative inline-block whitespace-nowrap text-lg leading-none tracking-[0.08em] align-middle">
    <span className="text-[var(--cizgi)]">★★★★★</span>
    <span className="absolute inset-y-0 left-0 overflow-hidden text-amber-600" style={{ width: `${Math.max(0, Math.min(10, rating)) * 10}%` }}>★★★★★</span>
  </span>;
}
export default function AgentReviews({ chain, agentId }: { chain: AgAnahtar; agentId: number }) {
  const [sort, setSort] = useState("newest"); const [page, setPage] = useState(1);
  const query = useQuery<ReviewResponse>({ queryKey: ["public-reviews", chain, agentId, sort, page], queryFn: async () => {
    const r = await fetch(`/api/reviews?chain=${chain}&agentId=${agentId}&sort=${sort}&page=${page}`);
    if (!r.ok) throw new Error("Reviews unavailable"); return r.json();
  }, retry: false });
  const data = query.data;
  function review(r: PublicReview) {
    return <article key={r.id} className="border-t border-[var(--cizgi)] py-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-xl">{r.rating === null ? "Unrated" : `${r.rating}/10`}</strong>{r.rating !== null && <span className="ml-3"><RatingStars rating={r.rating} /></span>}<span className="ml-3 rounded-full bg-[var(--yuzey)] px-3 py-1 text-xs">{r.demo ? "Demo review" : "Wallet-signed"}</span></div><span className="text-sm text-[var(--soluk)]">{new Date(r.recordedAt * 1000).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}</span></div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{r.note || "No written comment."}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--soluk)]"><span>{r.reviewer.slice(0, 6)}…{r.reviewer.slice(-4)}</span><span>{r.outcome === "passed" ? "It worked" : r.outcome === "failed" ? "It didn’t work" : "Not sure yet"}</span><a className="underline" href={`${AGLAR[chain].tarayici}/tx/${r.transactionHash}`} target="_blank" rel="noopener noreferrer">View signed record ↗</a><a className="underline" href={`/api/reviews?chain=${chain}&agentId=${agentId}&id=${r.id}`}>Download evidence</a></div>
    </article>;
  }
  return <section className="mt-8 rounded-2xl border border-[var(--cizgi)] p-5 sm:p-7" aria-labelledby="reviews-heading">
    <div className="flex flex-wrap justify-between gap-4"><div><h2 id="reviews-heading" className="text-xl font-medium">Archived ratings</h2>{data && <p className="mt-3"><strong className="text-3xl">{data.average === null ? "No ratings yet" : `${data.average.toFixed(1)}/10`}</strong>{data.average !== null && <span className="ml-3"><RatingStars rating={data.average} /></span>}{data.count > 0 && <span className="ml-3 text-sm text-[var(--soluk)]">{data.count} {data.count === 1 ? "rating" : "ratings"} · {data.total} {data.total === 1 ? "review" : "reviews"}</span>}</p>}</div><a className="dugme h-fit" href={`/orders?chain=${chain}&agentId=${agentId}`}>Open complaint records →</a></div>
    <p className="mt-3 text-sm text-[var(--soluk)]">Historical reviews from the previous model. New ratings are no longer accepted. Each wallet’s latest published review counts; demo reviews do not. Wallet signatures confirm authorship, not task completion.</p>
    {query.isPending && <p className="mt-5" role="status">Loading reviews…</p>}
    {query.isError && <div className="mt-5" role="alert">Reviews are temporarily unavailable. <button className="underline" onClick={() => query.refetch()}>Retry</button></div>}
    {data && <><div className="mt-6 flex items-center justify-between gap-3"><h3 className="font-medium">User reviews</h3><label className="text-sm">Sort <select className="ml-2 rounded-lg border border-[var(--cizgi)] bg-transparent p-2" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="newest">Newest</option><option value="highest">Highest rating</option><option value="lowest">Lowest rating</option></select></label></div>{data.total === 0 && <p className="py-6 text-sm text-[var(--soluk)]">No archived reviews. New complaint records are managed through Orders.</p>}{data.reviews.map(review)}{data.pages > 1 && <div className="flex items-center gap-4"><button className="dugme" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {data.pages}</span><button className="dugme" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}{data.demos.length > 0 && <details open={data.total === 0} className="mt-4 rounded-xl bg-[var(--yuzey)] p-4"><summary className="cursor-pointer text-sm">Demo reviews ({data.demos.length}) · excluded from ratings</summary><p className="mt-3 text-xs text-[var(--soluk)]">Synthetic inputs used to test publication. These are not real agent experiences.</p>{data.demos.map(review)}</details>}</>}
  </section>;
}
