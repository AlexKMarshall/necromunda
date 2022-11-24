import { pipe, flow } from "fp-ts/function";
import * as D from "io-ts/Decoder";
import * as TE from "fp-ts/TaskEither";
import { generateUUID, UUID } from "@necromunda/types";

type UnvalidatedFaction = {
  name: string;
  description?: string;
};

type FactionIdBrand = {
  readonly FactionId: unique symbol;
};
type FactionId = UUID & FactionIdBrand;

const generateFactionId = (): FactionId => generateUUID() as FactionId;

const FactionDecoder = pipe(
  D.struct({
    name: D.string,
  }),
  D.intersect(
    D.partial({
      description: D.string,
    })
  )
);

type FactionName = D.TypeOf<typeof FactionDecoder>["name"];

type CheckFactionNameExists<NonDomainError> = (
  name: FactionName
) => TE.TaskEither<NonDomainError, boolean>;

class DomainError extends Error {
  public _tag = "DomainError";
  constructor(message?: string) {
    super(message);
  }

  public static of(message?: string): DomainError {
    return new DomainError(message);
  }
}

class FactionNameAlreadyExistsError extends DomainError {
  public _tag = "FactionNameAlreadyExistsError";
  constructor(name: string) {
    super(`Faction with name ${name} already exists`);
  }

  public static of(name: string): FactionNameAlreadyExistsError {
    return new FactionNameAlreadyExistsError(name);
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

export type Faction = D.TypeOf<typeof FactionDecoder> & {
  name: UniqueFactionName;
  id: FactionId;
};

const validateFaction =
  <E>(checkFactionNameExists: CheckFactionNameExists<E>) =>
  (
    unvalidatedFaction: UnvalidatedFaction
  ): TE.TaskEither<
    D.DecodeError | FactionNameAlreadyExistsError | E,
    Faction
  > =>
    pipe(
      unvalidatedFaction,
      FactionDecoder.decode,
      TE.fromEither,
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
