import { NextRequest, NextResponse } from "next/server";
import { bak, sahibinAjanlari, zincirler, ACIKLAMA } from "@/lib/dizin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bir cüzdanın o zincirdeki tüm ERC-8004 ajanları, her biri durumuyla. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zincir = (p.get("chain") ?? "ethereum").toLowerCase();
  const adres = (p.get("address") ?? "").toLowerCase();
  if (!zincirler().includes(zincir)) return NextResponse.json({ error: "unknown chain", supported_chains: zincirler() }, { status: 400 });
  if (!/^0x[0-9a-f]{40}$/.test(adres)) return NextResponse.json({ error: "address must be a 0x-prefixed 20 byte hex string" }, { status: 400 });
  const idler = sahibinAjanlari(zincir, adres);
  const page = Number(p.get("page") ?? 0);
  const limit = 100;
  if (!Number.isSafeInteger(page) || page < 0) return NextResponse.json({ error: "invalid page" }, { status: 400 });
  const passing = idler.filter((id) => bak(zincir, id).durum === "passes").length;
  const ajanlar = idler.slice(page * limit, (page + 1) * limit).map((id) => {
    const { durum, detay, gizliAd } = bak(zincir, id);
    return {
      agentId: id, status: durum, passes: durum === "passes", reason: ACIKLAMA[durum],
      name: detay?.name ?? gizliAd?.[0] ?? null, description: detay?.desc ?? gizliAd?.[1] ?? null,
      category: detay?.category ?? null, endpoints: detay?.services ?? [],
    };
  });
  return NextResponse.json({ chain: zincir, address: adres, total: idler.length, passing, page, limit, hasMore: (page + 1) * limit < idler.length, agents: ajanlar });
}
