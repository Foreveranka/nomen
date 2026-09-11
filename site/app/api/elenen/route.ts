import { NextRequest, NextResponse } from "next/server";
import { elenenler, zincirler, KOD_OF, ACIKLAMA } from "@/lib/dizin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bir sebebe göre elenen kayıtların tam listesi, sayfalı. Hiçbir kayıt gizlenmez. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const zincir = (p.get("chain") ?? "ethereum").toLowerCase();
  const sebep = p.get("reason") ?? "";
  const sayfa = Number(p.get("page") ?? 0);
  if (!Number.isSafeInteger(sayfa) || sayfa < 0) return NextResponse.json({ error: "invalid page" }, { status: 400 });
  if (!zincirler().includes(zincir)) return NextResponse.json({ error: "unknown chain", supported_chains: zincirler() }, { status: 400 });
  if (!Object.hasOwn(KOD_OF, sebep) || sebep === "passes" || sebep === "not_registered") {
    return NextResponse.json({ error: "reason must be one of the filter statuses", reasons: Object.keys(KOD_OF).filter((k) => k !== "passes" && k !== "not_registered") }, { status: 400 });
  }
  const r = elenenler(zincir, sebep, sayfa);
  return NextResponse.json({ chain: zincir, reason: sebep, explanation: ACIKLAMA[sebep], ...r });
}
