import { readFileSync } from "fs";
import path from "path";

export const authTypeDefs = readFileSync(
  path.dirname(__filename) + "/auth.graphql",
).toString("utf-8");
