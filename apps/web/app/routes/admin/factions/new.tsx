import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { flow, pipe } from "fp-ts/function";
import type { Faction } from "@necromunda/reference-data";
import {
  createFaction,
  FactionNameAlreadyExistsError,
} from "@necromunda/reference-data";
import * as TE from "fp-ts/TaskEither";
import { prisma } from "~/db.server";
import * as T from "fp-ts/Task";
import { DBError } from "~/errors";

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
      if (FactionNameAlreadyExistsError.is(e)) {
        return T.of(
          json(
            { error: `Faction name ${e.factionName} already exists` },
            { status: 400 }
          )
        );
      }
      return T.of(
        json(
          { error: "Something went wrong, please try again later" },
          { status: 500 }
        )
      );
    },
    () => T.of(redirect("/admin/factions"))
  )
);

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const unvalidatedFactionForm = Object.fromEntries(formData.entries());

  return createFactionPipeline(unvalidatedFactionForm)();
};

export default function FactionsNewRoute() {
  const data = useActionData<typeof action>();
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
        {data?.error && <p>{data.error}</p>}
      </Form>
    </div>
  );
}
