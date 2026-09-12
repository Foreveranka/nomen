import { COMPLAINT_PUBLISH_QUERY } from "@/lib/complaint-publish-query";
import { z } from "zod";
import { reviewDb } from "@/lib/reviews-server";
import { complaintAction, complaintFields, complaintCommitment, complaintTextHash, actionSigner, COMPLAINT_FEE, COMPLAINT_PAYMENT_CHAIN, COMPLAINT_TREASURY } from "@/lib/complaints";
import { authenticateComplaint, currentAgentOwner, validateComplaintPayment, publicComplaint, ComplaintError } from "@/lib/complaints-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const envelope = z.object({ action: complaintAction, signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(16000) }).strict();
const fee = { amount: COMPLAINT_FEE, chainId: COMPLAINT_PAYMENT_CHAIN, treasury: COMPLAINT_TREASURY, label: "5 test USDC", testnet: true };
const headers = { "Cache-Control": "no-store" };
async function readBody(request: Request) {
  const reader = request.body?.getReader(); if (!reader) throw new ComplaintError("Missing request body.");
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 32000) { await reader.cancel(); throw new ComplaintError("Request exceeds 32 KB.", 413); } chunks.push(value); }
  const data = new Uint8Array(size); let offset = 0; for (const c of chunks) { data.set(c, offset); offset += c.length; }
  return envelope.parse(JSON.parse(new TextDecoder().decode(data)));
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const { action, signature } = await readBody(request);
    await authenticateComplaint(action, signature as `0x${string}`);
    const sql = reviewDb(); const actor = actionSigner(action);
    if (action.type === "prepare") {
      // A signed reservation avoids charging twice when another tab has already prepared this wallet/agent pair.
      await currentAgentOwner(action.draft.chain, action.draft.agentId);
      const d = action.draft;
      const result = await sql.transaction([
        sql`INSERT INTO nomen_complaints (id,chain,agent_id,author,demo,initial_draft,fields,commitment,text_hash)
          VALUES (${d.id},${d.chain},${d.agentId},${actor},${d.demo},${JSON.stringify(d)}::jsonb,${JSON.stringify(complaintFields.parse({ requested:d.requested,happened:d.happened,problem:d.problem,evidence:d.evidence }))}::jsonb,${complaintCommitment(d)},${complaintTextHash(d)})
          ON CONFLICT DO NOTHING`,
        sql`INSERT INTO nomen_complaint_events (complaint_id,version,actor,kind,payload,signature)
          SELECT id,0,${actor},'prepare',${JSON.stringify(action)}::jsonb,${signature} FROM nomen_complaints WHERE id=${d.id} AND author=${actor} AND commitment=${complaintCommitment(d)} ON CONFLICT DO NOTHING`,
        sql`SELECT * FROM nomen_complaints WHERE chain=${d.chain} AND agent_id=${d.agentId} AND author=${actor}`,
      ]);
      const row = result[2][0]; if (!row) throw new ComplaintError("Draft ID conflict. Start a new draft.", 409);
      return Response.json({ record: publicComplaint(row), fee }, { headers });
    }
    const found = await sql`SELECT * FROM nomen_complaints WHERE id=${action.id}`;
    const row = found[0]; if (!row) throw new ComplaintError("Record not found.", 404);
    if (action.type !== "reply" && row.author !== actor) throw new ComplaintError("Only the author can change this record.", 403);
    if (action.type === "publish") {
      if (row.payment_tx) {
        if (row.payment_tx !== action.transaction) throw new ComplaintError("This record is already published. Do not pay again.", 409);
        return Response.json({ record: publicComplaint(row), fee }, { headers });
      }
      const payment = await validateComplaintPayment(row.initial_draft, action.transaction as `0x${string}`);
      // Serialize publications for an agent so simultaneous bursts cannot bypass pattern detection.
      const result = await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(hashtext(${row.chain + ':' + row.agent_id}))`,
        sql.query(COMPLAINT_PUBLISH_QUERY, [action.transaction, payment.block, action.id, actor, JSON.stringify(action), signature]),
      ]);
      const updated = result[1][0];
      if (!updated) {
        const current = await sql`SELECT * FROM nomen_complaints WHERE id=${action.id}`;
        if (current[0]?.payment_tx === action.transaction) return Response.json({ record: publicComplaint(current[0]), fee }, { headers });
        throw new ComplaintError("Record changed. Refresh before retrying.", 409);
      }
      return Response.json({ record: publicComplaint(updated), fee }, { headers });
    }
    if (!row.payment_tx) throw new ComplaintError("Publish the reserved record before updating it.", 409);
    let ownerBlock: string | null = null;
    if (action.type === "reply") {
      const ownership = await currentAgentOwner(row.chain, Number(row.agent_id));
      if (ownership.owner !== actor) throw new ComplaintError("Only the current registered agent owner can post a provider response.", 403);
      ownerBlock = ownership.block;
    }
    const fields = action.type === "edit" ? action.fields : row.fields;
    const status = action.type === "status" ? action.status : row.status;
    const textHash = action.type === "edit" ? complaintTextHash(action.fields) : row.text_hash;
    const updateResults = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtext(${'complaint-actor:' + actor}))`,
      sql`WITH changed AS (
      UPDATE nomen_complaints SET fields=${JSON.stringify(fields)}::jsonb,status=${status},version=version+1,updated_at=now(),text_hash=${textHash},
      flags=CASE WHEN NOT demo AND EXISTS(SELECT 1 FROM nomen_complaints c WHERE c.id<>nomen_complaints.id AND c.text_hash=${textHash} AND c.author<>nomen_complaints.author AND NOT c.demo AND c.payment_tx IS NOT NULL)
        THEN ARRAY(SELECT DISTINCT unnest(flags || ARRAY['repeated_text'])) ELSE flags END
      WHERE id=${action.id} AND version=${action.version} AND (SELECT count(*) FROM nomen_complaint_events WHERE actor=${actor} AND created_at>now()-interval '1 minute')<10
      RETURNING *
    ), event AS (
      INSERT INTO nomen_complaint_events (complaint_id,version,actor,kind,payload,signature,owner_block)
      SELECT id,version,${actor},${action.type},${JSON.stringify(action)}::jsonb,${signature},${ownerBlock} FROM changed
    ) SELECT * FROM changed`,
    ]);
    const changes = updateResults[1];
    if (!changes.length) throw new ComplaintError("Record changed or update limit reached. Refresh and retry in a minute.", 409);
    return Response.json({ record: publicComplaint(changes[0]), fee }, { headers });
  } catch (e) {
    if (e instanceof ComplaintError) return Response.json({ error: e.message }, { status: e.status, headers });
    if (e instanceof z.ZodError || e instanceof SyntaxError) return Response.json({ error: "Check the form fields and signature." }, { status: 400, headers });
    console.warn("Complaint operation unavailable", e instanceof Error ? e.name : "unknown");
    return Response.json({ error: "The network or record store is unavailable. Keep your draft and payment hash; retry without paying again." }, { status: 503, headers });
  }
}
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  try {
    const sql = reviewDb();
    const id = p.get("id");
    if (id) {
      if (!z.string().uuid().safeParse(id).success) throw new ComplaintError("Invalid record ID.");
      const rows = await sql`SELECT * FROM nomen_complaints WHERE id=${id} AND payment_tx IS NOT NULL`;
      if (!rows.length) throw new ComplaintError("Published record not found.", 404);
      const eventPage = Number(p.get("eventPage") || 1);
      if (!Number.isInteger(eventPage) || eventPage < 1 || eventPage > 10000) throw new ComplaintError("Invalid history page.");
      const events = await sql`SELECT actor,kind,payload,signature,owner_block::text,version,created_at FROM nomen_complaint_events WHERE complaint_id=${id} ORDER BY version DESC LIMIT 20 OFFSET ${(eventPage-1)*20}`;
      return Response.json({ record: { ...publicComplaint(rows[0]), events }, fee }, { headers });
    }
    const chain = p.get("chain") || null; const agentId = p.get("agentId") ? Number(p.get("agentId")) : null;
    const author = p.get("author")?.toLowerCase() || null; const page = Number(p.get("page") || 1); const filter = p.get("status") || "all";
    if ((chain && !["sepolia","arbitrum","arc"].includes(chain)) || (agentId !== null && (!Number.isSafeInteger(agentId)||agentId<1||!chain)) || (author&&!/^0x[0-9a-f]{40}$/.test(author)) || !Number.isInteger(page)||page<1||page>10000||!["all","open","resolved","flagged"].includes(filter)) throw new ComplaintError("Invalid complaint query.");
    const rows = await sql`WITH scoped AS (
      SELECT * FROM nomen_complaints WHERE payment_tx IS NOT NULL AND (${chain}::text IS NULL OR chain=${chain}) AND (${agentId}::bigint IS NULL OR agent_id=${agentId}) AND (${author}::text IS NULL OR author=${author})
    ), filtered AS (SELECT * FROM scoped WHERE ${filter}='all' OR status=${filter} OR (${filter}='flagged' AND cardinality(flags)>0)), selected AS (
      SELECT * FROM filtered ORDER BY published_at DESC,id LIMIT 20 OFFSET ${(page-1)*20}
    ) SELECT (SELECT count(*) FROM scoped WHERE NOT demo AND status='open') AS open,
      (SELECT count(*) FROM scoped WHERE NOT demo AND status='resolved') AS resolved,
      (SELECT count(*) FROM scoped WHERE NOT demo AND cardinality(flags)>0) AS flagged,
      (SELECT count(*) FROM filtered) AS total,
      coalesce((SELECT jsonb_agg(to_jsonb(selected)) FROM selected),'[]'::jsonb) AS records`;
    const r = rows[0];
    return Response.json({ records: r.records.map(publicComplaint), open: Number(r.open), resolved: Number(r.resolved), flagged: Number(r.flagged), total: Number(r.total), page, pages: Math.ceil(Number(r.total)/20), fee }, { headers });
  } catch (e) { return Response.json({ error: e instanceof ComplaintError ? e.message : "Complaint records are temporarily unavailable." }, { status: e instanceof ComplaintError ? e.status : 503, headers }); }
}
