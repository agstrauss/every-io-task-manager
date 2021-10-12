import { expect } from "chai";
import MockDate from "mockdate";
import { v4 as uuidv4 } from "uuid";
import { Task, TASK_STATUSES, TaskStatus } from "../../src/task/task.entity";
import { createTestSandbox, TestSandbox } from "../utils/sandbox";

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
      const task = await createTestTask(sandbox, sandbox.users.regular.id);

      const result = await sandbox.request(
        `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: { id: task.id },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        taskOne: {
          id: task.id,
          title: task.title,
          description: task.description,
          createdAt: task.createdAt.toISOString(),
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
      const task = await createTestTask(sandbox, sandbox.users.admin.id);

      const result = await sandbox.request(
        `query TaskOne($id: ID!) { taskOne(taskId: $id) { id, title, description, createdAt } }`,
        {
          token: sandbox.users.regular.token,
          variables: { id: task.id },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          extensions: {
            code: "RecordNotFoundError",
            entityName: "Task",
            id: task.id,
          },
          message: `Task with id ${task.id} not found`,
        },
      ]);
    });
  });

  describe("taskAll", () => {
    it("should return all tasks for the user", async () => {
      await clearTasks(sandbox, sandbox.users.admin.id);
      const adminTasks = await createManyTasks(
        sandbox,
        sandbox.users.admin.id,
        3,
      );
      await createTestTask(sandbox, sandbox.users.regular.id);

      const result = await sandbox.request(
        `query TaskAll { taskAll { id, title, description, createdAt } }`,
        {
          token: sandbox.users.admin.token,
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        taskAll: adminTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          createdAt: task.createdAt.toISOString(),
        })),
      });
    });

    it("should return an error for unauthorized users", async () => {
      const result = await sandbox.request(
        `query TaskAll { taskAll { id, title, description, createdAt } }`,
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

  describe("taskUpdateStatus", () => {
    it("should update the status and return the updated task", async () => {
      const task = await createTestTask(sandbox, sandbox.users.regular.id);

      const result = await sandbox.request(
        `mutation TaskUpdateStatus($taskId: ID!, $taskStatus: TaskStatus!) { taskUpdateStatus(taskId: $taskId, taskStatus: $taskStatus) { id, status } }`,
        {
          token: sandbox.users.regular.token,
          variables: {
            taskId: task.id,
            taskStatus: "IN_PROGRESS",
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.be.undefined;
      expect(result.body.data).to.eql({
        taskUpdateStatus: {
          id: task.id,
          status: "IN_PROGRESS",
        },
      });

      const dbTask = await sandbox.dbConnection
        .getRepository(Task)
        .findOne({ relations: ["user"], where: { id: task.id } });
      expect(dbTask?.status).to.equal("IN_PROGRESS");
    });

    it("should return an error for invalid status transitions", async () => {
      const invalidTransitions = {
        [TASK_STATUSES.ARCHIVED]: Object.values(TASK_STATUSES),
        [TASK_STATUSES.TODO]: [TASK_STATUSES.TODO],
        [TASK_STATUSES.IN_PROGRESS]: [TASK_STATUSES.IN_PROGRESS],
        [TASK_STATUSES.DONE]: [TASK_STATUSES.DONE],
      };

      for (const [fromStatus, toStatuses] of Object.entries(
        invalidTransitions,
      ) as Array<[TaskStatus, TaskStatus[]]>) {
        for (const toStatus of toStatuses) {
          const task = await createTestTask(sandbox, sandbox.users.regular.id, {
            status: fromStatus,
          });

          const result = await sandbox.request(
            `mutation TaskUpdateStatus($taskId: ID!, $taskStatus: TaskStatus!) { taskUpdateStatus(taskId: $taskId, taskStatus: $taskStatus) { id, status } }`,
            {
              token: sandbox.users.regular.token,
              variables: {
                taskId: task.id,
                taskStatus: toStatus,
              },
            },
          );

          expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
          expect(result.body.errors).to.eql([
            {
              message: `Invalid status transition from ${fromStatus} to ${toStatus} for task ${task.id}`,
              extensions: {
                code: "InvalidStatusTransitionError",
                taskId: task.id,
                statusFrom: fromStatus,
                statusTo: toStatus,
              },
            },
          ]);

          const dbTask = await sandbox.dbConnection
            .getRepository(Task)
            .findOne({ relations: ["user"], where: { id: task.id } });
          expect(dbTask?.status).to.equal(fromStatus);
        }
      }
    });

    it("should return an error for unauthorized users", async () => {
      const task = await createTestTask(sandbox, sandbox.users.regular.id);

      const result = await sandbox.request(
        `mutation TaskUpdateStatus($taskId: ID!, $taskStatus: TaskStatus!) { taskUpdateStatus(taskId: $taskId, taskStatus: $taskStatus) { id, status } }`,
        {
          variables: {
            taskId: task.id,
            taskStatus: TASK_STATUSES.IN_PROGRESS,
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

    it("should return an error for invalid task ids", async () => {
      const invalidId = uuidv4();

      const result = await sandbox.request(
        `mutation TaskUpdateStatus($taskId: ID!, $taskStatus: TaskStatus!) { taskUpdateStatus(taskId: $taskId, taskStatus: $taskStatus) { id, status } }`,
        {
          token: sandbox.users.regular.token,
          variables: {
            taskId: invalidId,
            taskStatus: TASK_STATUSES.IN_PROGRESS,
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          message: `Task with id ${invalidId} not found`,
          extensions: {
            code: "RecordNotFoundError",
            entityName: "Task",
            id: invalidId,
          },
        },
      ]);
    });

    it("should return an error for tasks that don't belong to the user", async () => {
      const task = await createTestTask(sandbox, sandbox.users.admin.id);

      const result = await sandbox.request(
        `mutation TaskUpdateStatus($taskId: ID!, $taskStatus: TaskStatus!) { taskUpdateStatus(taskId: $taskId, taskStatus: $taskStatus) { id, status } }`,
        {
          token: sandbox.users.regular.token,
          variables: {
            taskId: task.id,
            taskStatus: TASK_STATUSES.IN_PROGRESS,
          },
        },
      );

      expect(result.statusCode).to.equal(200, JSON.stringify(result.body));
      expect(result.body.errors).to.eql([
        {
          message: `Task with id ${task.id} not found`,
          extensions: {
            code: "RecordNotFoundError",
            entityName: "Task",
            id: task.id,
          },
        },
      ]);
    });
  });
});

const createTestTask = async (
  sandbox: TestSandbox,
  userId: string,
  {
    title = "Test",
    status = TASK_STATUSES.TODO,
  }: { title?: string; status?: TaskStatus } = {},
) => {
  const data = {
    id: uuidv4(),
    description: "A Test Task",
    createdAt: new Date(),
    user: { id: userId },
    status,
    title,
  };
  await sandbox.dbConnection.getRepository(Task).insert(data);
  return data;
};

const createManyTasks = async (
  sandbox: TestSandbox,
  userId: string,
  count: number,
) =>
  Promise.all(
    new Array(count).fill(null).map((_, i) =>
      createTestTask(sandbox, userId, {
        title: `Test ${i}`,
      }),
    ),
  );

const clearTasks = async (sandbox: TestSandbox, userId: string) =>
  sandbox.dbConnection.getRepository(Task).delete({ user: { id: userId } });
