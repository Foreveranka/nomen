# NOMEN registry indexes

Indexes ERC-8004 identity, reputation and validation events plus the replacement NOMEN registrar at `0x481d5fbd6f7B955D34Dbe3069B30dFFd3C15E81C`, deployed at block 11678998.

```sh
npm ci
npm run codegen
npm run build
npx graph deploy nomen --version-label v0.3.0
```

Authenticate Graph CLI using the Studio deployment key stored outside the repository. Do not put credentials in command arguments or the manifest. Deployment to Studio and publishing on the decentralized network are separate actions; publishing has not been requested here.

Set the returned HTTPS query endpoint as the server-only `NOMEN_SUBGRAPH_URL` in the site. Optional gateway authorization uses `NOMEN_SUBGRAPH_KEY`. Do not expose either key in `NEXT_PUBLIC_*` variables.

The app requests indexed events through `/api/activity?chain=sepolia&agentId=10226`. It reports the indexed block, freshness and unavailable states. AI discovery retrieves descriptions from snapshots but requires fresh current and historical Graph evidence for Sepolia candidate eligibility and AI ranking. Immutable `IdentityCheckpoint` rows preserve owner/URI after every registration, URI update and transfer. Queries select the last checkpoint at or before the snapshot block, ordered by block and log index. This avoids dependence on mutable entity history, which the Studio server may prune despite the manifest retention hint. Neither index freshness nor feedback count is a task-quality guarantee. `NomenName.live` means the indexed name has not been revoked; use the registrar's `isNamed` for current root, ownership and expiry validation.

Run `node scripts/test-graph.mjs` from `../site` after deployment. It checks that the index has reached the real claim block and that agent #10226, its owner, registration block and claimed name match chain evidence. Exit code 2 means indexing is still catching up, not successful verification.

Deployed Studio version: `v0.3.0`. Query endpoint: `https://api.studio.thegraph.com/query/1760110/nomen/v0.3.0`. Deployment CID: `QmTT9Suxj7AAatvRSWUMrtbzcarPsw4st5QiDBcWSCXtoj`. Read `_meta` for current indexing progress.

## Arc Testnet catalog index

`subgraph.arc.yaml` uses network `arc-testnet` (5042002), generated from `arc-scope.json` by `node scripts/build-arc-manifest.mjs`. It covers exactly 249 listed NOMEN catalog IDs through indexed event-topic filters, not the entire Arc registry. New IDs require a reviewed scope update and redeployment. `Registry` totals refer only to that scope. Validation requests and responses are both filtered by agent ID. There is no Arc ENS registrar data source.

Identity, reputation and validation start at verified deployment blocks 29241340, 29241344 and 29241349. The September 11 catalog baseline is 61552064. To build and deploy:

```sh
npx graph codegen subgraph.arc.yaml
npx graph build subgraph.arc.yaml
npx graph deploy nomen-arc subgraph.arc.yaml --version-label v0.1.1
```

Create `nomen-arc` in the same Studio account first. Set the returned endpoint as `NOMEN_ARC_SUBGRAPH_URL`, with optional `NOMEN_ARC_SUBGRAPH_KEY`. `/api/activity?chain=arc&agentId=40` reads Arc history. Discovery requires fresh current and snapshot identity checkpoints on both supported networks. Failures are isolated per network; an Arc outage never suppresses eligible Sepolia records or promotes an Arc snapshot to live evidence.

The catalog was refreshed with `tarayici/refresh_arc_catalog.py` and reviewed before local publication using `tarayici/publish_arc_catalog.py`. Public scope and snapshot evidence: `/veri/arc/catalog-refresh.json`. Existing excluded records remain legacy observations.
