import type { GraphCoverage, GraphEvidence, GraphSignalId } from "./graph-discovery";

export type Candidate = {
  key: string;
  chain: string;
  agentId: number;
  name: string;
  description: string;
  category: string | null;
  serviceCount: number;
  snapshotOwner?: string | null;
  snapshotBlock?: number;
  registryEvidence?: GraphEvidence;
  trialHistory?: { status: "live"; checkedAt: string; total: number; distinctReviewers: number; superseded: number; passed: number; failed: number; inconclusive: number; latestRecordedAt: string | null } | { status: "unavailable" };

};
export type Brief = {
  summary: string;
  requirements: string[];
  searchTerms: string[];
  questions: string[];
  cautions: string[];
  sampleTask: string;
  acceptance: string[];
};
export type RankedMatch = {
  key: string;
  reason: string;
  evidenceQuote: string;
  gaps: string[];
  registrySignals?: GraphSignalId[];
  trialHistoryConsidered?: boolean;
};
export type Discovery = {
  request: string;
  brief: Brief;
  matches: (RankedMatch & Candidate)[];
  conclusion: string;
  searched: number;
  considered: number;
  generatedAt: string;
  model: string;
  registry: GraphCoverage;
};

const normalize = (s: string) => s.normalize("NFKC").toLocaleLowerCase("en-US");
const genericRequestWords = new Set("a an the and or with without for from into that this those these should must need needs want find agent agents offering using please help work job task can could would will not only have has give get make use my our your me it its to of in on at by as is are be do does done also plus than then some any all about based supports provide provides service services".split(" "));
/** Preserve literal capabilities when the model paraphrases them into non-matching phrases. */
export function requestKeywords(request: string): string[] {
  return [...new Set((normalize(request).match(/[a-z0-9]+/g) ?? [])
    .filter(word => word.length >= 3 && !genericRequestWords.has(word)))].slice(0, 48);
}

/** Bounded recall supplies candidates; the AI still checks every requested capability. */
export function retrieve(
  candidates: Candidate[],
  terms: string[],
  limit = 48,
  request = "",
): Candidate[] {
  const useful = [
    ...new Set(
      terms.map((t) => normalize(t.trim())).filter((t) => t.length > 2),
    ),
  ].slice(0, 24);
  const literalWords = requestKeywords(request);
  return candidates
    .map((c) => {
      const description = normalize(c.description);
      const name = normalize(c.name);
      const words = new Set(`${description} ${name}`.match(/[a-z0-9]+/g) ?? []);
      const score = useful.reduce(
        (n, t) =>
          n + (description.includes(t) ? 3 : 0) + (name.includes(t) ? 1 : 0),
        0,
      );
      const literalScore = literalWords.reduce((n, word) => n + (words.has(word) ? 1 : 0), 0);
      return { c, score: score + literalScore };
    })
    .filter((v) => v.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.c.serviceCount - a.c.serviceCount ||
        a.c.key.localeCompare(b.c.key),
    )
    .slice(0, limit)
    .map((v) => v.c);
}

/** The model can select only supplied records and must quote their actual description. */
export function groundMatches(ranked: RankedMatch[], candidates: Candidate[]) {
  const seen = new Set<string>();
  return ranked
    .flatMap((m) => {
      const c = candidates.find((c) => c.key === m.key);
      const quote = m.evidenceQuote.trim();
      if (
        !c ||
        seen.has(m.key) ||
        quote.length < 12 ||
        !c.description.includes(quote)
      )
        return [];
      const signals = [...new Set(m.registrySignals ?? [])];
      if (c.registryEvidence && (!signals.length || signals.some(id => !c.registryEvidence!.signals.some(s => s.id === id)))) return [];
      if (!c.registryEvidence && signals.length) return [];
      if (c.trialHistory && m.trialHistoryConsidered !== true) return [];
      if (!c.trialHistory && m.trialHistoryConsidered) return [];
      seen.add(m.key);
      return [{ ...m, ...c, evidenceQuote: quote, registrySignals: signals }];
    })
    .slice(0, 4);
}
