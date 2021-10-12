import MockDate from "mockdate";
import { expect } from "chai";
import { v4 as uuidv4 } from "uuid";
import { createTestSandbox, TestSandbox } from "../utils/sandbox";

describe("Auth GraphQL queries and mutations", () => {
  let sandbox: TestSandbox;

  before(async () => {
    sandbox = await createTestSandbox();
  });

  after(async () => {
    await sandbox.exit();
  });

  afterEach(() => {
    MockDate.reset();
  });

  describe("login", () => {
    it("should return a token given the right credentials", async () => {
      const result = await sandbox.request(
        `query Login($username: String!, $password: String!) { login(username: $username, password: $password) { token } }`,
        {
          variables: {
            username: sandbox.users.regular.username,
            password: sandbox.users.regular.password,
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data)
        .to.have.property("login")
        .that.has.property("token")
        .that.is.a("string");
    });

    it("should return an error given an invalid password", async () => {
      const result = await sandbox.request(
        `query Login($username: String!, $password: String!) { login(username: $username, password: $password) { token } }`,
        {
          variables: {
            username: sandbox.users.regular.username,
            password: "invalid",
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          message: "Invalid login credentials",
          extensions: {
            code: "InvalidLoginCredentialsError",
          },
        },
      ]);
    });

    it("should return an error given an invalid username", async () => {
      const result = await sandbox.request(
        `query Login($username: String!, $password: String!) { login(username: $username, password: $password) { token } }`,
        {
          variables: {
            username: uuidv4(),
            password: "password",
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          message: "Invalid login credentials",
          extensions: {
            code: "InvalidLoginCredentialsError",
          },
        },
      ]);
    });
  });

  describe("userCreate", () => {
    it("should create a user and return it if the user is an admin", async () => {
      const newUsername = "new-user";

      const now = new Date();
      MockDate.set(now);

      const result = await sandbox.request(
        `mutation UserCreate($input: UserCreateInput!) { userCreate(input: $input) { username, isAdmin, createdAt } }`,
        {
          token: sandbox.users.admin.token,
          variables: {
            input: {
              username: newUsername,
              password: "password",
              isAdmin: false,
            },
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        userCreate: {
          username: newUsername,
          createdAt: now.toISOString(),
          isAdmin: false,
        },
      });
    });

    it("should return an error for non-admin users", async () => {
      const result = await sandbox.request(
        `mutation UserCreate($input: UserCreateInput!) { userCreate(input: $input) { username, isAdmin, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: {
            input: {
              username: "new-username",
              password: "password",
              isAdmin: false,
            },
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          message: "Unauthorized",
          extensions: {
            code: "UnauthorizedError",
          },
        },
      ]);
    });
  });
});
