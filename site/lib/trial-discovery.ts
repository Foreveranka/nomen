import type { Candidate } from "./discovery";
import { readArbitrumEvaluationHistories } from "./evaluation-history";

export async function enrichWithTrials(candidates: Candidate[]): Promise<Candidate[]> {
  const ids = [...new Set(candidates.filter(c => c.chain === "arbitrum").map(c => c.agentId))];
  if (!ids.length) return candidates;
  try {
    const histories = await readArbitrumEvaluationHistories(ids);
    return candidates.map(c => {
      const history = c.chain === "arbitrum" ? histories.find(h => h.agentId === c.agentId) : undefined;
      return history ? { ...c, trialHistory: { status: "live", checkedAt: history.checkedAt, ...history.summary } } : c;
    });
  } catch {
    return candidates.map(c => c.chain === "arbitrum" ? { ...c, trialHistory: { status: "unavailable" } } : c);
  }
}
