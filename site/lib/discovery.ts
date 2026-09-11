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
/** AI expands the request into multilingual concepts; this bounded recall stage is not the AI ranking. */
export function retrieve(
  candidates: Candidate[],
  terms: string[],
  limit = 48,
): Candidate[] {
  const useful = [
    ...new Set(
      terms.map((t) => normalize(t.trim())).filter((t) => t.length > 2),
    ),
  ].slice(0, 24);
  return candidates
    .map((c) => {
      const description = normalize(c.description);
      const name = normalize(c.name);
      const score = useful.reduce(
        (n, t) =>
          n + (description.includes(t) ? 3 : 0) + (name.includes(t) ? 1 : 0),
        0,
      );
      return { c, score };
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
      seen.add(m.key);
      return [{ ...m, ...c, evidenceQuote: quote, registrySignals: signals }];
    })
    .slice(0, 4);
}
