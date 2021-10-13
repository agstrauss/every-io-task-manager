import { createConnection as createTypeORMConnection } from "typeorm";
import config from "../config";

export const createDBConnection = async ({
  name,
  resetDB = false,
}: { resetDB?: boolean; name?: string } = {}) => {
  const connection = await createTypeORMConnection({
    name,
    type: "postgres",
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    entities: ["**/*.entity.ts", "**/*.entity.js"],
  });
  await connection.synchronize(resetDB);
  return connection;
};
