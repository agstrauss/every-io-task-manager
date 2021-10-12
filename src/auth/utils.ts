import { compare, hash } from "bcryptjs";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { UnauthorizedError } from "./errors";
import { User } from "./user.entity";

export const isPasswordValid = async (
  password: string,
  hashedPassword: string,
) => compare(password, hashedPassword);

export const getToken = (userId: string, appSecret: string) =>
  sign({ userId }, appSecret);

export const hashPassword = async (password: string) => hash(password, 10);

export const getUserFromToken = async (
  token: string,
  getUserById: (userId: string) => Promise<User | undefined>,
  appSecret: string,
) => {
  let verifiedToken: JwtPayload;
  try {
    verifiedToken = verify(token, appSecret) as JwtPayload;
  } catch (e) {
    return undefined;
  }
  const userId = String(verifiedToken.userId);
  return verifiedToken && userId ? await getUserById(userId) : undefined;
};

export const requireAuthorization = (
  user: User | undefined,
  { admin = false }: { admin?: boolean } = {},
) => {
  if (!user || (admin && !user.isAdmin)) {
    throw new UnauthorizedError();
  }
  return user;
};
