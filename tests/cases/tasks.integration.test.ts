import { ApolloServer } from "apollo-server";
import { Server } from "http";
import { default as request } from "supertest";
import { expect } from "chai";
import MockDate from "mockdate";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { startServer } from "../../src/server";
import { Task, TaskStatus } from "../../src/task/task.entity";

describe("Task GraphQL queries and mutations", () => {
  let apolloServer: ApolloServer;
  let httpServer: Server;
  let dbConnection: Connection;

  before(async () => {
    ({ apolloServer, httpServer, dbConnection } = await startServer());
  });

  after(async () => {
    await apolloServer.stop();
  });

  afterEach(() => {
    MockDate.reset();
  });

  describe("tasksCreate", () => {
    it("should create a task and return it", async () => {
      const title = "Test";
      const description = "A Test Task";

      const now = new Date();
      MockDate.set(now);

      const result = await request(httpServer)
        .post("/graphql")
        .send({
          query: `mutation TaskCreate($input: TaskCreateInput!) { taskCreate(input: $input) { title, description, createdAt, status } }`,
          variables: {
            input: {
              title,
              description,
            },
          },
        });

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        taskCreate: {
          title,
          description,
          createdAt: now.toISOString(),
          status: "TODO",
        },
      });
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
      };
      await dbConnection.getRepository(Task).insert(data);

      const result = await request(httpServer)
        .post("/graphql")
        .send({
          query: `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
          variables: { id: data.id },
        });

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

      const result = await request(httpServer)
        .post("/graphql")
        .send({
          query: `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
          variables: { id: invalidId },
        });

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
  });
});
