import { BigInt, Bytes, ethereum, dataSource } from "@graphprotocol/graph-ts";
import { Agent, Registry } from "../generated/schema";

export const SIFIR = BigInt.fromI32(0);
export const BIR = BigInt.fromI32(1);

export function kayitDefteri(): Registry {
  let network = dataSource.network() == "arc-testnet" ? "arc" : "sepolia";
  let r = Registry.load(network);
  if (r == null) {
    r = new Registry(network);
    r.agents = SIFIR;
    r.feedbackTotal = SIFIR;
    r.feedbackRevoked = SIFIR;
    r.validationsRequested = SIFIR;
    r.validationsAnswered = SIFIR;
    r.namesLive = SIFIR;
    r.namesRevoked = SIFIR;
  }
  return r as Registry;
}

export function ajanKimlik(agentId: BigInt): string {
  let chain = dataSource.network() == "arc-testnet" ? "5042002" : "11155111";
  return chain + "-" + agentId.toString();
}

/**
 * Feedback and validation can name an agent this subgraph has not seen registered yet,
 * for example when indexing starts after the mint. A stub keeps the relation intact
 * instead of dropping the event.
 */
export function ajanBulYaDaAc(agentId: BigInt, olay: ethereum.Event): Agent {
  let id = ajanKimlik(agentId);
  let a = Agent.load(id);
  if (a == null) {
    a = new Agent(id);
    a.agentId = agentId;
    a.owner = Bytes.fromHexString("0x0000000000000000000000000000000000000000");
    a.agentURI = "";
    a.registeredAt = olay.block.timestamp;
    a.registeredIn = olay.block.number;
    a.uriUpdates = SIFIR;
    a.lastUpdatedAt = olay.block.timestamp;
    a.transfers = SIFIR;
    a.feedbackCount = SIFIR;
    a.distinctClients = SIFIR;
    let r = kayitDefteri();
    r.agents = r.agents.plus(BIR);
    r.save();
    a.save();
  }
  return a as Agent;
}
