import { pipe, flow } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { z } from "zod";
import { generateUUID, UUID } from "@necromunda/types";
import { FactionNameAlreadyExistsError, ParsingError } from "../errors";

type FactionIdBrand = {
  readonly FactionId: unique symbol;
};
type FactionId = UUID & FactionIdBrand;

const generateFactionId = (): FactionId => generateUUID() as FactionId;

export const createFactionSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional().default(""),
});

const fromZodSafeParse = <Output, Input = Output>(
  result: z.SafeParseReturnType<Input, Output>
) =>
  result.success
    ? E.right(result.data)
    : pipe(result.error, ParsingError.of("createFaction"), E.left);

type FactionName = z.infer<typeof createFactionSchema>["name"];

type CheckFactionNameExists<NonDomainError> = (
  name: FactionName
) => TE.TaskEither<NonDomainError, boolean>;

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

export type Faction = z.infer<typeof createFactionSchema> & {
  name: UniqueFactionName;
  id: FactionId;
};

const validateFaction =
  <E>(checkFactionNameExists: CheckFactionNameExists<E>) =>
  (unvalidatedFaction: unknown) =>
    pipe(
      unvalidatedFaction,
      createFactionSchema.safeParse,
      fromZodSafeParse,

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
