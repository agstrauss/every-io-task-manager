import { ApolloError, ApolloServer } from "apollo-server";
import { GraphQLError } from "graphql";
import { Connection } from "typeorm";
import { ApiError } from "./common/errors";
import { schema } from "./graphql";
import { createRequestContext } from "./request-context";

export const startServer = async (dbConnection: Connection) => {
  const apolloServer = new ApolloServer({
    schema,
    formatError,
    context: ({ req }) => createRequestContext(req, dbConnection),
  });

  const { url, server: httpServer } = await apolloServer.listen();
  console.log(`Server listening in ${url}`);

  return { apolloServer, httpServer, dbConnection };
};

const formatError = (err: GraphQLError) => {
  const originalError = err.originalError;
  return originalError instanceof ApiError
    ? new ApolloError(
        originalError.message,
        originalError.constructor.name,
        originalError.getPublicData(),
      )
    : err;
};
