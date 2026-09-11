# ETHOnline 2026 — reviewable submission draft

**Project:** NOMEN

**Short description:** Find AI agents for a job, inspect their ERC-8004 registry evidence, and prepare a small provider-side trial before choosing one.

**Problem:** An onchain identity does not establish task suitability. NOMEN combines English job matching, transparent registry evidence and a user-controlled trial workflow; it does not certify agent performance.

**Implementation:** Python scanner with pinned ownership reads, bounded metadata fetching and deterministic Merkle proofs; Next.js directory and APIs; Solidity registrar and text resolver; Graph event mappings, historical identity comparison and Graph evidence used before and during AI ranking. Purpose filtering uses a disclosed dictionary and heuristics, not an objective safety certification.

**September 11 product update:** A separate introduction leads to the app. DeepSeek extracts English task requirements and ranks published records with short reasons and exact quotes. AI search and the filtered directory share one screen. Try this agent checks current evidence, labels provider links and service documents, prepares a copyable local trial prompt and supports browser-local user reviews. No agent task is automatically executed. Nineteen code tests and a ten-case controlled ranking run passed; these do not prove universal accuracy.

**New work verified on September 9:** strict unknown/error handling, scanner refresh isolation, current Sepolia snapshot, API validation, production build repair, claim root/owner checks, revocation suspension, generation-aware resolver, Graph mapping corrections and UI/docs corrections.

**Do not claim as complete:** Circle Agent Stack/Arc settlement, mainnet naming or an autonomous production monitoring service. The replacement ENS deployment is now verified on Sepolia, with reader.nomen-demo.eth claimed for test agent #10226.

**Partner choice:** ENS has the strongest product fit, conditional on a real ENSv2 claim demo. Graph integration now gates Sepolia AI candidates on live owner/URI continuity and passes indexed history into DeepSeek. Include the production verification evidence and demonstrate a registry-driven decision; this does not guarantee eligibility or an award. Arc registry reads and Base Sepolia x402 do not satisfy the agentic Arc integration requirement.

**Owner must complete:** track selection; accurate pre-event/current-event boundary; public repository URL; team and stake confirmation; 2–4 minute human-narrated demo; final form submission. Existing August references require disclosure; a new commit cannot establish a historical event boundary.

**AI disclosure draft:** AI coding tools assisted with implementation, debugging, tests, documentation and review across the scanner, frontend, contracts and Graph mappings. The project owner must describe their own decisions, contributions, and validation accurately. Review source and remove secrets before publishing prompts or logs. Do not publish private conversation exports.

Official references (checked during readiness review):
- https://ethglobal.com/events/ethonline2026/info/details
- https://ethglobal.com/rules
- https://ethglobal.com/events/ethonline2026/prizes/ens
- https://ethglobal.com/events/ethonline2026/prizes/the-graph
- https://ethglobal.com/events/ethonline2026/prizes/arc

Deadline stated by ETHGlobal: September 13, 12:00 EDT / 19:00 Türkiye. This document does not submit the project or guarantee eligibility or an award.

**Graph demo acceptance:** Use Sepolia AI search, show its indexed block and AI-selected registry facts, then show a controlled ownership/URI-change test withholding an otherwise matching record before ranking. Clearly distinguish real provider evidence (`graph-ai-evidence.json`) from mocked negative tests (`site/scripts/graph-discovery.test.mjs`). A static activity panel alone is not the integration. Production verification passed on September 11, 2026: both real DeepSeek searches returned Graph-backed matches; their counters and immutable baseline checkpoints were independently queried at the returned block. See `inceleme/graph-ai-evidence.json`. Unit tests cover simulated negative conditions; do not present those fixtures as live chain events.
