import { IUser } from "./user.interface";

export interface IDailyReport {
  id?: string;
  userId: string;
  user?: IUser;
  reportDate: string;
  totalMinutesWorked: number;
  totalMinutesInSession: number;
  totalPopupsReceived: number;
  totalPopupsAnswered: number;
  correctAnswersCount: number;
  popupAccuracy: number;
  averageResponseTime: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  taskCompletionRate: number;
  productivityScore: number;
  stateBreakdown: Record<string, number>;
  qualifiesForFlexFriday: boolean;
  weeklyProductivityAverage: number;
  createdAt?: Date;
  updatedAt?: Date;
}
