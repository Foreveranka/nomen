# Graph-backed AI integration — September 11, 2026

The production app now requires live Graph evidence for Sepolia recommendations. The Graph is used before and during DeepSeek ranking, not only in an activity panel.

## Decision flow

1. DeepSeek extracts task requirements and retrieval terms from a 15–500 character English request.
2. The server retrieves at most 48 published candidates.
3. The server reads fresh Graph metadata, then pins the current block. It compares current ownership and URI with the last immutable IdentityCheckpoint at or before each candidate’s snapshot block. Changed identities and unknown history are withheld before ranking.
4. DeepSeek compares eligible capabilities with Graph feedback, distinct-wallet and identity-change facts. Each Sepolia recommendation cites supplied registry signal IDs. Invented signals or metadata quotes are rejected.
5. The interface displays the evidence, block, withheld reasons and the separate Try this agent flow. Missing/stale Graph data pauses Sepolia matching. Ethereum/Arc remain explicitly snapshot-only.

## Verified

- 27 application tests passed, including 8 Graph-specific tests; lint and production build passed.
- Subgraph code generation, compilation and Studio deployment succeeded. Version v0.3.0: QmTT9Suxj7AAatvRSWUMrtbzcarPsw4st5QiDBcWSCXtoj.
- Both real provider searches passed locally and on production; returned facts and immutable checkpoints were independently queried from Graph. See graph-ai-local-evidence.json and graph-ai-evidence.json.
- A real 48-candidate Graph batch completed in 973 ms (one observation, not a benchmark): graph-batch-evidence.json.
- Production browser search rendered AlphaShark42 with its live Graph evidence at block 11679253. The actual catching-up state was also verified in the browser before indexing finished: zero recommendations and Matching paused.
- Production activity returned fresh data for agent 10226 and reader.nomen-demo.eth. Landing, workbench and updated docs returned HTTP 200. Input of 501 characters returned HTTP 400.
- Post-deploy logs contained DeepSeek JSON-schema compatibility warnings on the three successful search requests; no application exception was observed in those inspected logs. Schema validation remains enabled.
- Vercel production deployment: dpl_9pgTEyLCBZQY9LWQ5mhcGVuSufPF. Alias: https://nomen-beta.vercel.app.

## Provider compatibility and limits

Studio pruned mutable historical versions even with the retention hint; immutable identity checkpoints now preserve the needed history. Explicit-block _meta queries return null timestamps/hashes, so freshness is established from the latest metadata first and the evidence queries pin that block number.

The index is Sepolia-only and must be within 15 minutes of the current time. URI agreement does not prove current HTTP content or successful task completion. Feedback includes revoked records and distinct wallets do not establish independent customers. Model capability matching is still probabilistic.

This addresses the live-data/AI decision integration for the Graph AI prize. A public repository, 2–4 minute demo, correct eligibility pool and pre-existing-work disclosure remain separate submission requirements: https://ethglobal.com/events/ethonline2026/prizes/the-graph.
