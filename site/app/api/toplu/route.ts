import { NextRequest, NextResponse } from "next/server";
import { bak, zincirler, ACIKLAMA, indeks } from "@/lib/dizin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EN_FAZLA = 2000;

/**
 * Toplu sorgu: pazar yerleri kendi listelerini temizlesin diye.
 * POST { chain, agentIds: number[] }  →  [{ agentId, status, passes, reason, name, category, endpoints }]
 * Ücretsiz; tek tek sorgunun aksine burada amaç dizinin toptan tüketilmesi.
 */
export async function POST(req: NextRequest) {
  let govde: { chain?: string; agentIds?: unknown };
  try {
    const reader = req.body?.getReader(); if (!reader) throw new Error();
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 65536) { await reader.cancel(); return NextResponse.json({ error: "body exceeds 64 KiB" }, { status: 413 }); }
      chunks.push(value);
    }
    govde = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch { return NextResponse.json({ error: "body must be JSON" }, { status: 400 }); }
  if (!govde || typeof govde !== "object" || Array.isArray(govde) || (govde.chain !== undefined && typeof govde.chain !== "string")) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const zincir = (govde.chain ?? "ethereum").toLowerCase();
  if (!zincirler().includes(zincir)) return NextResponse.json({ error: "unknown chain" }, { status: 400 });
  const ham = govde.agentIds;
  if (!Array.isArray(ham) || !ham.length || ham.length > EN_FAZLA || !ham.every((n) => typeof n === "number" && Number.isSafeInteger(n) && n > 0)) return NextResponse.json({ error: "agentIds must contain 1–2000 positive safe integers" }, { status: 400 });
  const idler = [...new Set<number>(ham)];
  const ix = indeks()[zincir];
  const sonuc = idler.map((id) => {
    const { durum, detay, gizliAd } = bak(zincir, id);
    return {
      agentId: id, status: durum, passes: durum === "passes", reason: ACIKLAMA[durum],
      name: detay?.name ?? gizliAd?.[0] ?? null,
      category: detay?.category ?? null,
      endpoints: detay?.services?.length ?? 0,
      owner: detay?.owner ?? null,
    };
  });
  return NextResponse.json({
    chain: zincir, requested: ham.length, answered: sonuc.length, limit: EN_FAZLA,
    scan: { highest_agent_id_seen: ix?.en_yuksek_id ?? null, agents_passing_on_this_chain: ix?.gorunur ?? null },
    results: sonuc,
  });
}
