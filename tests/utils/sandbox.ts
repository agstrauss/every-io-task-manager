import { default as request } from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { User } from "../../src/auth/user.entity";
import config from "../../src/config";
import { getToken, hashPassword } from "../../src/auth/utils";
import { createDBConnection } from "../../src/db/connection";
import { startServer } from "../../src/server";
import { AsyncReturnType } from "../../src/utils/types";

export type TestSandbox = AsyncReturnType<typeof createTestSandbox>;

let dbConnection: Connection;

export const createTestSandbox = async () => {
  if (dbConnection) {
    await dbConnection.synchronize(true);
  } else {
    dbConnection = await createDBConnection({ resetDB: true });
  }

  const password = "password";

  // TODO: given the scope of this POC, we're resetting the db to run the tests
  const { apolloServer, httpServer } = await startServer(dbConnection);

  const userRepository = dbConnection.getRepository(User);
  const { identifiers } = await userRepository.insert([
    {
      id: uuidv4(),
      username: "user",
      password: await hashPassword(password),
      createdAt: new Date(),
      isAdmin: false,
    },
    {
      id: uuidv4(),
      username: "admin",
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

  const users = {
    regular: {
      ...testUserRegular,
      password,
      token: getToken(testUserRegular.id, config.APP_SECRET),
    },
    admin: {
      ...testUserAdmin,
      password,
      token: getToken(testUserAdmin.id, config.APP_SECRET),
    },
  };

  const exit = async () => {
    await apolloServer.stop();
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

  return {
    apolloServer,
    httpServer,
    dbConnection,
    users,
    exit,
    request: graphQLRequest,
  };
};
