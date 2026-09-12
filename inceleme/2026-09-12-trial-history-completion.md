# Trial history, evidence and matching — 2026-09-12

## Implemented

- Arbitrum Sepolia candidates receive live evaluation history before the AI ranking call, using one bounded-time batch RPC read. Other networks keep their existing evidence coverage. RPC failures are explicitly unavailable, never represented as zero receipts.
- Outcome totals use the latest onchain block/log per agent and wallet (case-insensitive). Superseded receipts remain in the full history. Distinct wallets do not establish distinct people.
- AI must acknowledge supplied trial history. Prompts prioritize capabilities, prohibit rewarding raw receipt volume, and describe self-reported outcomes as uncertainty rather than verified performance.
- Successful receipt publication offers a shareable JSON evidence download. Verification reads logs only from the configured receipt registry and checks report/evidence hashes, network, agent, observation block and outcome. Notes remain browser-local until the user shares the file.
- History rows link to verification scoped to their exact evaluation ID. The original reviewer must supply the evidence file; hashes alone cannot recover previous notes.
- Reverted transactions no longer appear as successfully recorded.

## Validation

- 39 Node tests passed, including changed evidence, malformed/oversized files, duplicate wallet outcomes and ranking grounding.
- ESLint and TypeScript passed; production build passed (existing dependency warning in ox/viem).
- Local browser: altered evidence for real Arbitrum transaction 0x363f1eada0965113596960b3551d4678d38df76bac6776ae89be436b78e2307c was rejected. Public history displayed one inconclusive receipt and latest-per-wallet counting text.
- Live RPC: history and transaction receipt readers agreed on agent 205 and both committed hashes.
- Real DeepSeek request: “I need satellite RF observations with Doppler measurements.” returned Orbital Oracle with live trial history and cited its single inconclusive self-reported trial as an unknown.

No new funded transaction or contract deployment was performed. Evidence matching is an integrity check, not independent proof that a task was performed correctly. Public notes hosting and Sybil-resistant human identity are outside this change.

## Production verification

Deployed to https://nomen-beta.vercel.app (deployment dpl_7ZmLuz5ierVxFavKLSWbyKFKAzs1). Evidence page and both receipt APIs returned HTTP 200. The same real AI request returned Orbital Oracle with `trialHistory.status=live` and `trialHistoryConsidered=true` on production.
