import { pipe, flow } from "fp-ts/function";
import * as D from "io-ts/Decoder";
import * as TE from "fp-ts/TaskEither";
import {
  generateUUID,
  stringMaxLength,
  stringMinLength,
  UUID,
} from "@necromunda/types";
import { FactionNameAlreadyExistsError } from "../errors";

type FactionIdBrand = {
  readonly FactionId: unique symbol;
};
type FactionId = UUID & FactionIdBrand;

const generateFactionId = (): FactionId => generateUUID() as FactionId;

export const createFactionInputDecoder = pipe(
  D.struct({
    name: pipe(
      D.string,
      D.compose(pipe(stringMinLength(3), D.intersect(stringMaxLength(50))))
    ),
  }),
  D.intersect(
    D.partial({
      description: pipe(D.string, D.compose(stringMaxLength(500))),
    })
  )
);

type FactionName = D.TypeOf<typeof createFactionInputDecoder>["name"];

type CheckFactionNameExists<NonDomainError> = (
  name: FactionName
) => TE.TaskEither<NonDomainError, boolean>;

class FactionDecodingError extends Error {
  public _tag = "FactionDecodingError";
  constructor(public decodeError: D.DecodeError) {
    super(`Faction decoding error: ${D.draw(decodeError)}`);
  }

  public static of(decodeError: D.DecodeError): FactionDecodingError {
    return new FactionDecodingError(decodeError);
  }
}

type UniqueFactionNameBrand = {
  readonly UniqueFactionName: unique symbol;
};
type UniqueFactionName = FactionName & UniqueFactionNameBrand;

const toUniqueFactionName =
  <E>(checkFactionNameExists: CheckFactionNameExists<E>) =>
  (name: FactionName) =>
    pipe(
      name,
      checkFactionNameExists,
      TE.chainW((exists) =>
        exists
          ? TE.left(FactionNameAlreadyExistsError.of(name))
          : TE.right(name as UniqueFactionName)
      )
    );

export type Faction = D.TypeOf<typeof createFactionInputDecoder> & {
  name: UniqueFactionName;
  id: FactionId;
};

const validateFaction =
  <E>(checkFactionNameExists: CheckFactionNameExists<E>) =>
  (unvalidatedFaction: unknown) =>
    pipe(
      unvalidatedFaction,
      createFactionInputDecoder.decode,
      TE.fromEither,
      TE.mapLeft(FactionDecodingError.of),
      TE.chainW(({ name, ...rest }) =>
        pipe(
          TE.Do,
          TE.apS("name", toUniqueFactionName(checkFactionNameExists)(name)),
          TE.apS("id", TE.right(generateFactionId())),
          TE.map(({ name, id }) => ({ name, id, ...rest }))
        )
      )
    );

export const createFaction = <E>(
  checkFactionNameExists: CheckFactionNameExists<E>
) =>
  flow(
    validateFaction(checkFactionNameExists),
    TE.map((createdFaction) => ({ createdFaction }))
  );
