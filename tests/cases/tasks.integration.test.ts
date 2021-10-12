import { expect } from "chai";
import MockDate from "mockdate";
import { v4 as uuidv4 } from "uuid";
import { Task, TaskStatus } from "../../src/task/task.entity";
import { createTestSandbox, TestSandbox } from "../utils/server";

describe("Task GraphQL queries and mutations", () => {
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

  describe("taskCreate", () => {
    it("should create a task assigned to the user and return it", async () => {
      const now = new Date();
      MockDate.set(now);

      const result = await sandbox.request(
        `mutation TaskCreate($input: TaskCreateInput!) { taskCreate(input: $input) { id, title, description, createdAt, status } }`,
        {
          token: sandbox.users.regular.token,
          variables: {
            input: {
              title: "Test",
              description: "A Test Task",
            },
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data.taskCreate)
        .to.include({
          title: "Test",
          description: "A Test Task",
          createdAt: now.toISOString(),
          status: "TODO",
        })
        .and.to.have.property("id")
        .that.is.a("string");

      const { id } = result.body.data.taskCreate;

      const dbTask = await sandbox.dbConnection
        .getRepository(Task)
        .findOne({ relations: ["user"], where: { id } });
      expect(dbTask?.user.id).to.equal(sandbox.users.regular.id);
    });

    it("should return an error for unauthenticated users", async () => {
      const result = await sandbox.request(
        `mutation TaskCreate($input: TaskCreateInput!) { taskCreate(input: $input) { id, title, description, createdAt, status } }`,
        {
          variables: {
            input: {
              title: "Test",
              description: "A Test Task",
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

  describe("taskOne", () => {
    it("should return a task by id", async () => {
      const data = {
        id: uuidv4(),
        title: "Test",
        description: "A Test Task",
        createdAt: new Date(),
        status: TaskStatus.TODO,
        user: sandbox.users.regular,
      };
      await sandbox.dbConnection.getRepository(Task).insert(data);

      const result = await sandbox.request(
        `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: { id: data.id },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        taskOne: {
          id: data.id,
          title: data.title,
          description: data.description,
          createdAt: data.createdAt.toISOString(),
        },
      });
    });

    it("should return a RecordNotFound error if no task exists with the given id", async () => {
      const invalidId = uuidv4();

      const result = await sandbox.request(
        `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: { id: invalidId },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          extensions: {
            code: "RecordNotFoundError",
            entityName: "Task",
            id: invalidId,
          },
          message: `Task with id ${invalidId} not found`,
        },
      ]);
    });

    it("should return a RecordNotFound error if the task does not belong to the user", async () => {
      const data = {
        id: uuidv4(),
        title: "Test",
        description: "A Test Task",
        createdAt: new Date(),
        status: TaskStatus.TODO,
        user: sandbox.users.admin,
      };
      await sandbox.dbConnection.getRepository(Task).insert(data);

      const result = await sandbox.request(
        `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: { id: data.id },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          extensions: {
            code: "RecordNotFoundError",
            entityName: "Task",
            id: data.id,
          },
          message: `Task with id ${data.id} not found`,
        },
      ]);
    });
  });
});
