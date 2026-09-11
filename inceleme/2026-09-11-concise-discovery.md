# Concise English agent discovery

Implemented direct DeepSeek (`deepseek-flash`) task extraction and ranking. The UI shows agent cards with one-sentence reasons and expandable evidence/unknowns. Removed generated essays, clarification panels, and suggested-trial prose. User input remains 15–2,000 characters. Secrets are server-only; production key is a sensitive Vercel environment variable.

Ranking shares its exact prompt/schema with the benchmark. It returns no conclusion, up to four supplied keys, reasons up to 180 characters, exact description quotes, and at most two short unknowns. Invalid structured output gets one bounded retry in production; provider access/rate errors are not retried. Existing ID/quote grounding remains in place. An instruction to select only core-capability matches is not a deterministic semantic proof.

## Verification

- Controlled English ranker run: 10/10 schema-valid responses, expected top selection/empty result in all ten, no rejected evidence quotes, mean ranker latency 1.34 seconds. No retries in this benchmark. Artifact: `model-comparison/2026-09-11T01-51-25.258Z.json`.
- The run covers eight job types, one no-match case and one adversarial metadata case. This is a small, single-run fixed-roster test, not evidence of universal accuracy or real task execution.
- The weather case no longer includes the weaker geolocation record. Crypto research no longer includes generic data-analysis records.
- Local full API flow: Solidity, weather and physical-hardware requests all HTTP 200; weather returns weather-intel-agent only; hardware returns no match. Requests take approximately 1.7–4.1 seconds, including extraction/retrieval.
- Browser: CSV request shows short cards; choosing Jeyui preserves the request and agent ID in live evaluation. Missing metadata produces “More evidence needed”, not an execution approval.
- 16 existing discovery/evaluation tests pass; lint, TypeScript and production build pass. Existing viem/ox dynamic dependency warning remains.

Discovery still uses published local snapshots, not a live The Graph query. Registry descriptions are self-declared capabilities; users must inspect current evidence and test task quality separately.
