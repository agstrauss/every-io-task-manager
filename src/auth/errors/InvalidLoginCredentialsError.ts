import { ApiError } from "../../common/errors";

export class InvalidLoginCredentialsError extends ApiError {
  constructor() {
    super("Invalid login credentials");
  }
}
