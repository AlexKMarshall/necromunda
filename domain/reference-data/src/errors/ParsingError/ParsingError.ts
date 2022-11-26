import { DomainError } from "../DomainError/DomainError";
import { z } from "zod";

/**
 * @internal
 */
export class ParsingError<T = unknown> extends DomainError {
  public _tag = "ParsingError";
  public errors: z.typeToFlattenedError<T>;
  constructor(schemaName: string, zodError: z.ZodError<T>) {
    super(`Error decoding ${schemaName}`);

    this.errors = zodError.flatten();
  }
}

const of =
  <T = unknown>(schemaName: string) =>
  (zodError: z.ZodError<T>): ParsingError<T> =>
    new ParsingError<T>(schemaName, zodError);

const is = (e: unknown): e is ParsingError => e instanceof ParsingError;

export const publicMethods = { of, is };
