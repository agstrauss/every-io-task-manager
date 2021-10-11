import { v4 as uuidv4 } from "uuid";
import { RecordNotFoundError } from "../common/errors";
import { Resolvers } from "../graphql";
import { Task, TaskStatus } from "./task.entity";

export const taskResolvers: Resolvers = {
  Query: {
    taskAll: async (_parent, _args, ctx) => {
      return ctx.dbConnection.getRepository(Task).find();
    },
    taskOne: async (_parent, args, ctx) => {
      const task = await ctx.dbConnection
        .getRepository(Task)
        .findOne(args.taskId);
      if (!task) {
        throw new RecordNotFoundError("Task", args.taskId);
      }
      return task;
    },
  },
  Mutation: {
    taskCreate: async (_parent, args, ctx) => {
      return await ctx.dbConnection
        .getRepository(Task)
        .create({
          id: uuidv4(),
          createdAt: new Date(),
          status: TaskStatus.TODO,
          title: args.input.title,
          description: args.input.description,
        })
        .save();
    },
  },
};
