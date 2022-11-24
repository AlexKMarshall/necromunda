import { json, Response } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { flow } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { prisma } from "~/db.server";

class DBError extends Error {
  public _tag = "DBError";
  constructor(public innerError?: unknown) {
    super("Unexpected database error");
  }

  public static of(innerError?: unknown) {
    return new DBError(innerError);
  }
}

const getFactionCollection = () =>
  TE.tryCatch(
    () => prisma.faction.findMany({ select: { id: true, name: true } }),
    DBError.of
  );

const loaderPipeline = flow(
  getFactionCollection,
  TE.mapLeft((e) => ({ status: "error", error: e })),
  TE.map((data) => ({ status: "success", data })),
  TE.toUnion
);

export const loader = async () => {
  const result = await loaderPipeline()();

  if ("error" in result) {
    console.error(result.error);
    throw new Response(JSON.stringify(result.error), { status: 500 });
  }

  return json(result.data);
};

export default function FactionsRoute() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>Factions</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
