import {makeExecutableSchema} from "@graphql-tools/schema";
import {readFileSync} from "fs";
import path from "path";

export const commonTypeDefs = readFileSync(
  path.dirname(__filename) + "/common.graphql",
).toString("utf-8");

const typeDefs = [
  commonTypeDefs,
];

const resolvers: any[] = [];

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
