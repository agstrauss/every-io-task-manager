import { ApolloServer } from "apollo-server";
import { schema } from "./graphql";

export const startServer = async () => {
  const server = new ApolloServer({
    schema,
  });

  const { url } = await server.listen();
  console.log(`Server listening in ${url}`);
}
