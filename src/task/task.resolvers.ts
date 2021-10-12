import { v4 as uuidv4 } from "uuid";
import { requireAuthorization } from "../auth/utils";
import { RecordNotFoundError } from "../common/errors";
import { Resolvers } from "../graphql";
import { Task, TaskStatus } from "./task.entity";

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
          status: TaskStatus.TODO,
          title: args.input.title,
          description: args.input.description,
          user,
        })
        .save();
    },
  },
};
