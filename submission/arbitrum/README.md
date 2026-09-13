# NOMEN — Arbitrum Open House Singapore submission packet

Prepared September 13, 2026. This is a preparation packet, not a completed event submission.

## Saved project

HackQuest project: https://www.hackquest.io/projects/setup/eff2fe9a-44e3-4046-b08e-08b5d567fe44

Created for Metehan İzal as a solo project. Saved: name, 128-character intro, AI/Infra sectors, React/Next/Node/Python/Solidity tags, live site, public repository, project description and honest pre-event progress. Prize-wallet connection and media remain pending. No final event submission was made.

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

- 47 application tests passed; 2 database tests skipped without DATABASE_URL. Full log: application-tests.log.
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

Fresh 1280x720 captures: landing.png, trust-history.png, orders.png. These show the actual existing application, not new event work. The Orders capture is not proof of a completed Arbitrum payment. Existing logo is ../nomen-logo.png. Logo upload hit a browser file-chooser timeout; no successful upload is claimed.

A new Arbitrum demo should show: task search → Arbitrum agent identity → historical receipt → TEST complaint payment → published record → signed resolution. Do not film a successful transfer/resolution until it has really completed. Existing ETHGlobal video is baseline material and is not a demo of the proposed new Arbitrum feature.

## Remaining gates

1. Confirm event terms and treatment of a prior ETHGlobal entry. The linked terms PDF returned HTTP 403 in the web reader; do not attest to unseen terms.
2. COMPLETE: real Arbitrum Sepolia TEST payment, publication and signed resolution verified. Record: https://nomen-beta.vercel.app/orders?id=e9a861ae-5cc8-46db-8835-25cdebd8fd0f
3. Implement substantive post-start functionality with normal commits. Proposed scope: Arbitrum complaint commitments and resolution history. Not implemented by this preparation.
4. Connect the owner's prize wallet, finish media upload and final demo, and replace the interim progress field with actual event work.
5. Complete the event-specific form and final submission after the above. Project creation alone is not event submission.

Sources: https://www.hackquest.io/hackathons/Arbitrum-Open-House-Singapore-Online-Buildathon and the authenticated project setup/submission forms inspected September 13, 2026.

## Comprehensive verification (14 September 2026 local)

See [verification/README.md](verification/README.md): 49 application/database tests, 30 contract tests, real Arbitrum 5-USDC publication, author edits, registered-owner reply, resolve/reopen, negative authorization and idempotency. ENS/Graph support and wallet-extension UI limitations are explicitly documented. Synthetic test agent #206 and complaint are clearly labeled TEST.
