import { TaskStatus } from "../utils/enums/TaskStatus";

export interface ITask {
  id?: string;
  assignedTo: string;
  status: TaskStatus;
  createdAt: Date;
  completedAt: Date;
  updatedAt?: Date;
}
