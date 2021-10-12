import "dotenv/config";
import { createDBConnection } from "./db/connection";
import { startServer } from "./server";
import config from "./config";

createDBConnection()
  .then((dbConnection) => startServer(dbConnection, config.PORT))
  .catch((e) => console.error("Error starting server: ", e));
