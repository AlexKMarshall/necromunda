export class DBError extends Error {
  public _tag = "DBError";
  constructor(public innerError?: unknown) {
    super("Unexpected database error");
  }

  public static of(innerError?: unknown) {
    return new DBError(innerError);
  }
}
