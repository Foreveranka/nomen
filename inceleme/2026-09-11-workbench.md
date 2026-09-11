# NOMEN: discovery to a job decision

## Implemented

1. **Usability evidence:** `/workbench` and `POST /api/evaluate` read current ownership and metadata, compare the published document hash, probe up to three declared public HTTPS URLs, and disclose self-declared job matching. A reachable A2A-shaped card is a separate required gate for trial shortlisting. An ordinary successful web request cannot pass that gate. This is not an executed task benchmark or authenticated capability claim.
2. **Evidence lifecycle:** reports expire after 15 minutes. Saved records can be manually rechecked; owner, metadata, service and decision changes are compared. Changed fingerprints or failed rechecks invalidate the saved trial review. Up to eight previous observations per record are stored locally. No monitoring runs while the page is closed, and this feature does not alter or revoke ENS names.
3. **Consumer workflow:** choose wallet reporting, research or payments; inspect evidence; follow a sample task with acceptance criteria; record a user-reported trial review; save and export evidence. The CLI consumer routes results to controlled trial, manual review or hold. Expired or malformed responses fail closed. Automatic execution and payment approval are always disabled.

## Validation

- 11 focused tests passed: required evidence, missing interface, changed ownership/metadata, unavailable RPC, payment restrictions, comparison, expiration and private-network URL rejection.
- ESLint and local Next.js production build passed. Build retains a dependency warning from viem/ox Tempo imports.
- Browser verified local evaluation, saving, persistence after reload, rechecking, observation history and network selection synchronization.
- Invalid null/prototype/negative-ID API input returned 400; oversized input returned 413.
- Real Sepolia observations included reachable service URLs and unavailable/404 URLs. These were not represented as successful task execution.
- Production verification exposed HTTP 429 responses from the original IPFS gateway. The metadata reader now tries two fixed public gateways with four-second deadlines each, retaining the same DNS/IP restrictions and full snapshot-hash comparison.

## Boundaries

Reports are unsigned; exported JSON is not an attestation. Trial notes and acceptance are user-reported. MCP discovery/execution is not implemented. The public HTTP reader blocks private IPv4 destinations, pins vetted DNS results, does not follow redirects, and limits request time and response size. This focused verification does not replace a full repository security audit. Existing ENS deployment, demo and hackathon submission requirements remain separate.

## Production

Deployment `dpl_4NnwiZRbxNRgrf7VQoNwa4D9qKc4` is READY at https://nomen-beta.vercel.app. The final remote build passed. Browser-to-API evaluation and the CLI consumer were exercised against production. Sepolia #461 returned matching ownership and metadata but unavailable service evidence, correctly requiring review. IPFS-backed #2364 still could not retrieve metadata from production despite a successful direct local Pinata fetch; it remains unknown, with trial approval disabled. Gateway fallback improves coverage but does not guarantee availability.
