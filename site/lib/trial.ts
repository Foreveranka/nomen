import type { Evaluation, ServiceObservation } from "./evaluation";

/** Only offer explicit, recently observed public HTTPS URLs; never infer a launch URL. */
export function trialLink(service: ServiceObservation): string | null {
  if (!["reachable", "auth_required", "payment_required"].includes(service.status)) return null;
  try {
    const u = new URL(service.url);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password || u.port ||
        !host.includes(".") || /[\[\]:]/.test(host) || /^[\d.]+$/.test(host) ||
        /\.(localhost|local|internal|test|invalid)$/.test(host)) return null;
    return u.href;
  } catch { return null; }
}

export function trialPrompt(request: string, sample: string): string {
  return `I want to test whether you can help with this task:\n${request.trim()}\n\nUse only this small public or synthetic sample:\n${sample.trim() || "[Add a small public or synthetic sample before sending.]"}\n\nReturn one small, concrete result that demonstrates the requested capability. Explain how I can check it, and state anything you cannot do. Use a simulation for actions that change data or move money. Do not access private accounts, send messages, make purchases or execute transactions. Ask me before any paid action. Stop if this sample is insufficient.`;
}

export function trialAccess(report: Evaluation, now: number): boolean {
  return report.decision !== "hold" && Number.isFinite(Date.parse(report.expiresAt)) &&
    now < Date.parse(report.expiresAt) && report.services.some(s => trialLink(s));
}
