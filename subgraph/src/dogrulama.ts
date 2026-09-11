import { ValidationRequest, ValidationResponse } from "../generated/ValidationRegistry/ValidationRegistry";
import { Validation } from "../generated/schema";
import { ajanBulYaDaAc, kayitDefteri, BIR } from "./ortak";

export function handleValidationRequest(olay: ValidationRequest): void {
  let a = ajanBulYaDaAc(olay.params.agentId, olay);
  let v = new Validation(olay.params.requestHash.toHexString());
  v.agent = a.id;
  v.validator = olay.params.validatorAddress;
  v.requestURI = olay.params.requestURI;
  v.requestedAt = olay.block.timestamp;
  v.save();

  let r = kayitDefteri();
  r.validationsRequested = r.validationsRequested.plus(BIR);
  r.save();
}

export function handleValidationResponse(olay: ValidationResponse): void {
  let v = Validation.load(olay.params.requestHash.toHexString());
  if (v == null) {
    let a = ajanBulYaDaAc(olay.params.agentId, olay);
    v = new Validation(olay.params.requestHash.toHexString());
    v.agent = a.id;
    v.validator = olay.params.validatorAddress;
    v.requestURI = "";
    v.requestedAt = olay.block.timestamp;
  }
  let firstResponse = v.respondedAt === null;
  v.response = olay.params.response;
  v.responseURI = olay.params.responseURI;
  v.tag = olay.params.tag;
  v.respondedAt = olay.block.timestamp;
  v.save();

  let r = kayitDefteri();
  if (firstResponse) r.validationsAnswered = r.validationsAnswered.plus(BIR);
  r.save();
}
