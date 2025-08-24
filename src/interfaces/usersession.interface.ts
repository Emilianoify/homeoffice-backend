export interface IUserSession {
  id?: string;
  userId: string;
  sessionStart: Date;
  sessionEnd: Date;
  totalMinutesWorked: number;
  stateTimeBreakdown: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}
