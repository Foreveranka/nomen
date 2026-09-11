import { NextRequest, NextResponse } from "next/server";
import { bak, indeks, zincirler, ACIKLAMA } from "@/lib/dizin";
export async function handler(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams;
  const zincir = (p.get("chain") || p.get("zincir") || "ethereum").toLowerCase();
  const idMetin = p.get("agentId") || p.get("id") || "";
  const id = Number(idMetin);

  const mevcut = zincirler();
  if (!mevcut.includes(zincir)) {
    return NextResponse.json(
      { error: "unknown chain", supported_chains: mevcut },
      { status: 400 }
    );
  }
  if (!/^\d+$/.test(idMetin) || !Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json(
      { error: "agentId must be a positive integer", example: "/api/dogrula?chain=ethereum&agentId=2364" },
      { status: 400 }
    );
  }

  const { durum, detay } = bak(zincir, id);
  const ix = indeks();

  return NextResponse.json({
    chain: zincir,
    agentId: id,
    status: durum,
    passes: durum === "passes",
    reason: ACIKLAMA[durum],
    agent: detay
      ? {
          name: detay.name,
          type: detay.type,
          description: detay.desc,
          owner: detay.owner,
          endpoints: detay.services,
          category: detay.category,
          metadata_source: detay.metadata_source,
          metadata_hash: detay.hash,
          notes: detay.flags,
        }
      : null,
    scan: {
      data_kind: "published_snapshot",
      live_check: false,
      provenance: ix[zincir]?.snapshot ?? { coverage: "legacy_unverified" },
      highest_agent_id_seen: ix[zincir]?.en_yuksek_id ?? null,
      agents_passing_on_this_chain: ix[zincir]?.gorunur ?? null,
      rules: new URL("/rules", req.url).href,
    },
  });
}
