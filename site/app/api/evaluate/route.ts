import { NextRequest, NextResponse } from "next/server";
import { evaluate } from "@/lib/evaluate-server";
import { AGLAR, type AgAnahtar } from "@/lib/aglar";
import { JOBS, type Job } from "@/lib/evaluation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(req: NextRequest) {
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return NextResponse.json(
      { error: "Cross-origin evaluation is not allowed" },
      { status: 403 },
    );
  let input: Record<string, unknown>;
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12_000) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Body limit: 12,000 bytes" },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    !input ||
    Array.isArray(input) ||
    typeof input.chain !== "string" ||
    !Object.hasOwn(AGLAR, input.chain) ||
    typeof input.job !== "string" ||
    !Object.hasOwn(JOBS, input.job) ||
    typeof input.agentId !== "number" ||
    !Number.isSafeInteger(input.agentId) ||
    input.agentId < 1 ||
    (input.request !== undefined &&
      (typeof input.request !== "string" || input.request.length > 2000))
  )
    return NextResponse.json(
      {
        error:
          "Provide chain, a positive integer agentId, and job: custom, wallet_report, research or payments",
      },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      await evaluate(
        input.chain as AgAnahtar,
        input.agentId,
        input.job as Job,
        typeof input.request === "string" ? input.request.trim() : undefined,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Evaluation unavailable. No approval was issued." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
