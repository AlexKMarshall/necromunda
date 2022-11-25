import { DomainError } from "../DomainError/DomainError";

class FactionNameAlreadyExistsError extends DomainError {
  public _tag = "FactionNameAlreadyExistsError";
  constructor(public factionName: string) {
    super(`Faction with name ${factionName} already exists`);
  }
}

const of = (name: string): FactionNameAlreadyExistsError =>
  new FactionNameAlreadyExistsError(name);

const is = (e: unknown): e is FactionNameAlreadyExistsError =>
  e instanceof FactionNameAlreadyExistsError;

export const publicMethods = { of, is };
