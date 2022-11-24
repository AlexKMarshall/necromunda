import type { ActionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { flow, pipe } from "fp-ts/function";
import type { Faction } from "@necromunda/reference-data";
import { createFaction } from "@necromunda/reference-data";
import * as TE from "fp-ts/TaskEither";
import { prisma } from "~/db.server";
import * as T from "fp-ts/Task";

class DBError extends Error {
  public _tag = "DBError";
  constructor(public innerError?: unknown) {
    super("Unexpected database error");
  }

  public static of(innerError?: unknown) {
    return new DBError(innerError);
  }
}

const checkFactionNameExists = (name: string) =>
  pipe(
    TE.tryCatch(
      () => prisma.faction.findUnique({ where: { name } }),
      DBError.of
    ),
    TE.map(Boolean)
  );

const saveFactionToDB = (faction: Faction) =>
  pipe(TE.tryCatch(() => prisma.faction.create({ data: faction }), DBError.of));

const createFactionPipeline = flow(
  createFaction(checkFactionNameExists),
  TE.map(({ createdFaction }) => createdFaction),
  TE.chainW(saveFactionToDB),
  TE.foldW(
    (e) => {
      console.error(e);
      return T.of(e);
    },
    () => T.of({ redirect: "/admin/factions" })
  )
);

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const unvalidatedFactionForm = Object.fromEntries(formData.entries()) as any;

  return createFactionPipeline(unvalidatedFactionForm)();
};

export default function FactionsNewRoute() {
  return (
    <div>
      <h2>New Faction</h2>
      <Form method="post">
        <label>
          Name
          <input type="text" name="name" />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <button type="submit">Create</button>
      </Form>
    </div>
  );
}
