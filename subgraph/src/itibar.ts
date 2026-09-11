import { BigInt } from "@graphprotocol/graph-ts";
import { NewFeedback, FeedbackRevoked } from "../generated/ReputationRegistry/ReputationRegistry";
import { Feedback, AgentClient } from "../generated/schema";
import { ajanBulYaDaAc, ajanKimlik, kayitDefteri, BIR } from "./ortak";

function geriBildirimKimlik(agentId: BigInt, client: string, index: BigInt): string {
  return ajanKimlik(agentId) + "-" + client + "-" + index.toString();
}

export function handleNewFeedback(olay: NewFeedback): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  let id = geriBildirimKimlik(olay.params.agentId, olay.params.clientAddress.toHexString(), olay.params.feedbackIndex);
  let f = new Feedback(id);
  f.agent = a.id;
  f.client = olay.params.clientAddress;
  f.index = olay.params.feedbackIndex;
  f.value = olay.params.value;
  f.valueDecimals = olay.params.valueDecimals;
  f.tag1 = olay.params.tag1;
  f.tag2 = olay.params.tag2;
  f.endpoint = olay.params.endpoint;
  f.feedbackURI = olay.params.feedbackURI;
  f.createdAt = olay.block.timestamp;
  f.revoked = false;
  f.save();

  a.feedbackCount = a.feedbackCount.plus(BIR);
  // Ayrı yorumcu sayısı, indeks varsayımıyla değil, (ajan, istemci) çiftini görerek sayılır.
  let ciftId = ajanKimlik(olay.params.agentId) + "-" + olay.params.clientAddress.toHexString();
  if (AgentClient.load(ciftId) == null) {
    let c = new AgentClient(ciftId);
    c.agent = a.id;
    c.client = olay.params.clientAddress;
    c.firstSeenAt = olay.block.timestamp;
    c.save();
    a.distinctClients = a.distinctClients.plus(BIR);
  }
  a.save();

  let r = kayitDefteri();
  r.feedbackTotal = r.feedbackTotal.plus(BIR);
  r.save();
}

export function handleFeedbackRevoked(olay: FeedbackRevoked): void {
  let id = geriBildirimKimlik(olay.params.agentId, olay.params.clientAddress.toHexString(), olay.params.feedbackIndex);
  let f = Feedback.load(id);
  if (f == null || f.revoked) return;
  f.revoked = true;
  f.revokedAt = olay.block.timestamp;
  f.save();

  let r = kayitDefteri();
  r.feedbackRevoked = r.feedbackRevoked.plus(BIR);
  r.save();
}
