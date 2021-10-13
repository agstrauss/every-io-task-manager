import { ApolloServer } from "apollo-server";
import { Server } from "http";
import { default as request } from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../src/auth/user.entity";
import config from "../../src/config";
import { getToken, hashPassword } from "../../src/auth/utils";
import { createDBConnection } from "../../src/db/connection";
import { startServer } from "../../src/server";
import { AsyncReturnType } from "../../src/utils/types";

export type TestSandbox = AsyncReturnType<typeof getTestSandbox>;

type AugmentedUser = User & { token: string; password: string };

let dbConnection: Connection;
let apolloServer: ApolloServer;
let httpServer: Server;
let sandbox: {
  apolloServer: ApolloServer;
  httpServer: Server;
  dbConnection: Connection;
  users: { regular: AugmentedUser; admin: AugmentedUser };
  request: typeof graphQLRequest;
  resetDB: () => Promise<void>;
};

const graphQLRequest = (
  query: string,
  {
    variables,
    token,
  }: { variables?: Record<string, unknown>; token?: string } = {},
) => {
  const req = request(httpServer).post("/graphql").send({
    query,
    variables,
  });
  return token ? req.set("Authorization", `Bearer ${token}`) : req;
};

before(async function () {
  this.timeout(10000);
  dbConnection = await createDBConnection({ resetDB: true });
  ({ apolloServer, httpServer } = await startServer(dbConnection, 4009));

  const users = await createUsers();

  const resetDB = async () => {
    await dbConnection.synchronize(true);
    sandbox.users = await createUsers();
  };

  sandbox = {
    apolloServer,
    httpServer,
    dbConnection,
    users,
    resetDB,
    request: graphQLRequest,
  };
});

after(async () => {
  if (apolloServer) {
    await apolloServer.stop();
  }
  if (dbConnection) {
    await dbConnection.close();
  }
});

const createUsers = async () => {
  const password = "password";

  const userRepository = dbConnection.getRepository(User);
  const { identifiers } = await userRepository.insert([
    {
      id: uuidv4(),
      username: "test-user",
      password: await hashPassword(password),
      createdAt: new Date(),
      isAdmin: false,
    },
    {
      id: uuidv4(),
      username: "test-admin",
      password: await hashPassword(password),
      createdAt: new Date(),
      isAdmin: true,
    },
  ]);
  const testUserRegular = (await userRepository.findOne({
    where: { id: identifiers[0].id },
  }))!;
  const testUserAdmin = (await userRepository.findOne({
    where: { id: identifiers[1].id },
  }))!;

  return {
    regular: {
      ...testUserRegular,
      password,
      token: getToken(testUserRegular.id, config.APP_SECRET),
    } as AugmentedUser,
    admin: {
      ...testUserAdmin,
      password,
      token: getToken(testUserAdmin.id, config.APP_SECRET),
    } as AugmentedUser,
  };
};

export const getTestSandbox = () => sandbox;
