import { NameClaimed, NameRevoked, NameRenewed, RootPublished, NomenRegistrar } from "../generated/NomenRegistrar/NomenRegistrar";
import { Agent, NomenName, Scan } from "../generated/schema";
import { ajanBulYaDaAc, kayitDefteri, ajanKimlik, BIR } from "./ortak";

export function handleNameClaimed(olay: NameClaimed): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  let n = NomenName.load(olay.params.label);
  let wasLive = n != null && n.live;
  if (n != null && n.agent != a.id) {
    let previous = Agent.load(n.agent);
    if (previous != null && previous.name == n.id) { previous.name = null; previous.save(); }
  }
  if (n == null) n = new NomenName(olay.params.label);
  n.label = olay.params.label;
  n.agent = a.id;
  n.owner = olay.params.owner;
  n.tokenId = olay.params.tokenId;
  n.claimedAt = olay.block.timestamp;
  let current = NomenRegistrar.bind(olay.address).try_isNamed(olay.params.agentId);
  n.expiry = current.reverted ? null : current.value.getExpiry();
  n.live = true;
  n.revokedAt = null;
  n.revokeReason = null;
  n.save();
  a.name = n.id;
  a.save();
  let r = kayitDefteri();
  if (!wasLive) r.namesLive = r.namesLive.plus(BIR);
  r.save();
}

export function handleNameRevoked(olay: NameRevoked): void {
  let n = NomenName.load(olay.params.label);
  if (n == null || !n.live || n.agent != ajanKimlik(olay.params.agentId)) return;
  n.live = false;
  n.revokedAt = olay.block.timestamp;
  n.revokeReason = olay.params.reason;
  n.save();
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  a.name = null;
  a.save();
  let r = kayitDefteri();
  r.namesLive = r.namesLive.minus(BIR);
  r.namesRevoked = r.namesRevoked.plus(BIR);
  r.save();
}

export function handleRootPublished(olay: RootPublished): void {
  let s = new Scan(olay.transaction.hash.toHexString() + "-" + olay.logIndex.toString());
  s.root = olay.params.root;
  s.source = olay.params.source;
  s.publishedAt = olay.params.at;
  s.save();
  let r = kayitDefteri();
  r.lastScanRoot = olay.params.root;
  r.lastScanAt = olay.params.at;
  r.save();
}

export function handleNameRenewed(event: NameRenewed): void {
  let agent = ajanBulYaDaAc(event.params.agentId, event);
  let label = agent.name;
  if (label == null) return;
  let name = NomenName.load(label as string);
  if (name == null) return;
  name.expiry = event.params.newExpiry;
  name.save();
}
