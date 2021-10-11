import { createConnection as createTypeORMConnection } from "typeorm";

export const createDBConnection = async ({
  resetDB = false,
}: { resetDB?: boolean } = {}) => {
  const connection = await createTypeORMConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "admin1234",
    database: "every-io-task-manager",
    entities: ["**/*.entity.ts"],
  });
  await connection.synchronize(resetDB);
  return connection;
};
