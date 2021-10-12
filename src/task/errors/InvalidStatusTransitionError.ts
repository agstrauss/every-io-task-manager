import { ApiError } from "../../common/errors";
import { TaskStatus } from "../task.entity";

export class InvalidStatusTransitionError extends ApiError {
  constructor(
    public taskId: string,
    public statusFrom: TaskStatus,
    public statusTo: TaskStatus,
  ) {
    super(
      `Invalid status transition from ${statusFrom} to ${statusTo} for task ${taskId}`,
    );
  }

  getPublicData(): Record<string, unknown> {
    return {
      taskId: this.taskId,
      statusFrom: this.statusFrom,
      statusTo: this.statusTo,
    };
  }
}
