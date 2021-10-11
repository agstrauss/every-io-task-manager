import { Connection } from "typeorm";
import { AsyncReturnType } from "./utils/types";

export const createRequestContext = (dbConnection: Connection) => ({
  dbConnection,
});

export type RequestContext = AsyncReturnType<typeof createRequestContext>;
