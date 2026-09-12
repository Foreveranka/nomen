import { NextRequest, NextResponse } from "next/server";
import { readArbitrumEvaluationHistory } from "@/lib/evaluation-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const chain = request.nextUrl.searchParams.get("chain") ?? "arbitrum";
  const rawId = request.nextUrl.searchParams.get("agentId") ?? "";
  const agentId = Number(rawId);
  if (chain !== "arbitrum") {
    return NextResponse.json(
      { status: "unsupported", error: "Public evaluation history is currently available for Arbitrum Sepolia." },
      { status: 400 },
    );
  }
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(agentId) || agentId < 1) {
    return NextResponse.json(
      { status: "invalid", error: "agentId must be a positive integer." },
      { status: 400 },
    );
  }
  try {
    const history = await readArbitrumEvaluationHistory(agentId);
    return NextResponse.json({ status: "live", ...history }, {
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable", error: "Arbitrum receipt history could not be read. No zero-review conclusion was made." },
      { status: 503 },
    );
  }
}
