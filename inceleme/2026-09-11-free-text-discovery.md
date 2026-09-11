# Free-text agent discovery

Production: https://nomen-beta.vercel.app/workbench

Deployment: `dpl_612SBDKEHQAEhNQZXNDDa6zDtzjv` (READY).

## Delivered

- Free-text input (15–2,000 characters), optional all-network or single-network search and editable examples. A user no longer needs a preset job or agent id to begin.
- Real Vercel AI Gateway calls: extract requirements, multilingual search concepts, missing details and a proposed trial; retrieve up to 48 published candidates; rank up to four with exact source-description quotations.
- Server-side grounding rejects invented registry identities, fabricated quotations and duplicate recommendations. No supported match returns an empty list.
- Candidate cards explain fit, missing evidence, source excerpts and links. Selection carries the original request, chain and id into live evaluation. Saved reports distinguish different free-text tasks for the same agent.
- Provider errors do not become fabricated matches. Input/output, deadline, concurrency and per-instance request limits are bounded. No secret or arbitrary endpoint is accepted from the model.

## Verified

- 16 focused tests passed, including retrieval outside the former presets, unsupported requests, grounded references, cross-network identity, task-specific comparisons, expiry and SSRF checks.
- ESLint, TypeScript and production build passed. Existing viem/ox dependency warning remains.
- Narrow-screen form inspected at 390px; viewport restored after testing.
- Actual production Turkish request for Solidity security review searched 5,378 records and compared four relevant descriptions. It returned Ethereum #22731 (Jernau) and Sepolia #1238 (CodeGuard Security), with matching source quotes and explicit unknowns.
- Clicking Jernau opened Ethereum #22731's current evidence with the exact Turkish task preserved. Current owner matched; one of three service URLs responded; legacy metadata comparability and task suitability remained unknown. Saving preserved that task context.
- Production unsupported physical coffee-roasting request returned HTTP 200 with zero matches, not arbitrary agents.
- Invalid input returned 400 with no-store caching. Custom-task evaluation returned 200, preserved the task and prohibited automatic execution.

## Limits

Discovery uses published descriptions, not live Graph retrieval or a performance benchmark. Generated explanations and trial suggestions can be imperfect and require review. Metadata may contain misleading claims. Custom task suitability is not automatically approved by live HTTP checks. Provider free-tier restrictions caused repeated local 403/429 responses; a later complete production flow succeeded without adding credits. Paid credits are not currently required to use that verified path, but intermittent free-tier limits remain possible. No new sponsor integration has been completed by adding this feature; see the separate track-fit assessment.
