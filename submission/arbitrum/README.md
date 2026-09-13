# NOMEN — Arbitrum Open House Singapore submission packet

Updated September 14, 2026 (Europe/Istanbul). **Submitted successfully to the event.** HackQuest showed “Successfully Submit Project”; My Hackathon independently lists NOMEN with Overall Prize, Promising Products Track and Grants. See submission-status.json and verification/submitted-dashboard.png. This is a submission receipt, not an award or eligibility decision.

## Saved project

HackQuest project: https://www.hackquest.io/projects/setup/eff2fe9a-44e3-4046-b08e-08b5d567fe44

Submitted as a solo project by Metehan İzal. The demo was added through HackQuest’s direct Video Link field and verified to load as a 120-second video. Saving brought readiness to **80 / Meets Entry Standard**; the official Go submit flow accepted NOMEN. All required event fields and three prize tracks were submitted, and the account now offers Edit Submission. Earlier assumptions that logo/screenshots or wallet connection necessarily blocked submission were disproved by this successful submission. Those optional profile improvements remain available.

Demo: https://raw.githubusercontent.com/Foreveranka/nomen/6b8c226/submission/arbitrum/demo.mp4

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

## Optional follow-up after submission

- Add the prepared logo and four screenshots when the file chooser is usable. These were not required for the accepted submission flow.
- Connect the owner’s prize wallet before any future reward claim; it was not required to submit.
- Continue genuine dated development and update the existing submission rather than creating a duplicate. Existing projects are allowed; preserve the ETHOnline disclosure and baseline.
- Any future award or grant conditions must be reviewed at that stage. No grant or prize is claimed as awarded.

Sources: https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon and the authenticated project setup/submission forms inspected September 13, 2026.

## Comprehensive verification (14 September 2026 local)

See [verification/README.md](verification/README.md): 49 application/database tests, 30 contract tests, real Arbitrum 5-USDC publication, author edits, registered-owner reply, resolve/reopen, negative authorization and idempotency. ENS/Graph support and wallet-extension UI limitations are explicitly documented. Synthetic test agent #206 and complaint are clearly labeled TEST.

## Submission-session recall regression and fix

The same satellite-search request initially returned a match and then zero candidates. Candidate retrieval matched only complete AI-generated phrases, so paraphrased concepts could miss literal capabilities in a real description. Commit `333bb12` adds bounded literal-request keyword recall, ignores request boilerplate and uses whole words. The model still checks all requested capabilities and must ground its recommendation in the supplied description. No arbitrary fallback recommendation is introduced.

All 6 discovery regression tests passed, including the paraphrasing case and unrelated/substring negatives; build and lint passed. Production `nomen-8n6fjxznb` was deployed to nomen-beta.vercel.app. Three consecutive live API requests all considered four candidates and selected Arbitrum #205; the browser confirmed the same result. See verification/recall-live.json. This is a verified retrieval fix, not a guarantee of deterministic AI ranking for every input.
