import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { flow, pipe } from "fp-ts/function";
import type { Faction } from "@necromunda/reference-data";
import { CreateFactionDecodingError } from "@necromunda/reference-data";
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
    (e) => T.of(handleFormErrors(e)),
    () => T.of({ success: true })
  )
);

type FormErrors = {
  _tag: "FormErrors";
  fieldErrors?: {
    name?: string[];
    description?: string[];
  };
  formErrors?: string[];
};

type UnexpectedError = {
  _tag: "UnexpectedError";
  unexpectedError: unknown;
};

const handleFormErrors = <E extends unknown>(
  error: E
): FormErrors | UnexpectedError => {
  if (FactionNameAlreadyExistsError.is(error)) {
    return {
      _tag: "FormErrors",
      fieldErrors: {
        name: [`Faction name "${error.factionName}" already exists`],
      },
    };
  }
  if (CreateFactionDecodingError.is(error)) {
    return {
      _tag: "FormErrors",
      formErrors: ["Bad form input"],
    };
  }
  return {
    _tag: "UnexpectedError",
    unexpectedError: "Something went wrong, please try again later",
  };
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const unvalidatedFactionForm = Object.fromEntries(formData.entries());

  const run = createFactionPipeline(unvalidatedFactionForm);
  const result = await run();
  if ("success" in result) {
    return redirect("/admin/factions");
  }
  if (result._tag === "UnexpectedError") {
    throw result.unexpectedError;
  }
  return json(result, { status: 400 });
};

export default function FactionsNewRoute() {
  const errors = useActionData<typeof action>();
  return (
    <div>
      <h2>New Faction</h2>
      <Form method="post">
        <label>
          Name
          <input type="text" name="name" />
        </label>
        {errors?.fieldErrors?.name && (
          <p>{errors.fieldErrors.name.join(", ")}</p>
        )}
        <label>
          Description
          <textarea name="description" />
        </label>
        <button type="submit">Create</button>
        {errors?.formErrors && <p>{errors.formErrors.join(", ")}</p>}
      </Form>
    </div>
  );
}
