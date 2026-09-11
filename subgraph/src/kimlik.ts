import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Registered, URIUpdated, MetadataSet, Transfer } from "../generated/IdentityRegistry/IdentityRegistry";
import { Agent, AgentMetadata, IdentityCheckpoint } from "../generated/schema";
import { ajanBulYaDaAc, ajanKimlik, kayitDefteri, BIR, SIFIR } from "./ortak";

function checkpoint(agent: Agent, event: ethereum.Event): void {
  let row = new IdentityCheckpoint(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  row.agentKey = agent.id;
  row.owner = agent.owner;
  row.agentURI = agent.agentURI;
  row.block = event.block.number;
  row.position = event.block.number.times(BigInt.fromString("4294967296")).plus(event.logIndex);
  row.save();
}

export function handleRegistered(olay: Registered): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  a.owner = olay.params.owner;
  a.agentURI = olay.params.agentURI;
  a.registeredAt = olay.block.timestamp;
  a.registeredIn = olay.block.number;
  a.lastUpdatedAt = olay.block.timestamp;
  a.save();
  checkpoint(a, olay);
}

/** How often an agent repoints its metadata is a fact worth keeping: a record that
 *  changes what it claims to be is different from one that never moved. */
export function handleURIUpdated(olay: URIUpdated): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  a.agentURI = olay.params.newURI;
  a.uriUpdates = a.uriUpdates.plus(BIR);
  a.lastUpdatedAt = olay.block.timestamp;
  a.save();
  checkpoint(a, olay);
}

export function handleMetadataSet(olay: MetadataSet): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  let id = ajanKimlik(olay.params.agentId) + "-" + olay.params.metadataKey;
  let m = AgentMetadata.load(id);
  if (m == null) {
    m = new AgentMetadata(id);
    m.agent = a.id;
    m.key = olay.params.metadataKey;
  }
  m.value = olay.params.metadataValue;
  m.updatedAt = olay.block.timestamp;
  m.save();
  a.lastUpdatedAt = olay.block.timestamp;
  a.save();
}

export function handleTransfer(olay: Transfer): void {
  let sifir = Bytes.fromHexString("0x0000000000000000000000000000000000000000");
  if (olay.params.from.equals(sifir)) return;   // mint; Registered zaten işliyor
  let a = ajanBulYaDaAc(olay.params.tokenId, olay);
  a.owner = olay.params.to;
  a.transfers = a.transfers.plus(BIR);
  a.lastUpdatedAt = olay.block.timestamp;
  a.save();
  checkpoint(a, olay);
}
