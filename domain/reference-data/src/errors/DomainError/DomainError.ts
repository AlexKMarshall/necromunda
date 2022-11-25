export class DomainError extends Error {
  public _tag = "DomainError";
  constructor(message?: string) {
    super(message);
  }
}

const of = (message?: string): DomainError => new DomainError(message);
const isDomainError = (e: unknown): e is DomainError =>
  e instanceof DomainError;

export const publicMethods = { of, isDomainError };
