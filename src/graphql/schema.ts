import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import path from "path";
import { taskResolvers, taskTypeDefs } from "../task";

export const commonTypeDefs = readFileSync(
  path.dirname(__filename) + "/common.graphql",
).toString("utf-8");

const typeDefs = [commonTypeDefs, taskTypeDefs];

const resolvers = [taskResolvers];

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
