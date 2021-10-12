import { v4 as uuidv4 } from "uuid";
import { requireAuthorization } from "../auth/utils";
import { RecordNotFoundError } from "../common/errors";
import { Resolvers } from "../graphql";
import { InvalidStatusTransitionError } from "./errors";
import { Task, TASK_STATUSES, TaskStatus } from "./task.entity";

const statusTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TASK_STATUSES.TODO]: [
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.DONE,
    TASK_STATUSES.ARCHIVED,
  ],
  [TASK_STATUSES.IN_PROGRESS]: [
    TASK_STATUSES.TODO,
    TASK_STATUSES.DONE,
    TASK_STATUSES.ARCHIVED,
  ],
  [TASK_STATUSES.DONE]: [
    TASK_STATUSES.TODO,
    TASK_STATUSES.IN_PROGRESS,
    TASK_STATUSES.ARCHIVED,
  ],
  [TASK_STATUSES.ARCHIVED]: [],
};

export const taskResolvers: Resolvers = {
  Query: {
    taskAll: async (_parent, _args, ctx) => {
      const user = requireAuthorization(ctx.user);
      return ctx.dbConnection.getRepository(Task).find({
        relations: ["user"],
        where: { user: { id: user.id } },
      });
    },
    taskOne: async (_parent, args, ctx) => {
      const user = requireAuthorization(ctx.user);
      const task = await ctx.dbConnection
        .getRepository(Task)
        .findOne(args.taskId, { relations: ["user"] });

      if (!task || task.user.id !== user.id) {
        throw new RecordNotFoundError("Task", args.taskId);
      }

      return task;
    },
  },
  Mutation: {
    taskCreate: async (_parent, args, ctx) => {
      const user = requireAuthorization(ctx.user);
      return await ctx.dbConnection
        .getRepository(Task)
        .create({
          id: uuidv4(),
          createdAt: new Date(),
          status: TASK_STATUSES.TODO,
          title: args.input.title,
          description: args.input.description,
          user,
        })
        .save();
    },
    taskUpdateStatus: async (_parent, args, ctx) => {
      const user = requireAuthorization(ctx.user);
      const task = await ctx.dbConnection
        .getRepository(Task)
        .findOne(args.taskId, { relations: ["user"] });

      if (!task || task.user.id !== user.id) {
        throw new RecordNotFoundError("Task", args.taskId);
      }

      const validStatuses = statusTransitions[task.status];
      if (!validStatuses.includes(args.taskStatus)) {
        throw new InvalidStatusTransitionError(
          task.id,
          task.status,
          args.taskStatus,
        );
      }

      task.status = args.taskStatus;
      await task.save();

      return task;
    },
  },
};
