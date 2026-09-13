# NOMEN — Arbitrum Open House Singapore submission packet

Updated September 14, 2026 (Europe/Istanbul). This is a preparation packet, not a completed event submission.

## Saved project

HackQuest project: https://www.hackquest.io/projects/setup/eff2fe9a-44e3-4046-b08e-08b5d567fe44

Created for Metehan İzal as a solo project. Saved: name, 128-character intro, AI/Infra sectors, React/Next/Node/Python/Solidity tags, live site, public repository, updated verification description, honest pre-event progress and solo-builder introduction. Prize-wallet connection and media upload remain pending. The event form has been prepared in the browser, but NOMEN is disabled as Incomplete Project until readiness requirements are met. No final event submission was made.

## Copy-ready event fields

- Project: NOMEN
- Contract address: 0x33D6893fA6015EeecE1d9232A8D0659F42eF669e
- MVP: https://nomen-beta.vercel.app
- Repository: https://github.com/Foreveranka/nomen
- Core contracts: NomenEvaluationRegistry, Arbitrum Sepolia (421614): 0x33D6893fA6015EeecE1d9232A8D0659F42eF669e. Shared ERC-8004 identity registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e (not authored by NOMEN).
- Factory/pool contracts: Not applicable. NOMEN does not deploy a factory or liquidity pool.
- Token contract: No project-issued token. Publication fees use Circle test USDC on Arbitrum Sepolia: 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d (third-party token).
- Work produced during Buildathon: Existing project. Baseline a713f696e3fb9eb7bdd9a7567299f1a78055523f predates the event. No post-start feature is claimed yet. Update this field with actual dated implementation commits before final submission.
- Sponsor technology: No direct OpenZeppelin import was found in NOMEN contract source in this check. Do not claim sponsor usage from a vendored dependency alone. Select only integrations confirmed in the actual implementation; otherwise use Have not used any.
- Candidate prize selections: Overall Prize; Promising Products Track; Grants. Check final eligibility/terms before submission. Grant funding is discretionary and does not mean a grant is awarded.

## Provenance

NOMEN was previously submitted to ETHOnline 2026 (owner confirmation). All current functionality is pre-existing for this event. Preserve both the September 12 baseline tag and the September 13 source baseline above. Do not backdate commits or describe preparation as a new buildathon feature. Event start is announced as September 14; the final cutoff/timezone and any restrictions on reusing a previous entry require confirmation.

## Fresh verification

- 49 application/database tests passed without skips in the comprehensive verification run. See verification/tests-with-db.log. The earlier application-tests.log is retained as historical evidence, not the final count. The subsequent recall fix passed all 6 discovery tests, plus build and lint.
- 30 Foundry contract tests passed, including 5 evaluation-registry tests and registrar fuzz tests.
- Live /api/evaluations?chain=arbitrum&agentId=205 returned one inconclusive historical receipt. See live-history.json.
- Public RPC confirmed chain 421614, deployed contract bytecode and successful historical receipt. See live-chain-check.json.
- Superseding funding check: the operator received 0.489959234975732 test ETH and 20 test USDC. A separate test payer was funded with 0.001 test ETH and 5 test USDC. Actual 5-USDC payment, production publication, author-signed resolution without another payment, and public API readback all passed. See payment-smoke.json. This is a synthetic test, not a purchase or customer complaint.
- Prior source verification is recorded as Sourcify exact match; fresh Arbiscan source verification was not established.

These checks do not certify agent performance, complaint truth, purchase verification or exhaustive security.

## Evidence links

- Historical receipt: https://sepolia.arbiscan.io/tx/0x363f1eada0965113596960b3551d4678d38df76bac6776ae89be436b78e2307c
- Contract: https://sepolia.arbiscan.io/address/0x33D6893fA6015EeecE1d9232A8D0659F42eF669e
- Public history: https://nomen-beta.vercel.app/agent/arbitrum/205/trust
- Sourcify: https://repo.sourcify.dev/421614/0x33D6893fA6015EeecE1d9232A8D0659F42eF669e

## Media

Project setup requests up to four screenshots at 500x300 or 1280x720, and exposes separate Demo Video and Pitch Video fields. The exact video duration/narration requirements have not been confirmed. Do not copy ETHGlobal restrictions automatically.

Four upload-ready 1280x720 captures: landing.png, matching.png, trust-history.png, orders.png. Additional search.png and resolution-history.png support the demo. All show the real deployed application. Orders now shows the resolved TEST #206 complaint with its verified payment link. Existing logo is ../nomen-logo.png. Browser file choosers timed out; no successful upload is claimed.

NOMEN-Arbitrum-Demo.mp4 in the desktop submission packet is a 120-second, 1920x1080 screenshot-guided walkthrough with English subtitles and selected excerpts of Mete’s existing human-recorded voice. No cloned/generated voice, music or fabricated transaction is used. It shows the existing application and completed TEST workflow, not a continuous live execution or the proposed onchain extension. See demo-edit-manifest.json for exact source-audio excerpts.

## Remaining gates

1. Confirm event terms and treatment of a prior ETHGlobal entry. The linked terms PDF returned HTTP 403 in the web reader; do not attest to unseen terms.
2. COMPLETE: real Arbitrum Sepolia TEST payment, publication and signed resolution verified. Record: https://nomen-beta.vercel.app/orders?id=e9a861ae-5cc8-46db-8835-25cdebd8fd0f
3. Existing projects are explicitly allowed on the event page. Preserve provenance and identify any actual dated changes. A substantive onchain complaint-history extension remains a proposal; it is not a verified mandatory entry condition and is not implemented. Do not falsely claim it.
4. Connect the owner's prize wallet and upload the prepared logo, four screenshots and final demo. Keep progress truthful to actual commits.
5. Complete the event-specific form and final submission after the above. Project creation alone is not event submission.

Sources: https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon and the authenticated project setup/submission forms inspected September 13, 2026.

## Comprehensive verification (14 September 2026 local)

See [verification/README.md](verification/README.md): 49 application/database tests, 30 contract tests, real Arbitrum 5-USDC publication, author edits, registered-owner reply, resolve/reopen, negative authorization and idempotency. ENS/Graph support and wallet-extension UI limitations are explicitly documented. Synthetic test agent #206 and complaint are clearly labeled TEST.

## Submission-session recall regression and fix

The same satellite-search request initially returned a match and then zero candidates. Candidate retrieval matched only complete AI-generated phrases, so paraphrased concepts could miss literal capabilities in a real description. Commit `333bb12` adds bounded literal-request keyword recall, ignores request boilerplate and uses whole words. The model still checks all requested capabilities and must ground its recommendation in the supplied description. No arbitrary fallback recommendation is introduced.

All 6 discovery regression tests passed, including the paraphrasing case and unrelated/substring negatives; build and lint passed. Production `nomen-8n6fjxznb` was deployed to nomen-beta.vercel.app. Three consecutive live API requests all considered four candidates and selected Arbitrum #205; the browser confirmed the same result. See verification/recall-live.json. This is a verified retrieval fix, not a guarantee of deterministic AI ranking for every input.
