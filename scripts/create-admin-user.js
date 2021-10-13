require("dotenv").config();
require("ts-node").register();

const { v4: uuidv4 } = require("uuid");
const { createDBConnection } = require("../src/db/connection");
const { User } = require("../src/auth/user.entity");
const { hashPassword } = require("../src/auth/utils");

createDBConnection()
  .then(async (connection) => {
    const password = "admin1234";
    const data = {
      id: uuidv4(),
      createdAt: new Date(),
      username: "admin",
      password: await hashPassword(password),
      isAdmin: true,
    };
    await connection.getRepository(User).insert(data);
    console.log(
      `Admin user created with\nusername: ${data.username}\npassword: ${password}`,
    );
  })
  .then()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
