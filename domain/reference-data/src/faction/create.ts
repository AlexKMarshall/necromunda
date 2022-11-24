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

const validateFaction = (unvalidatedFaction: UnvalidatedFaction) =>
  pipe(
    unvalidatedFaction,
    FactionDecoder.decode,
    TE.fromEither,
    TE.chainW(({ name, ...rest }) =>
      pipe(
        TE.Do,
        TE.apS("name", TE.right(name)),
        TE.apS("id", TE.right(generateFactionId())),
        TE.map(({ name, id }) => ({ name, id, ...rest }))
      )
    )
  );

export const createFaction = flow(
  validateFaction,
  TE.map((createdFaction) => ({ createdFaction }))
);
