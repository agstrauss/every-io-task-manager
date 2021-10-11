import { ApiError } from "./ApiError";

export class RecordNotFoundError extends ApiError {
  constructor(public entityName: string, public id: string) {
    super(`${entityName} with id ${id} not found`);
  }

  getPublicData() {
    return {
      entityName: this.entityName,
      id: this.id,
    };
  }
}
