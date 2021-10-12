export default {
  APP_SECRET: process.env.APP_SECRET || "every-io-secret",
  PORT: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 5432,
  DB_USERNAME: process.env.DB_USERNAME || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_NAME: process.env.DB_NAME || "every-io-task-manager",
};
