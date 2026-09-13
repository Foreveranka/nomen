# Arbitrum Sepolia verification — 2026-09-14 (Europe/Istanbul)

Scope: NOMEN production at https://nomen-beta.vercel.app, chain 421614. This is feature verification, not a claim that every network has identical support or that third-party agents complete tasks.

## Verified

| Feature | Evidence / result |
|---|---|
| AI job discovery | Browser request for satellite RF/Doppler/orbit verification returned Orbital Oracle #205 on Arbitrum, with snapshot and live historical trial context distinguished from Graph. |
| Request limits | 501-character request rejected with HTTP 400. UI maximum 500. |
| Live agent evaluation | Production API and browser read current owner, metadata and service URLs. Owner/document matched snapshot. 0/3 provider URLs were available; UI correctly reports More evidence needed and offers no confirmed service link. No service execution claimed. |
| Private trial notes / shortlist | Saved explicit TEST, inconclusive note for #205. Navigation/reload retained note and shortlist; existing user entry preserved. No public rating created. |
| Directory / bulk | Arbitrum has 44 listed snapshot records, 28 declared endpoints. Bulk 205,20,99999999 returned 2 passing metadata records and 1 unknown; unknown filter removed passing rows. Owner API and snapshot API returned expected records. |
| Arbitrum historical receipts | Live API and expanded agent UI showed the existing inconclusive receipt, correct evaluation contract, evidence link and Arbiscan transaction. Receipt endpoint returned the onchain log. |
| Evidence verifier | Entry page and request context inspected; hash/modified-content/chain logic covered by unit tests. File upload through browser automation was not completed. |
| Payment / database lifecycle | Created explicitly synthetic TEST agent #206 owned by the operator, using a second wallet as author. Exact 5 Circle test USDC payment, signed publish, edit, owner reply, resolve, reopen, resolve succeeded. Public browser displays version 6 and complete signed history. |
| Authorization | Non-author edit 403; non-owner reply 403; forged author 401; expired signature 401; cross-origin write 403; stale revision 409; payment belonging to another draft 422. |
| Idempotency / privacy | Unpaid draft public GET 404. Repeated publication retained version and only one payment event. Synthetic record excluded from complaint counters. |
| Contract suites | 30 passed, 0 failed (including 5 evaluation-registry and 18 registrar tests; registrar tests do not imply Arbitrum ENS deployment). |
| Application / database suites | 49 passed, 0 skipped, 0 failed. Database fixtures use transaction-local temporary tables; public reviews untouched. |
| Build / lint | Next.js production build and ESLint passed. |

## Repairs

- Orders previously defaulted to Arc even with Arbitrum selected. New forms now inherit the global network, while explicit link/form selections and recovered payment reservations retain their network.
- Agent cards said `callable` solely because metadata declared an endpoint. Replaced with neutral `endpoint declared`; live evaluation is still required.
- Owner-page directory link now returns to the application directory rather than the landing page. Agent-detail API preview/copy now uses the free snapshot endpoint rather than the optional paid x402 endpoint.
- Added root `.vercelignore` to exclude scanner archives, dependency/build folders and environment files when deploying from the repository root (Vercel rootDirectory is `site`).

## Explicit limitations / incomplete manual coverage

- **ENS claim/renew/revoke:** no Arbitrum registrar/resolver deployment. Claim UI explicitly states Sepolia-only. Not an Arbitrum pass.
- **Graph:** Arbitrum is not indexed by the configured NOMEN subgraphs; `/api/activity` rejects it explicitly. Matching uses snapshots and onchain historical trial receipts, with live RPC checks after selection.
- **x402:** optional API challenge is supported on Base Sepolia, not Arbitrum. HTTP 402 challenge verified only; no x402 settlement attempted in this run. Separate Orders payment genuinely settles on Arbitrum.
- **Wallet extension UI:** test browser has no injected Rabby/MetaMask. Empty-wallet guidance tested. Real EOA signatures and transactions succeeded via the two test wallets, but extension connection, network-switch confirmations, mobile wallet and rejection screens are not end-to-end verified this run.
- **Third-party task execution:** Orbital Oracle URLs were unavailable. Discovery is not service fulfillment, purchase proof or a performance guarantee.
- **Historical review UI:** read-only by design. New ratings remain private; new public actions use paid complaint records. Complaint text, replies and resolution history are in Postgres with wallet signatures; only the fee transaction/original commitment is onchain.
- Browser file upload/download, clipboard permission denial, pagination beyond the available fixtures, contract-wallet (EIP-1271) signing and mobile-extension interactions are not claimed manually verified.

## Public test evidence

- Record: https://nomen-beta.vercel.app/orders?id=dce0898c-312e-4dbb-85ba-1e4246d79aae
- Payment: https://sepolia.arbiscan.io/tx/0x5e4e7db83b261587ce56162f15d082c46005ec490bed907aadea780cabdb34aa
- `signed-lifecycle.json` contains registration/funding/payment hashes, test assertions and final history summary. Test keys remain outside this repository.
- `live-api.json`, `additional-api.json`, `tests-with-db.log`, `contracts.log`, `build.log`, `lint.log` retain execution evidence.
- Initial smoke harness expected 400 for mismatched payment; production correctly returned 422. Harness corrected and full lifecycle completed. This was a test expectation correction, not a server bypass.

## Deployment correction

Post-deploy API checks caught an overbroad `api/` exclusion matching `site/app/api`, causing HTML 404 responses. The rule was removed and other root exclusions anchored. The two in-progress faulty deployments were removed, and the known working deployment was restored to the public alias before the corrected build. This incident is recorded rather than counted as a pass. Final post-deploy results are saved separately.

Final corrected production: `nomen-os9fsso97` (`05fe8fb`), READY. Protected-deployment snapshot and complaint calls returned JSON before alias assignment. After assigning `nomen-beta.vercel.app`, all 8 checks in `post-deploy.json` returned expected JSON: snapshot, complaint, history, owner, archived reviews, AI discovery, bulk, evaluate. AI returned Arbitrum #205; evaluator retained unknown service availability. Browser confirmed inherited Arbitrum payment, explicit Sepolia link override, manual Arc override, and free snapshot link. No data was lost during the temporary routing incident.

## Chrome wallet follow-up — 14 September 2026

User connected the wallet displayed as `0x8Be1…3Dc7`. The real Chrome session shows the connected-wallet button and Profile link. Selecting Arbitrum Sepolia updates the directory and the Orders form/payment network. My records successfully loads this wallet's existing Arc TEST record (`7cf75f6c-45b0-49dd-9758-5a831053c145`), confirming wallet-aware filtering across networks. This supersedes the earlier connection-UI limitation. No new signature or payment was requested from this wallet, so transaction confirmation/rejection screens remain unverified; the app's network label alone is not independent evidence of the wallet's active RPC network.
