import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import path from "path";
import { authResolvers, authTypeDefs } from "../auth";
import { taskResolvers, taskTypeDefs } from "../task";

export const commonTypeDefs = readFileSync(
  path.dirname(__filename) + "/common.graphql",
).toString("utf-8");

const typeDefs = [commonTypeDefs, taskTypeDefs, authTypeDefs];

const resolvers = [taskResolvers, authResolvers];

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
