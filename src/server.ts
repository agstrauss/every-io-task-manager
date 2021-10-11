import { ApolloError, ApolloServer } from "apollo-server";
import { GraphQLError } from "graphql";
import { ApiError } from "./common/errors";
import { createDBConnection } from "./db/connection";
import { schema } from "./graphql";
import { createRequestContext } from "./request-context";

export const startServer = async () => {
  const dbConnection = await createDBConnection();

  const apolloServer = new ApolloServer({
    schema,
    formatError,
    context: () => createRequestContext(dbConnection),
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
