import { v4 as uuidv4 } from "uuid";
import { Resolvers } from "../graphql";
import { InvalidLoginCredentialsError } from "./errors";
import { User } from "./user.entity";
import {
  getToken,
  hashPassword,
  isPasswordValid,
  requireAuthorization,
} from "./utils";

export const authResolvers: Resolvers = {
  Query: {
    login: async (_parent, args, ctx) => {
      const user = await ctx.dbConnection
        .getRepository(User)
        .findOne({ where: { username: args.username } });
      if (!user) {
        throw new InvalidLoginCredentialsError();
      }
      if (!(await isPasswordValid(args.password, user.password))) {
        throw new InvalidLoginCredentialsError();
      }
      return { token: getToken(user.id, ctx.config.APP_SECRET) };
    },
    me: async (_parent, _args, ctx) => {
      return requireAuthorization(ctx.user);
    },
  },
  Mutation: {
    userCreate: async (_parent, args, ctx) => {
      requireAuthorization(ctx.user, { admin: true });
      return await ctx.dbConnection
        .getRepository(User)
        .create({
          id: uuidv4(),
          createdAt: new Date(),
          isAdmin: args.input.isAdmin,
          username: args.input.username,
          password: await hashPassword(args.input.password),
        })
        .save();
    },
  },
};
