import { pipe } from "fp-ts/function";
import * as D from "io-ts/Decoder";
import { validate, v4 } from "uuid";

type UUIDBrand = {
  readonly UUID: unique symbol;
};

export type UUID = string & UUIDBrand;

export const UUIDDecoder: D.Decoder<unknown, UUID> = pipe(
  D.string,
  D.refine((s): s is UUID => validate(s), "UUID")
);

export const generateUUID = (): UUID => v4() as UUID;
