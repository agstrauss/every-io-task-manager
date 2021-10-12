import { Connection } from "typeorm";
import { Request } from "express";
import { User } from "./auth/user.entity";
import { getUserFromToken } from "./auth/utils";
import { AsyncReturnType } from "./utils/types";
import config from "./config";

export const createRequestContext = async (
  req: Request,
  dbConnection: Connection,
) => {
  const getUserById = async (id: string) =>
    dbConnection.getRepository(User).findOne({ where: { id } });
  const token = getTokenFromRequest(req);
  const user = token
    ? await getUserFromToken(token, getUserById, config.APP_SECRET)
    : undefined;

  return {
    dbConnection,
    config,
    user,
  };
};

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.get("Authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
};

export type RequestContext = AsyncReturnType<typeof createRequestContext>;
