import * as D from "io-ts/Decoder";
import { DomainError } from "../DomainError/DomainError";

class CreateFactionDecodingError extends DomainError {
  public _tag = "CreateFactionDecodingError";
  constructor(public decodingError: D.DecodeError) {
    super(`Error decoding faction input`);
  }
}

const of = (decodingError: D.DecodeError): CreateFactionDecodingError =>
  new CreateFactionDecodingError(decodingError);

const is = (e: unknown): e is CreateFactionDecodingError =>
  e instanceof CreateFactionDecodingError;

export const publicMethods = { of, is };
