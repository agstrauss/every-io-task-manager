import { ApiError } from "../../common/errors";

export class UnauthorizedError extends ApiError {
  constructor() {
    super("Unauthorized");
  }
}
