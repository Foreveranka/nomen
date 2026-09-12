import { REVIEW_LIST_QUERY } from "@/lib/review-list-query";
import { reviewDb } from "@/lib/reviews-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST() {
  return Response.json({ error: "New public ratings are retired. File a paid complaint record through /orders. Existing reviews remain available as a read-only archive." }, { status: 410 });
}
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const chain = p.get("chain"); const agentId = Number(p.get("agentId"));
  const page = Math.max(1, Math.min(10000, Number(p.get("page") || 1))); const sort = p.get("sort") || "newest";
  if (!["sepolia", "arbitrum", "arc"].includes(chain || "") || !Number.isSafeInteger(agentId) || agentId < 1 || !Number.isInteger(page) || !["newest", "highest", "lowest"].includes(sort)) return Response.json({ error: "Invalid review query" }, { status: 400 });
  try {
    const sql = reviewDb();
    const id = p.get("id");
    if (id) {
      if (!/^0x[0-9a-fA-F]{64}$/.test(id)) return Response.json({ error: "Invalid review ID" }, { status: 400 });
      const found = await sql`SELECT bundle FROM nomen_reviews WHERE chain=${chain} AND agent_id=${agentId} AND evaluation_id=${id.toLowerCase()}`;
      if (!found.length) return Response.json({ error: "Review not found" }, { status: 404 });
      return Response.json(found[0].bundle, { headers: { "Content-Disposition": 'attachment; filename="nomen-public-review.json"', "Cache-Control": "no-store" } });
    }
    const rows = await sql.query(REVIEW_LIST_QUERY, [chain, agentId, sort, (page - 1) * 20]);
    const r = rows[0];
    const publicRow = (v: Record<string, unknown>) => ({ id: v.evaluation_id, reviewer: v.reviewer, rating: v.rating, note: v.note, outcome: v.outcome, transactionHash: v.transaction_hash, recordedAt: Number(v.recorded_at), demo: v.demo });
    return Response.json({ average: r.average === null ? null : Number(r.average), count: Number(r.count), total: Number(r.total), reviews: r.reviews.map(publicRow), demos: r.demos.map(publicRow), page, pages: Math.ceil(Number(r.total) / 20) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Reviews are temporarily unavailable. Please retry." }, { status: 503 }); }
}
