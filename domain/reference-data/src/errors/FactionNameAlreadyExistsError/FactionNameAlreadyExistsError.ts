import { DomainError } from "../DomainError/DomainError";

export class FactionNameAlreadyExistsError extends DomainError {
  public _tag = "FactionNameAlreadyExistsError";
  constructor(name: string) {
    super(`Faction with name ${name} already exists`);
  }
}

const of = (name: string): FactionNameAlreadyExistsError =>
  new FactionNameAlreadyExistsError(name);

const isError = (e: unknown): e is FactionNameAlreadyExistsError =>
  e instanceof FactionNameAlreadyExistsError;

export const publicMethods = { of, isError };
