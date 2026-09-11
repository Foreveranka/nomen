import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { discover } from "@/lib/discover-server";
import { AGLAR } from "@/lib/aglar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
// Bounded, best-effort per-instance throttling. Provider quotas remain the global limit.
const recent = new Map<string, { count: number; until: number }>();
let inFlight = 0;
const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(req: NextRequest) {
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== req.nextUrl.origin
  )
    return reply({ error: "Cross-origin requests are not allowed." }, 403);
  let body: unknown;
  try {
    const reader = req.body?.getReader();
    if (!reader)
      return reply({ error: "Describe the job you need help with." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12_000) {
        await reader.cancel();
        return reply({ error: "Please shorten your request." }, 413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return reply({ error: "Invalid request." }, 400);
  const { request, chain } = body as Record<string, unknown>;
  if (
    typeof request !== "string" ||
    request.trim().length < 15 ||
    request.length > 500 ||
    (chain !== undefined &&
      chain !== "all" &&
      (typeof chain !== "string" || !Object.hasOwn(AGLAR, chain)))
  )
    return reply(
      {
        error:
          "Describe your task in 15–500 characters and choose a supported network.",
      },
      400,
    );
  const now = Date.now();
  for (const [key, value] of recent) if (value.until <= now) recent.delete(key);
  const ip = createHash("sha256")
    .update(
      req.headers.get("x-vercel-forwarded-for") ||
        req.headers.get("x-forwarded-for") ||
        "local",
    )
    .digest("hex");
  const counter = recent.get(ip);
  if (inFlight >= 3 || recent.size >= 1000 || (counter && counter.count >= 6))
    return reply(
      { error: "Too many searches. Please try again in a minute." },
      429,
    );
  recent.set(ip, {
    count: (counter?.count ?? 0) + 1,
    until: counter?.until ?? now + 60_000,
  });
  inFlight++;
  try {
    return reply(
      await discover(
        request.trim(),
        chain === "all" ? undefined : (chain as string | undefined),
        req.signal,
      ),
    );
  } catch (e) {
    const status =
      e && typeof e === "object" && "statusCode" in e
        ? e.statusCode
        : undefined;
    if (status === 429)
      return NextResponse.json(
        {
          error:
            "The AI provider's request limit has been reached. Please try again later. No recommendation was issued.",
        },
        {
          status: 429,
          headers: { "Cache-Control": "no-store", "Retry-After": "60" },
        },
      );
    // Do not expose prompts, gateway responses or credentials through errors/logs.
    return reply(
      {
        error:
          status === 402 || status === 403
            ? "AI matching is temporarily unavailable because the model provider requires account access or credits. You can still browse and check registry evidence."
            : "AI matching could not finish. Please retry; no recommendation was issued.",
      },
      503,
    );
  } finally {
    inFlight--;
  }
}
