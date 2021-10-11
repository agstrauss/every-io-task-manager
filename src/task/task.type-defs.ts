import { readFileSync } from "fs";
import path from "path";

export const taskTypeDefs = readFileSync(
  path.dirname(__filename) + "/task.graphql",
).toString("utf-8");
