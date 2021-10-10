import {startServer} from "./server";

startServer().catch((e) => console.error(`Error starting server: ${e.message}`));
