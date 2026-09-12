# Arbitrum Open House Singapore 2026 — buildathon feature plan

## Honest starting point

NOMEN is an existing project. The state before the event is preserved at the annotated Git tag `arbitrum-open-house-baseline-2026-09-12`. It already supports agent discovery on Arbitrum Sepolia and wallet-signed evaluation receipts through `NomenEvaluationRegistry`.

The public trust-history implementation was completed on September 12, before the event start. It is a pre-event extension and must not be described as buildathon-period work. Development after the official start will be separated through later commits.

## Buildathon feature: public agent trust history

Create a public Arbitrum trust page for each ERC-8004 agent. The page will turn append-only evaluation receipts into an inspectable history while keeping trial notes offchain.

### User flow

1. Open an Arbitrum agent from NOMEN search or the directory.
2. Review the agent's identity evidence and run a provider-side trial.
3. Record a passed, failed or inconclusive receipt on Arbitrum Sepolia.
4. Open the agent's public trust page.
5. Inspect receipt counts, distinct reviewer wallets, recent outcomes, observation blocks and direct Arbiscan links.
6. Verify each receipt independently against the deployed contract.

### Implemented before the event

- [x] A public, permanent route for each Arbitrum agent's trust history.
- [x] Bounded RPC reads for `EvaluationRecorded` receipts.
- [x] Aggregate counts clearly labelled as wallet-submitted reviews, not NOMEN certifications.
- [x] Distinct-reviewer and recent-activity signals without treating wallet count as proof of personhood.
- [x] Direct links to the contract, receipt transactions and ERC-8004 identity.
- [x] Empty, loading and RPC-failure states.
- [x] Focused application tests for aggregation and misleading-state prevention.
- [x] English documentation and architecture diagram.
- [ ] A short reproducible demo video.

### Acceptance criteria

- A receipt recorded on Arbitrum Sepolia appears on the correct agent page.
- The displayed agent ID, reviewer, outcome, report hash, evidence hash and block values match an independent chain read.
- Multiple receipts aggregate deterministically and retain their individual transaction links.
- Failed or unavailable RPC reads show an unknown state instead of a zero-review claim.
- Private trial notes never enter URLs, logs or onchain calldata.
- The feature works from the public production deployment and can be demonstrated without privileged access.

## Evidence to retain for submission

- Baseline tag, the pre-event trust-history commit and the first post-start implementation commit.
- Contract address, deployment transaction and smoke receipt.
- At least one real end-to-end evaluation receipt created through the public UI.
- Test output and production verification notes.
- Two-to-three-minute demo video showing discovery, trial review, wallet signature and public trust history.
