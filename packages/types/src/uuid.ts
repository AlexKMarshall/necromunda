import { v4 } from "uuid";
import { z } from "zod";

const UUIDSchema = z.string().uuid().brand<"UUID">();
export type UUID = z.TypeOf<typeof UUIDSchema>;

export const generateUUID = () => v4() as UUID;
