import { createDBConnection } from "./db/connection";
import { startServer } from "./server";

createDBConnection()
  .then(startServer)
  .catch((e) => console.error(`Error starting server: ${e.message}`));
